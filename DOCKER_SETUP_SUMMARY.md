# PdfAI Docker Setup Summary

### 1. Docker Configuration Files
- `docker-compose.y# Stop all services
./stop-docker.sh

# Update from git and rebuild
./update-docker.sh
```

### Linux/Mac:
```bash
# Start all services
./start-docker.sh

# Stop all services
./stop-docker.sh

# Update from git and rebuild
./update-docker.sh

# Advanced update with branch selection
./update-docker-advanced.sh [branch_name]
```rchestration file for all services
- `backend/Dockerfile.go` - Container for Go backend
- `backend/Dockerfile.python` - Container for Python PDF processing service
- `frontend/Dockerfile` - Container for React frontend
- `frontend/nginx.conf` - Nginx configuration for frontend

### 2. Database Setup
- `backend/sql/init.sql` - Database initialization script with all tables
- Automatically creates PostgreSQL database with all your existing tables

### 3. Environment Configuration
- `backend/.env.docker` - Environment variables for Docker deployment
- `backend/.env.example` - Template for local development

### 4. Startup Scripts
- `start-docker.sh` / `start-docker.bat` - Start all services (Linux/Windows)
- `stop-docker.sh` / `stop-docker.bat` - Stop all services (Linux/Windows)
- `update-docker.sh` / `update-docker.bat` - Update from git and rebuild (Linux/Windows)
- `update-docker-advanced.sh` - Advanced update script with more options (Linux)

### 5. Documentation
- `DOCKER_README.md` - Comprehensive deployment guide

### 6. Optimizations
- `.dockerignore` files for efficient builds
- Health check endpoints added to Go and Python backends

## Database URL Configuration

When running in Docker containers, your database URL should be:
```
postgres://pdfai_user:pdfai_password@postgres:5432/pdfai?sslmode=disable
```

**Key points about the database URL:**
- Host is `postgres` (not `localhost`) - this is the container name
- Port is `5432` (internal container port)
- Database name: `pdfai`
- Username: `pdfai_user`
- Password: `pdfai_password`

## Goose Migrations Approach

Since we are using Goose for migrations, here's the recommended approach:

### For Development (Local)
Continue using Goose as usual:
```bash
goose -dir sql/schema postgres "your-local-db-url" up
```

### For Docker Deployment
The Docker setup uses a different approach:
1. All migration SQL statements are consolidated in `backend/sql/init.sql`
2. PostgreSQL runs this script automatically when the container starts
3. When you create new Goose migrations:
   - Create the migration file as usual in `sql/schema/`
   - Extract the SQL statements and add them to `sql/init.sql`
   - Rebuild the database container: `docker-compose down -v && docker-compose up postgres`

### Alternative: Run Goose in Docker
If you prefer to use Goose in Docker, you can:
1. Add Goose to the Go Dockerfile
2. Run migrations as part of the Go service startup
3. Modify the init script to use Goose instead of direct SQL

## Services and Ports

- **PostgreSQL**: `localhost:5432`
- **Go Backend**: `localhost:8080`
- **Python Backend**: `localhost:8001`
- **React Frontend**: `localhost:3000`

## Quick Start Commands

### Windows:
```cmd
# Start all services
start-docker.bat

# Stop all services
stop-docker.bat
```

### Linux/Mac:
```bash
# Start all services
./start-docker.sh

# Stop all services
./stop-docker.sh
```

### Manual Commands:
```bash
# Start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Complete reset (removes database data)
docker-compose down -v
```

## Next Steps

1. Test the setup on your Windows machine
2. Adjust environment variables if needed
3. Consider adding SSL/HTTPS for production
4. Set up backup strategies for the database
5. Configure proper logging and monitoring

The setup is ready to deploy on any machine with Docker!
