-- Database initialization script for Docker PostgreSQL
-- This file contains all the table creation statements extracted from Goose migrations

-- Create emails table (from 001_email.sql)
CREATE TABLE IF NOT EXISTS emails(
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    email_text TEXT NOT NULL
);

-- Create session table (from 002_session.sql) 
CREATE TABLE IF NOT EXISTS session(
    id UUID PRIMARY KEY,
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL
);

-- Create table_version table (from 003_table_version.sql)
CREATE TABLE IF NOT EXISTS table_version(
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES session(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    response_json JSONB NOT NULL,
    version_number INTEGER NOT NULL,
    is_active BOOLEAN
);

-- Create chat table (from 004_chat.sql)
CREATE TABLE IF NOT EXISTS chat(
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES session(id) ON DELETE CASCADE,
    prompt TEXT DEFAULT NULL,
    response TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL
);
