package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

func extractTextWithPdfToText(pdfData []byte) (string, error) {
	// Create a temporary file
	tempDir := os.TempDir()
	tempFile := filepath.Join(tempDir, fmt.Sprintf("temp_pdf_%d.pdf", time.Now().UnixNano()))

	// Write PDF data to temporary file
	err := os.WriteFile(tempFile, pdfData, 0644)
	if err != nil {
		return "", fmt.Errorf("failed to write temporary PDF file: %v", err)
	}
	defer os.Remove(tempFile) // Clean up

	// Use pdftotext command
	cmd := exec.Command("pdftotext", tempFile, "-")
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("pdftotext command failed: %v", err)
	}

	return strings.TrimSpace(string(output)), nil
}
