#!/bin/bash

# Database initialization script for Docker
# This script will be run when the PostgreSQL container starts

set -e

# Create database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE IF NOT EXISTS $POSTGRES_DB;
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
EOSQL

# Install goose for migrations
echo "Installing goose for database migrations..."
go install github.com/pressly/goose/v3/cmd/goose@latest

# Run database migrations
echo "Running database migrations..."
export GOOSE_DRIVER=postgres
export GOOSE_DBSTRING="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB?sslmode=disable"

# Navigate to schema directory and run migrations
cd /docker-entrypoint-initdb.d
goose up

echo "Database initialization complete!"
