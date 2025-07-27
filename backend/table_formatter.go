package main

import (
	"fmt"
	"strings"
)

// Helper function to format field names for display
func formatFieldName(fieldName string) string {
	// Split by dot notation
	parts := strings.Split(fieldName, ".")

	// Remove duplicate consecutive parts
	var cleaned []string
	for i, part := range parts {
		if i == 0 || part != parts[i-1] {
			cleaned = append(cleaned, part)
		}
	}

	// Capitalize each word
	for i, part := range cleaned {
		part = strings.ReplaceAll(part, "_", " ") // change snake_case to words
		words := strings.Fields(part)
		for j, word := range words {
			words[j] = strings.Title(word)
		}
		cleaned[i] = strings.Join(words, " ")
	}

	// Optional: only keep the last 2 parts to shorten the name
	if len(cleaned) > 2 {
		cleaned = cleaned[len(cleaned)-2:]
	}

	return strings.Join(cleaned, " ")
}

// Helper function to flatten nested objects into dot notation
func flattenObject(data map[string]interface{}, prefix string) map[string]interface{} {
	result := make(map[string]interface{})

	for key, value := range data {
		var newKey string
		if prefix == "" {
			newKey = key
		} else {
			newKey = prefix + "." + key
		}

		switch v := value.(type) {
		case map[string]interface{}:
			// Recursively flatten nested objects
			flattened := flattenObject(v, newKey)
			for k, val := range flattened {
				result[k] = val
			}
		case []interface{}:
			// Handle arrays by converting them to comma-separated strings
			var items []string
			for _, item := range v {
				if itemMap, ok := item.(map[string]interface{}); ok {
					// For objects in arrays, convert to JSON-like string
					items = append(items, fmt.Sprintf("%v", itemMap))
				} else {
					items = append(items, fmt.Sprintf("%v", item))
				}
			}
			result[newKey] = strings.Join(items, ", ")
		default:
			// For primitive values, store as-is
			result[newKey] = value
		}
	}

	return result
}

// Helper function to convert table data to formatted rows
func formatTableData(data map[string]interface{}) []map[string]interface{} {
	var rows []map[string]interface{}

	// First, flatten the nested structure
	flattened := flattenObject(data, "")

	// Then convert to the expected frontend format
	for key, value := range flattened {
		row := map[string]interface{}{
			"field": formatFieldName(key),
			"value": value,
		}
		rows = append(rows, row)
	}

	return rows
}
