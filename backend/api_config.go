package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"github/dis012/PDFAI/internal/database"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"google.golang.org/genai"
)

type apiConfig struct {
	db *database.Queries
	//ollamaURL string
}

const prompt = `Extract all relevant data and key details from the following text. Return the extracted information in a well-structured and
valid JSON format. Ensure the JSON includes clearly named fields that reflect the meaning and context of the information (e.g., names, dates, locations, events, values, quantities, descriptions, etc.).
Only return the JSON—do not include any explanations, commentary, or additional text. Text to extract from:`

const updateTablePrompt = `You are an AI assistant that modifies a JSON object based on a user's request. Your task is to apply the user's change and return the entire, updated, and valid JSON object.
Maintain the original structure of the JSON. Only modify the data as requested by the user's instruction.
Do not add any commentary, explanations, or markdown fences like json. No matter what happens DO NOT respond with anything else then JSON. Only output the final JSON. I will provide you with the email, current json table and users new request:`

const replyToEmailPrompt = `You are an assistant skilled in professional communication. Your task is to draft a clear, concise, and appropriate reply to the email provided at the end of this prompt user also provided you with informations to include in the reply.
Instructions:
- Address the sender appropriately based on their tone and role.
- Acknowledge any questions, requests, or concerns in the email.
- Provide helpful, professional responses using a polite and confident tone.
- If more information is needed to respond, politely request clarification.
- Keep the reply well-structured: use paragraphs, bullets, or numbering where helpful.
- Sign off with an appropriate closing.
- Consider the information that user wants to address in the reply
Now, reply to the following email and include users requests specified at the end:`

const editReply = `You are an assistant skilled in professional communication. User wants you to edit the reply you created. Bellow the following data will be specified:
- Email
- Reply that user wants you to fix
- How to fix it
Now create a new better reply based on users needs.
`

func (cfg *apiConfig) uploadAndPromptHandler(w http.ResponseWriter, req *http.Request) {
	// Limit file size to 50MB
	err := req.ParseMultipartForm(10 << 20)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	file, header, err := req.FormFile("pdf") // Handle in front end!!!
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		respondWithError(w, http.StatusBadRequest, "Only PDF files are allowed")
		return
	}

	// Convert pdf to text
	fmt.Println("Reading file bytes...")
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to read uploaded file")
		return
	}
	fmt.Printf("File bytes read successfully, size: %d\n", len(fileBytes))

	fmt.Println("Extracting text from PDF...")
	text, err := extractTextWithPdfToText(fileBytes)
	if err != nil {
		fmt.Printf("Error extracting text: %v\n", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to extract text from PDF")
		return
	}
	fmt.Printf("Text extracted successfully, length: %d\n", len(text))

	email, err := cfg.db.CreateEmail(req.Context(), text)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	session, err := cfg.db.CreateNewSession(req.Context(), email.ID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.0-flash",
		genai.Text(fmt.Sprintf("%v %v", prompt, email.EmailText)),
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}

	// model_config := OllamaRequest{
	// 	Model:  "gemma3n:e2b",
	// 	Prompt: fmt.Sprintf("%v %v", prompt, email.EmailText),
	// 	Stream: false,
	// }

	// model_response := OllamaResponse{}

	// ollama_request, err := json.Marshal(model_config)
	// if err != nil {
	// 	respondWithError(w, http.StatusBadRequest, err.Error())
	// 	return
	// }

	// req_body := strings.NewReader(string(ollama_request))
	// r, err := http.NewRequest(http.MethodPost, cfg.ollamaURL, req_body)
	// if err != nil {
	// 	respondWithError(w, http.StatusBadRequest, err.Error())
	// 	return
	// }

	// res, err := http.DefaultClient.Do(r)
	// if err != nil {
	// 	respondWithError(w, http.StatusBadRequest, err.Error())
	// 	return
	// }
	// defer res.Body.Close()

	// body_bytes, err := io.ReadAll(res.Body)
	// if err != nil {
	// 	respondWithError(w, http.StatusInternalServerError, "Failed to read response body")
	// 	return
	// }

	// err = json.Unmarshal(body_bytes, &model_response)
	// if err != nil {
	// 	respondWithError(w, http.StatusInternalServerError, "Failed to unmarshal response body")
	// 	return
	// }

	jsonLlmResponse, mapLlmResponse, err := cleanJsonString(result.Text())
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	_, err = cfg.db.CreateTableVersion(req.Context(), database.CreateTableVersionParams{
		SessionID:    uuid.NullUUID{UUID: session.ID, Valid: true},
		ResponseJson: jsonLlmResponse,
	})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Failed to create table version")
		return
	}

	// Return session info and formatted table data
	type uploadResponse struct {
		SessionID uuid.UUID                `json:"session_id"`
		Title     string                   `json:"title"`
		TableRows []map[string]interface{} `json:"table_rows"`
	}

	response := uploadResponse{
		SessionID: session.ID,
		Title:     "New email",
		TableRows: formatTableData(mapLlmResponse),
	}

	respondWithJson(w, http.StatusOK, response)
}

func (cfg *apiConfig) getSessions(w http.ResponseWriter, req *http.Request) {
	type response_param struct {
		Title     string    `json:"title"`
		ID        uuid.UUID `json:"id"`
		CreatedAt time.Time `json:"created_at"`
	}

	sessions_response := []response_param{}
	sessions, err := cfg.db.GetAllSessions(req.Context())
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	for i, session := range sessions {
		sessions_response = append(sessions_response, response_param{
			Title:     fmt.Sprintf("Email number %v", i+1),
			ID:        session.ID,
			CreatedAt: session.CreatedAt,
		})
	}

	respondWithJson(w, http.StatusOK, sessions_response)
}

func (cfg *apiConfig) getTableSession(w http.ResponseWriter, req *http.Request) {
	sessionId, err := uuid.Parse(req.PathValue("session_id"))
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Session not found")
		return
	}

	table, err := cfg.db.GetTableBasedOnSession(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get latest version for version metadata
	latestVersionInterface, err := cfg.db.GetLatestVersionNumber(req.Context(), table.SessionID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Convert interface{} to int32, handling different possible types
	var latestVersion int32
	switch v := latestVersionInterface.(type) {
	case int32:
		latestVersion = v
	case int64:
		latestVersion = int32(v)
	case int:
		latestVersion = int32(v)
	default:
		respondWithError(w, http.StatusInternalServerError, fmt.Sprintf("Unexpected version number type: %T", latestVersionInterface))
		return
	}

	// Parse the JSON response
	var tableData map[string]interface{}
	err = json.Unmarshal(table.ResponseJson, &tableData)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to parse table data")
		return
	}

	// Create response with formatted table data and separate metadata
	type tableResponse struct {
		TableRows     []map[string]interface{} `json:"table_rows"`
		VersionNumber int32                    `json:"version_number"`
		CanUndo       bool                     `json:"can_undo"`
		CanRedo       bool                     `json:"can_redo"`
	}

	response := tableResponse{
		TableRows:     formatTableData(tableData),
		VersionNumber: table.VersionNumber,
		CanUndo:       table.VersionNumber > 1,
		CanRedo:       table.VersionNumber < latestVersion,
	}

	respondWithJson(w, http.StatusOK, response)
}

func (cfg *apiConfig) updateTable(w http.ResponseWriter, req *http.Request) {
	type request_params struct {
		Prompt string `json:"prompt"`
	}

	params := request_params{}
	decoder := json.NewDecoder(req.Body)
	err := decoder.Decode(&params)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	sessionId, err := uuid.Parse(req.PathValue("session_id"))
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Session not found")
		return
	}

	session, err := cfg.db.GetSessionById(req.Context(), sessionId)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	email, err := cfg.db.GetEmailById(req.Context(), session.EmailID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	table, err := cfg.db.GetTableBasedOnSession(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.0-flash",
		genai.Text(fmt.Sprintf("%v\n %v\n %v\n %v", updateTablePrompt, email, string(table.ResponseJson), params.Prompt)),
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}

	// model_config := OllamaRequest{
	// 	Model:  "gemma3n:e4b",
	// 	Prompt: fmt.Sprintf("%v\n %v\n %v\n %v", updateTablePrompt, email, string(table.ResponseJson), params.Prompt),
	// 	Stream: false,
	// }

	// model_response := OllamaResponse{}

	// ollama_request, err := json.Marshal(model_config)
	// if err != nil {
	// 	respondWithError(w, http.StatusBadRequest, err.Error())
	// 	return
	// }

	// req_body := strings.NewReader(string(ollama_request))
	// r, err := http.NewRequest(http.MethodPost, cfg.ollamaURL, req_body)
	// if err != nil {
	// 	respondWithError(w, http.StatusBadRequest, err.Error())
	// 	return
	// }

	// res, err := http.DefaultClient.Do(r)
	// if err != nil {
	// 	respondWithError(w, http.StatusBadRequest, err.Error())
	// 	return
	// }
	// defer res.Body.Close()

	// body_bytes, err := io.ReadAll(res.Body)
	// if err != nil {
	// 	respondWithError(w, http.StatusInternalServerError, "Failed to read response body")
	// 	return
	// }

	// err = json.Unmarshal(body_bytes, &model_response)
	// if err != nil {
	// 	respondWithError(w, http.StatusInternalServerError, "Failed to unmarshal response body")
	// 	return
	// }

	jsonLlmResponse, mapLlmResponse, err := cleanJsonString(result.Text())
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	err = cfg.db.DisableCurrentTable(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	_, err = cfg.db.UpdateTableVersion(req.Context(), database.UpdateTableVersionParams{
		SessionID:    uuid.NullUUID{UUID: sessionId, Valid: true},
		ResponseJson: jsonLlmResponse,
	})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get updated table info to include version metadata
	updatedTable, err := cfg.db.GetTableBasedOnSession(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get the latest version number to determine if redo is available
	latestVersionInterface, err := cfg.db.GetLatestVersionNumber(req.Context(), updatedTable.SessionID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Convert interface{} to int32, handling different possible types
	var latestVersion int32
	switch v := latestVersionInterface.(type) {
	case int32:
		latestVersion = v
	case int64:
		latestVersion = int32(v)
	case int:
		latestVersion = int32(v)
	default:
		respondWithError(w, http.StatusInternalServerError, fmt.Sprintf("Unexpected version number type: %T", latestVersionInterface))
		return
	}

	// Create response with formatted table data and metadata
	type updateResponse struct {
		TableRows     []map[string]interface{} `json:"table_rows"`
		VersionNumber int32                    `json:"version_number"`
		CanUndo       bool                     `json:"can_undo"`
		CanRedo       bool                     `json:"can_redo"`
	}

	response := updateResponse{
		TableRows:     formatTableData(mapLlmResponse),
		VersionNumber: updatedTable.VersionNumber,
		CanUndo:       updatedTable.VersionNumber > 1,
		CanRedo:       updatedTable.VersionNumber < latestVersion,
	}

	respondWithJson(w, http.StatusOK, response)
}

func (cfg *apiConfig) undoTableVersion(w http.ResponseWriter, req *http.Request) {
	sessionId, err := uuid.Parse(req.PathValue("session_id"))
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Session not found")
		return
	}

	table, err := cfg.db.GetTableBasedOnSession(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	if table.VersionNumber == 1 {
		respondWithError(w, http.StatusBadRequest, "No older version available")
		return
	}

	err = cfg.db.DisableCurrentTable(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	response, err := cfg.db.ChangeVersion(req.Context(), database.ChangeVersionParams{
		SessionID:     table.SessionID,
		VersionNumber: table.VersionNumber - 1,
	})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	var responseMap map[string]interface{}
	err = json.Unmarshal([]byte(response), &responseMap)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get updated table info for version metadata
	updatedTable, err := cfg.db.GetTableBasedOnSession(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get latest version for redo capability
	latestVersionInterface, err := cfg.db.GetLatestVersionNumber(req.Context(), updatedTable.SessionID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Convert interface{} to int32, handling different possible types (undo function)
	var latestVersion int32
	switch v := latestVersionInterface.(type) {
	case int32:
		latestVersion = v
	case int64:
		latestVersion = int32(v)
	case int:
		latestVersion = int32(v)
	default:
		respondWithError(w, http.StatusInternalServerError, fmt.Sprintf("Unexpected version number type: %T", latestVersionInterface))
		return
	}

	// Create response with formatted table data and metadata
	type undoResponse struct {
		TableRows     []map[string]interface{} `json:"table_rows"`
		VersionNumber int32                    `json:"version_number"`
		CanUndo       bool                     `json:"can_undo"`
		CanRedo       bool                     `json:"can_redo"`
	}

	undoResp := undoResponse{
		TableRows:     formatTableData(responseMap),
		VersionNumber: updatedTable.VersionNumber,
		CanUndo:       updatedTable.VersionNumber > 1,
		CanRedo:       updatedTable.VersionNumber < latestVersion,
	}

	respondWithJson(w, http.StatusOK, undoResp)
}

func (cfg *apiConfig) redoTableVersion(w http.ResponseWriter, req *http.Request) {
	sessionId, err := uuid.Parse(req.PathValue("session_id"))
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Session not found")
		return
	}

	table, err := cfg.db.GetTableBasedOnSession(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	currentNewestVersion, err := cfg.db.GetLatestVersionNumber(req.Context(), table.SessionID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	if table.VersionNumber == currentNewestVersion {
		respondWithError(w, http.StatusBadRequest, "You have reached the max table version")
		return
	}

	err = cfg.db.DisableCurrentTable(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	response, err := cfg.db.ChangeVersion(req.Context(), database.ChangeVersionParams{
		SessionID:     table.SessionID,
		VersionNumber: table.VersionNumber + 1,
	})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	var responseMap map[string]interface{}
	err = json.Unmarshal([]byte(response), &responseMap)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get updated table info for version metadata
	updatedTable, err := cfg.db.GetTableBasedOnSession(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get latest version for redo capability
	latestVersionInterface, err := cfg.db.GetLatestVersionNumber(req.Context(), updatedTable.SessionID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Convert interface{} to int32, handling different possible types (redo function)
	var latestVersion int32
	switch v := latestVersionInterface.(type) {
	case int32:
		latestVersion = v
	case int64:
		latestVersion = int32(v)
	case int:
		latestVersion = int32(v)
	default:
		respondWithError(w, http.StatusInternalServerError, fmt.Sprintf("Unexpected version number type: %T", latestVersionInterface))
		return
	}

	// Create response with formatted table data and metadata
	type redoResponse struct {
		TableRows     []map[string]interface{} `json:"table_rows"`
		VersionNumber int32                    `json:"version_number"`
		CanUndo       bool                     `json:"can_undo"`
		CanRedo       bool                     `json:"can_redo"`
	}

	redoResp := redoResponse{
		TableRows:     formatTableData(responseMap),
		VersionNumber: updatedTable.VersionNumber,
		CanUndo:       updatedTable.VersionNumber > 1,
		CanRedo:       updatedTable.VersionNumber < latestVersion,
	}

	respondWithJson(w, http.StatusOK, redoResp)
}

func (cfg *apiConfig) createReply(w http.ResponseWriter, req *http.Request) {
	type request_params struct {
		Prompt string `json:"prompt"`
	}

	params := request_params{}
	decoder := json.NewDecoder(req.Body)
	err := decoder.Decode(&params)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	sessionId, err := uuid.Parse(req.PathValue("session_id"))
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Session not found")
		return
	}

	session, err := cfg.db.GetSessionById(req.Context(), sessionId)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	email, err := cfg.db.GetEmailById(req.Context(), session.EmailID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.0-flash",
		genai.Text(fmt.Sprintf("%v\n %v\n %v\n", replyToEmailPrompt, email, params.Prompt)),
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}

	chat, err := cfg.db.SaveNewChat(req.Context(), database.SaveNewChatParams{
		SessionID: uuid.NullUUID{UUID: sessionId, Valid: true},
		Prompt:    sql.NullString{String: params.Prompt, Valid: true},
		Response:  sql.NullString{String: result.Text(), Valid: true},
	})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJson(w, http.StatusOK, chat)
}

func (cfg *apiConfig) editReply(w http.ResponseWriter, req *http.Request) {
	type request_params struct {
		Prompt string `json:"prompt"`
	}

	params := request_params{}
	decoder := json.NewDecoder(req.Body)
	err := decoder.Decode(&params)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	sessionId, err := uuid.Parse(req.PathValue("session_id"))
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Session not found")
		return
	}

	session, err := cfg.db.GetSessionById(req.Context(), sessionId)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	email, err := cfg.db.GetEmailById(req.Context(), session.EmailID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	chat, err := cfg.db.GetChatHistory(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.0-flash",
		genai.Text(fmt.Sprintf("%v\n %v\n %v\n %v", editReply, email, chat.Response, params.Prompt)),
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}

	newChat, err := cfg.db.UpdateTable(req.Context(), database.UpdateTableParams{
		Response: sql.NullString{String: result.Text(), Valid: true},
		ID:       chat.ID,
	})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJson(w, http.StatusOK, newChat)
}

func (cfg *apiConfig) getChat(w http.ResponseWriter, req *http.Request) {
	sessionId, err := uuid.Parse(req.PathValue("session_id"))
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Session not found")
		return
	}

	chat, err := cfg.db.GetChatHistory(req.Context(), uuid.NullUUID{UUID: sessionId, Valid: true})

	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJson(w, http.StatusOK, chat)
}
