package main

import (
	"encoding/json"
	"fmt"
	"github/dis012/PDFAI/internal/database"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

type apiConfig struct {
	db          *database.Queries
	maxFileSize int64
	ollamaURL   string
}

const prompt = `Extract all relevant data and key details from the following text. Return the extracted information in a well-structured and
valid JSON format. Ensure the JSON includes clearly named fields that reflect the meaning and context of the information (e.g., names, dates, locations, events, values, quantities, descriptions, etc.).
Only return the JSON—do not include any explanations, commentary, or additional text. Text to extract from:`

func (cfg *apiConfig) uploadAndPromptHandler(w http.ResponseWriter, req *http.Request) {
	err := req.ParseMultipartForm(cfg.maxFileSize)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Limit file size to 50MB
	req.Body = http.MaxBytesReader(w, req.Body, 50<<20)

	file, handler, err := req.FormFile("pdf") // Handle in front end!!!
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(handler.Filename), ".pdf") {
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

	model_config := OllamaRequest{
		Model:  "gemma3n:e4b",
		Prompt: fmt.Sprintf("%v %v", prompt, email.EmailText),
		Stream: false,
	}

	model_response := OllamaResponse{}

	ollama_request, err := json.Marshal(model_config)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	req_body := strings.NewReader(string(ollama_request))
	r, err := http.NewRequest(http.MethodPost, cfg.ollamaURL, req_body)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := http.DefaultClient.Do(r)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer res.Body.Close()

	body_bytes, err := io.ReadAll(res.Body)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to read response body")
		return
	}

	err = json.Unmarshal(body_bytes, &model_response)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to unmarshal response body")
		return
	}

	jsonLlmResponse, mapLlmResponse, err := cleanJsonString(model_response.Response)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	_, err = cfg.db.CreateTableVersion(req.Context(), database.CreateTableVersionParams{
		SessionID:    uuid.NullUUID{UUID: session.ID, Valid: true},
		ResponseJson: jsonLlmResponse,
	})
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Failed to unmarshal response body")
		return
	}

	respondWithJson(w, http.StatusOK, mapLlmResponse)
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

	respondWithJson(w, http.StatusOK, table.ResponseJson)
}
