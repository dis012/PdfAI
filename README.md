# PdfAI 📄🤖

A powerful full-stack application for AI-powered PDF processing and analysis. Upload PDFs, extract structured data, and interact with your documents through an intelligent chat interface.

## 🌟 Features

- **PDF Text Extraction**: Advanced PDF processing with text extraction capabilities
- **AI-Powered Analysis**: Leverage Google Gemini AI for intelligent document analysis
- **Interactive Chat**: Ask questions about your PDF content
- **Data Visualization**: Extract and display structured data in tables
- **Session Management**: Keep track of your document processing sessions
- **Real-time Processing**: Fast and efficient document processing pipeline

## 🏗️ Architecture

This application consists of multiple microservices:

- **Frontend**: React.js with Vite for a modern, responsive UI
- **Go Backend**: High-performance API server handling requests and database operations
- **Python Backend**: Specialized PDF processing service with FastAPI
- **PostgreSQL**: Reliable database for storing sessions, chats, and extracted data
- **Docker**: Containerized deployment for easy setup and scalability

## 🚀 Quick Start

### Prerequisites

- Docker Desktop
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd PdfAI
   ```

2. **Configure environment variables**
   
   Update the Gemini API key in `backend/.env.docker`:
   ```bash
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Start the application**
   ```bash
   # On Windows
   ./start-docker.bat
   
   # On Linux/macOS
   ./start-docker.sh
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Go Backend API: http://localhost:8080
   - Python Backend API: http://localhost:8001
   - PostgreSQL: localhost:5432

## 📊 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   React UI      │◄──►│   Go Backend    │◄──►│  PostgreSQL DB  │
│   (Port 3000)   │    │   (Port 8080)   │    │   (Port 5432)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────┬───────┘    └─────────────────┘
                                 │
                                 ▼
                       ┌─────────────────┐
                       │                 │
                       │ Python Backend  │
                       │   (Port 8001)   │
                       │                 │
                       └─────────────────┘
```

## 🛠️ Development

### Environment Variables

The application uses the following key environment variables:

- `GEMINI_API_KEY`: Your Google Gemini API key
- `DB_URL`: PostgreSQL connection string
- `PYTHON_API_URL`: URL for the Python backend service
- `OLLAMA_ENDPOINT`: Ollama service endpoint (if using local LLM)

### Database Schema

The application uses PostgreSQL with the following main tables:
- `emails`: Session metadata
- `sessions`: User sessions
- `chat`: Chat history and interactions
- `table_version`: Data versioning for undo/redo functionality

### API Endpoints

#### Go Backend (Port 8080)
- `POST /api/upload` - Upload and process PDF
- `POST /api/chat/{session_id}` - Create chat reply
- `GET /api/sessions` - Get all sessions
- `GET /api/tables/{session_id}` - Get table data for session
- `GET /api/chat/{session_id}` - Get chat history
- `PUT /api/tables/{session_id}` - Update table data
- `PUT /api/tables/undo/{session_id}` - Undo table changes
- `PUT /api/tables/redo/{session_id}` - Redo table changes
- `PUT /api/chat/{session_id}` - Edit chat reply

#### Python Backend (Port 8001)
- `POST /extract-pdf-data/` - Extract text from PDF files

## 🐳 Docker Commands

### Start Services
```bash
# Start all services
docker-compose up -d

# Start with rebuild
docker-compose up --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f go_backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Development Commands
```bash
# Rebuild specific service
docker-compose build go_backend

# Restart specific service
docker-compose restart python_backend

# Check service status
docker-compose ps
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   docker-compose down
   # Wait a few seconds
   docker-compose up
   ```

2. **Database connection issues**
   ```bash
   # Check if PostgreSQL is healthy
   docker-compose ps
   # Restart database
   docker-compose restart postgres
   ```

3. **Python backend connection refused**
   - Ensure the Python backend is running on port 8001
   - Check that `PYTHON_API_URL` in docker-compose.yml matches the Python service

4. **Invalid Gemini API key**
   - Update your API key in `backend/.env.docker`
   - Restart the Go backend: `docker-compose restart go_backend`

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs go_backend
docker-compose logs python_backend
docker-compose logs frontend
docker-compose logs postgres
```

## 📁 Project Structure

```
PdfAI/
├── backend/                 # Go and Python backend services
│   ├── app/                # Python FastAPI application
│   ├── internal/           # Go internal packages
│   ├── sql/                # Database schemas and queries
│   ├── TestCases/          # Test PDF files
│   ├── Dockerfile.go       # Go service Docker config
│   ├── Dockerfile.python   # Python service Docker config
│   ├── main.go            # Go application entry point
│   ├── requirements.txt    # Python dependencies
│   └── .env.docker        # Environment configuration
├── frontend/               # React frontend application
│   ├── src/               # React source code
│   ├── public/            # Static assets
│   ├── Dockerfile         # Frontend Docker config
│   └── package.json       # Node.js dependencies
├── ollama/                # Ollama configuration (optional)
├── docker-compose.yml     # Docker orchestration
├── start-docker.bat       # Windows startup script
├── start-docker.sh        # Unix startup script
├── stop-docker.bat        # Windows stop script
└── stop-docker.sh         # Unix stop script
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Google Gemini API](https://ai.google.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [React Documentation](https://react.dev/)
- [Go Documentation](https://golang.org/doc/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

**Happy PDF Processing! 🎉**
