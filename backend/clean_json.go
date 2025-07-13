package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"unicode/utf8"
)

func cleanJsonString(llmOutputString string) ([]byte, map[string]interface{}, error) {
	// Debug: Print the raw response
	//fmt.Printf("Raw LLM response: %q\n", llmOutputString)

	// Check if the string is valid UTF-8
	if !utf8.ValidString(llmOutputString) {
		return nil, nil, fmt.Errorf("LLM response contains invalid UTF-8 characters")
	}

	cleanJsonString := strings.TrimSpace(llmOutputString)
	cleanJsonString = strings.TrimPrefix(cleanJsonString, "```json")
	cleanJsonString = strings.TrimPrefix(cleanJsonString, "```")
	cleanJsonString = strings.TrimSuffix(cleanJsonString, "```")
	cleanJsonString = strings.TrimSpace(cleanJsonString)

	// Debug: Print the cleaned response
	//fmt.Printf("Cleaned JSON string: %q\n", cleanJsonString)

	var jsonDataMap map[string]interface{}
	err := json.Unmarshal([]byte(cleanJsonString), &jsonDataMap)
	if err != nil {
		// Provide more context about the error
		return nil, nil, fmt.Errorf("failed to unmarshal JSON: %v, input was: %q", err, cleanJsonString)
	}

	jsonBytes, err := json.Marshal(jsonDataMap)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to marshal JSON back: %v", err)
	}

	return jsonBytes, jsonDataMap, nil
}
