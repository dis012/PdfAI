package main

import (
	"database/sql"
	"fmt"
	"github/dis012/PDFAI/internal/database"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	const port = ":8080"

	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}

	dbUrl := os.Getenv("DB_URL")
	ollamaEndpoint := os.Getenv("OLLAMA_ENDPOINT")

	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal(err)
	}

	dbQueries := database.New(db)

	apiConfig := &apiConfig{
		db:          dbQueries,
		maxFileSize: 50,
		ollamaURL:   ollamaEndpoint,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/upload", apiConfig.uploadAndPromptHandler)

	mux.HandleFunc("GET /api/sessions", apiConfig.getSessions)
	mux.HandleFunc("GET /api/tables/{session_id}", apiConfig.getTableSession)

	server := &http.Server{
		Addr:    port,
		Handler: mux,
	}

	fmt.Printf("Starting server on http://localhost%s\n", port)
	err = server.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
