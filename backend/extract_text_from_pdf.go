package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
)

func extractTextWithPdfToText(pdfData []byte) (string, error) {
	// Create multipart form data
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	// Create form file field
	fileWriter, err := writer.CreateFormFile("file", "document.pdf")
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %v", err)
	}

	// Write PDF data to form
	_, err = fileWriter.Write(pdfData)
	if err != nil {
		return "", fmt.Errorf("failed to write PDF data to form: %v", err)
	}

	// Close the writer
	err = writer.Close()
	if err != nil {
		return "", fmt.Errorf("failed to close multipart writer: %v", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", "http://localhost:8000/extract-pdf-data/", &requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to create HTTP request: %v", err)
	}

	// Set content type
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send HTTP request: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %v", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP request failed with status %d: %s", resp.StatusCode, string(responseBody))
	}

	// Parse JSON response
	var response struct {
		Status string `json:"status"`
		Data   string `json:"data"`
	}

	err = json.Unmarshal(responseBody, &response)
	if err != nil {
		return "", fmt.Errorf("failed to parse JSON response: %v", err)
	}

	if response.Status != "success" {
		return "", fmt.Errorf("API returned error status: %s", response.Status)
	}

	return strings.TrimSpace(response.Data), nil
}
