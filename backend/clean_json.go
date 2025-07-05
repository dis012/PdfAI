package main

import (
	"encoding/json"
	"strings"
)

func cleanJsonString(llmOutputString string) ([]byte, map[string]interface{}, error) {
	cleanJsonString := strings.TrimSpace(llmOutputString)
	cleanJsonString = strings.TrimPrefix(cleanJsonString, "```json")
	cleanJsonString = strings.TrimPrefix(cleanJsonString, "```")
	cleanJsonString = strings.TrimSuffix(cleanJsonString, "```")
	cleanJsonString = strings.TrimSpace(cleanJsonString)

	var jsonDataMap map[string]interface{}
	err := json.Unmarshal([]byte(cleanJsonString), &jsonDataMap)
	if err != nil {
		return nil, nil, err
	}

	jsonBytes, err := json.Marshal(jsonDataMap)
	if err != nil {
		return nil, nil, err
	}

	return jsonBytes, jsonDataMap, nil
}
