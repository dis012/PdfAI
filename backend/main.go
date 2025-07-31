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
	//ollamaEndpoint := os.Getenv("OLLAMA_ENDPOINT")

	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal(err)
	}

	dbQueries := database.New(db)

	apiConfig := &apiConfig{
		db: dbQueries,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/upload", apiConfig.uploadAndPromptHandler)
	mux.HandleFunc("POST /api/chat/{session_id}", apiConfig.createReply)

	mux.HandleFunc("GET /api/sessions", apiConfig.getSessions)
	mux.HandleFunc("GET /api/tables/{session_id}", apiConfig.getTableSession)
	mux.HandleFunc("GET /api/chat/{session_id}", apiConfig.getChat)

	mux.HandleFunc("PUT /api/tables/{session_id}", apiConfig.updateTable)
	mux.HandleFunc("PUT /api/tables/undo/{session_id}", apiConfig.undoTableVersion)
	mux.HandleFunc("PUT /api/tables/redo/{session_id}", apiConfig.redoTableVersion)
	mux.HandleFunc("PUT /api/chat/{session_id}", apiConfig.editReply)

	// Health check endpoint
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Wrap the mux with CORS middleware
	handler := corsMiddleware(mux)

	server := &http.Server{
		Addr:    port,
		Handler: handler,
	}

	fmt.Printf("Starting server on http://localhost%s\n", port)
	err = server.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
