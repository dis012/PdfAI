package main

import (
	"strings"
)

// Helper function to format field names for display
func formatFieldName(fieldName string) string {
	// Replace underscores with spaces
	formatted := strings.ReplaceAll(fieldName, "_", " ")

	// Capitalize first letter of each word
	words := strings.Fields(formatted)
	for i, word := range words {
		if len(word) > 0 {
			words[i] = strings.ToUpper(word[:1]) + word[1:]
		}
	}

	return strings.Join(words, " ")
}

// Helper function to convert table data to formatted rows
func formatTableData(data map[string]interface{}) []map[string]interface{} {
	var rows []map[string]interface{}

	for key, value := range data {
		row := map[string]interface{}{
			"field": formatFieldName(key),
			"value": value,
		}
		rows = append(rows, row)
	}

	return rows
}
