# PdfAI Docker Deployment Guide

This guide will help you deploy the complete PdfAI application using Docker containers on your Windows machine.

## Prerequisites

- Docker Desktop for Windows
- Docker Compose (included with Docker Desktop)

## Architecture

The application consists of 4 main services:
- **PostgreSQL Database** - Stores application data
- **Go Backend** - Main API server (Port 8080)
- **Python Backend** - PDF processing service (Port 8001)
- **React Frontend** - User interface (Port 3000)

## Quick Start

## 🚀 **Windows Quick Start (2 Steps)**

1. **Configure Google Gemini API:**
   - Open `backend/.env.docker` 
   - Replace `your_gemini_api_key_here` with your actual API key

2. **Run the application:**
   ```cmd
   start-docker.bat
   ```

That's it! Your application will be available at http://localhost:3000

---

## 📋 **Detailed Setup Instructions**

### 1. Clone and Navigate to Project

```bash
cd /path/to/PdfAI
```

### 2. Start All Services

**For Windows:**
```cmd
# Simply run the batch script
start-docker.bat
```

**For Linux/Mac:**
```bash
# Make scripts executable first
chmod +x start-docker.sh stop-docker.sh update-docker.sh

# Start all services
./start-docker.sh
```

Or manually:

```bash
docker-compose up --build -d
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Go API**: http://localhost:8080
- **Python API**: http://localhost:8001
- **Database**: localhost:5432

## Configuration

### Google Gemini API Setup (Required)

**Before starting the application, you MUST configure your Google Gemini API key:**

1. **Open** `backend/.env.docker` in a text editor
2. **Replace** `your_gemini_api_key_here` with your actual API key:
   ```bash
   GEMINI_API_KEY=your_actual_api_key_from_google_ai_studio
   ```
3. **Save** the file

### Database Connection

When running in Docker, your database URL should be:
```
postgres://pdfai_user:pdfai_password@postgres:5432/pdfai?sslmode=disable
```

### Environment Files

- `.env.docker` - Used when running in Docker containers
- `.env.example` - Template for local development

### Database Migrations

The database is automatically initialized with all tables when the PostgreSQL container starts. The initialization script (`backend/sql/init.sql`) contains all the table creation statements extracted from your Goose migrations.

If you need to add new migrations:

1. Create your new Goose migration file in `backend/sql/schema/`
2. Extract the SQL statements and add them to `backend/sql/init.sql`
3. Rebuild the database container:
   ```bash
   docker-compose down -v
   docker-compose up --build postgres
   ```

## Development Workflow

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f go_backend
docker-compose logs -f python_backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuilding Services

```bash
# Rebuild all services
docker-compose up --build

# Rebuild specific service
docker-compose up --build go_backend
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U pdfai_user -d pdfai
```

### Stopping Services

**For Windows:**
```cmd
# Stop all services
stop-docker.bat
```

**For Linux/Mac:**
```bash
# Stop all services
./stop-docker.sh
```

Or manually:
```bash
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v
```

### Updating Services

**For Windows:**
```cmd
# Update from git and rebuild all containers
update-docker.bat
```

**For Linux/Mac:**
```bash
# Update from git and rebuild all containers
./update-docker.sh

# Advanced update with branch selection
./update-docker-advanced.sh [branch_name]
```

## File Structure

```
PdfAI/
├── docker-compose.yml          # Main orchestration file
├── start-docker.bat           # Windows startup script
├── stop-docker.bat            # Windows stop script  
├── update-docker.bat          # Windows update script
├── start-docker.sh            # Linux/Mac startup script
├── stop-docker.sh             # Linux/Mac stop script
├── update-docker.sh           # Linux/Mac update script
├── update-docker-advanced.sh  # Advanced Linux/Mac update script
├── backend/
│   ├── Dockerfile.go          # Go backend container
│   ├── Dockerfile.python      # Python backend container
│   ├── .env.docker           # Docker environment config (EDIT THIS!)
│   ├── .env.example          # Local development template
│   └── sql/
│       └── init.sql          # Database initialization
├── frontend/
│   ├── Dockerfile            # Frontend container
│   └── nginx.conf           # Nginx configuration
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000, 8080, 8001, and 5432 are not in use
2. **Database connection issues**: Wait for PostgreSQL health check to pass
3. **Build failures**: Check Docker logs for specific error messages

### Health Checks

```bash
# Check service status
docker-compose ps

# Test endpoints
curl http://localhost:8080/health
curl http://localhost:8001/health
curl http://localhost:3000
```

### Complete Reset

```bash
# Stop everything and remove all data
docker-compose down -v --rmi all --remove-orphans

# Start fresh
docker-compose up --build
```

## Production Considerations

For production deployment, consider:

1. **Security**: Change default passwords and use secrets management
2. **SSL/TLS**: Add HTTPS certificates and configure secure connections
3. **Backups**: Set up database backup strategies
4. **Monitoring**: Add logging and monitoring solutions
5. **Scaling**: Use Docker Swarm or Kubernetes for scaling

## Windows-Specific Notes

- Use Docker Desktop for Windows
- Make sure WSL2 backend is enabled for better performance
- File paths in volumes should use forward slashes
- Consider using Windows Terminal for better command-line experience

## Support

If you encounter issues:

1. Check Docker Desktop is running
2. Verify all required files are present
3. Check the logs: `docker-compose logs -f`
4. Try a complete reset as shown above
