# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PdfAI is a full-stack application for AI-powered PDF processing and email analysis. It extracts structured data from PDFs, enables intelligent chat interactions with documents, and generates professional email replies using Google Gemini AI.

## Architecture

Multi-service architecture with three main components:

1. **Go Backend** (Port 8080) - Main API server handling business logic and database operations
2. **Python Backend** (Port 8001) - FastAPI service dedicated to PDF text extraction using PyMuPDF
3. **React Frontend** (Port 3000) - Vite-based UI
4. **PostgreSQL** (Port 5432) - Database for sessions, emails, chats, and table versions

### Service Communication Flow

```
Frontend -> Go Backend -> Python Backend (for PDF extraction)
         -> Go Backend -> Gemini AI (for data extraction/chat)
         -> Go Backend -> PostgreSQL
```

The Go backend acts as the orchestrator, routing PDF files to the Python service for text extraction, then sending the extracted text to Gemini AI for structured data extraction and chat responses.

## Database Schema

Key tables and their relationships:

- `emails` - Stores original PDF text content
  - Referenced by sessions (one-to-many)
- `sessions` - User sessions linked to emails
  - Has many table_versions (versioning system)
  - Has one active chat
- `table_version` - Version history for undo/redo functionality
  - Contains JSON data extracted from PDFs
  - Tracks version_number and is_active state
- `chat` - Chat history for email replies
  - Linked to sessions

The versioning system allows users to undo/redo changes to extracted table data by toggling `is_active` flags and navigating version numbers.

## Key Workflows

### PDF Upload and Processing

1. Frontend sends PDF to Go backend (`POST /api/upload`)
2. Go backend extracts raw text by calling Python backend (`POST /extract-pdf-data/`)
3. Go backend sends extracted text to Gemini AI with structured extraction prompt
4. JSON response is cleaned and stored in `table_version` table (version 1)
5. Session is created and linked to the email

### Table Updates with AI

1. User submits natural language request to modify table (`PUT /api/tables/{session_id}`)
2. Go backend retrieves current table JSON and original email text
3. Sends to Gemini with `updateTablePrompt` asking to modify JSON based on user request
4. Disables current table version (`is_active = false`)
5. Creates new version with incremented version_number
6. Returns updated table with undo/redo metadata

### Undo/Redo System

- Versions are never deleted, only marked inactive
- Undo: Disable current version, activate previous version_number
- Redo: Disable current version, activate next version_number
- API returns `can_undo` and `can_redo` flags based on current vs latest version

## Development Commands

### Docker (Recommended)

```bash
# Start all services
./start-docker.sh         # Linux/macOS
start-docker.bat          # Windows

# View logs
docker-compose logs -f
docker-compose logs -f go_backend
docker-compose logs -f python_backend

# Stop services
./stop-docker.sh          # Linux/macOS
stop-docker.bat           # Windows

# Rebuild specific service
docker-compose up --build go_backend

# Database access
docker-compose exec postgres psql -U pdfai_user -d pdfai

# Complete reset (removes data)
docker-compose down -v
```

### Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev        # Development server
npm run build      # Production build
npm run lint       # Lint code
```

**Go Backend:**
```bash
cd backend
# Requires .env file with DB_URL and GEMINI_API_KEY
go run .
go build          # Compile binary
```

**Python Backend:**
```bash
cd backend/app
pip install -r ../requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Database Migrations

Uses Goose for migrations. Schema files in `backend/sql/schema/`:
- 001_email.sql
- 002_session.sql
- 003_table_version.sql
- 004_chat.sql

For Docker: migrations consolidated in `backend/sql/init.sql` (auto-run on container start)

## Environment Configuration

**Required Environment Variables:**

```bash
# Go Backend (.env or .env.docker)
GEMINI_API_KEY=your_api_key_here          # Required - Google Gemini API key
DB_URL=postgres://user:pass@host:5432/db  # PostgreSQL connection string
PYTHON_API_URL=http://python_backend:8001 # Python service URL (Docker) or http://localhost:8001 (local)

# Frontend (Vite)
VITE_API_URL=http://localhost:8080        # Go backend URL
VITE_PYTHON_API_URL=http://localhost:8001 # Python backend URL (not actively used by frontend)
```

**IMPORTANT:** Before running the application, you MUST set a valid `GEMINI_API_KEY` in `backend/.env.docker` or `backend/.env`

## API Endpoints (Go Backend)

```
POST   /api/upload                     - Upload PDF, extract data, create session
GET    /api/sessions                   - List all sessions
GET    /api/tables/{session_id}        - Get table data with version metadata
PUT    /api/tables/{session_id}        - Update table via AI (creates new version)
PUT    /api/tables/undo/{session_id}   - Undo to previous version
PUT    /api/tables/redo/{session_id}   - Redo to next version
POST   /api/chat/{session_id}          - Create email reply
GET    /api/chat/{session_id}          - Get chat history
PUT    /api/chat/{session_id}          - Edit existing reply
GET    /health                         - Health check
```

## Code Organization

### Go Backend Structure

- `main.go` - Entry point, route definitions, server setup
- `api_config.go` - Handler implementations (upload, chat, table operations)
- `structs.go` - Request/response type definitions
- `extract_text_from_pdf.go` - PDF text extraction logic (calls Python service)
- `clean_json.go` - JSON parsing and cleaning utilities
- `table_formatter.go` - Converts AI JSON responses to frontend table format
- `json_respond.go` - HTTP response helpers
- `cors.go` - CORS middleware
- `internal/database/` - SQLC generated code for database queries

### Python Backend

- `app/main.py` - FastAPI app with `/extract-pdf-data/` endpoint
- `app/pdf_to_prompt.py` - PyMuPDF wrapper for text extraction

### Frontend Components

Located in `frontend/src/components/`:
- `MainContent.jsx` - Primary container managing table and chat views
- `TableDisplay.jsx` - Renders extracted JSON data as table
- `EditControls.jsx` - Undo/redo/update functionality
- `ReplyControls.jsx` - Chat interface for email replies
- `Sidebar.jsx` - Session list
- `TabBar.jsx` / `TabContent.jsx` - Tab navigation (Table vs Reply)

## Important Implementation Details

### AI Prompts

The Go backend defines critical prompts as constants in `api_config.go`:
- `prompt` - Initial extraction: "Extract all relevant data... return JSON"
- `updateTablePrompt` - Table modifications: "modify JSON based on user's request"
- `replyToEmailPrompt` - Email reply generation
- `editReply` - Reply editing

These prompts are sent to Gemini AI (model: `gemini-2.0-flash`) with context (email text, current JSON, user request).

### JSON Response Cleaning

AI responses often contain markdown fences or extra text. The `cleanJsonString()` function:
1. Strips markdown code blocks (```json, ```)
2. Validates and parses JSON
3. Returns both raw JSON bytes and parsed map

### Table Formatting

`formatTableData()` converts nested JSON objects into a flat array of key-value rows for frontend display:
```go
{"name": "John", "age": 30} -> [{"key": "name", "value": "John"}, {"key": "age", "value": 30}]
```

### Version Metadata

All table responses include:
- `version_number` - Current version
- `can_undo` - Boolean (version > 1)
- `can_redo` - Boolean (version < latest version)

## Testing

Test PDFs are located in `backend/TestCases/` and mounted as Docker volumes for both Go and Python services.

## Common Issues

1. **Gemini API errors**: Check `GEMINI_API_KEY` is set correctly in environment file
2. **Python service connection refused**: Ensure `PYTHON_API_URL` points to correct host (use service name in Docker, localhost for local dev)
3. **Database connection errors**: Verify PostgreSQL is healthy (`docker-compose ps`) and DB_URL uses correct host (use `postgres` service name in Docker)
4. **Port conflicts**: Ensure 3000, 8080, 8001, 5432 are available

## Technology Stack

- **Backend**: Go 1.x with net/http stdlib, SQLC for type-safe SQL, Google Generative AI SDK
- **Python**: FastAPI, PyMuPDF (pymupdf)
- **Frontend**: React 19, Vite 7
- **Database**: PostgreSQL 15
- **AI**: Google Gemini 2.0 Flash model
- **Deployment**: Docker Compose
