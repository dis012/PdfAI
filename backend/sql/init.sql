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

-- Create conversation_messages table (from 005_conversation.sql)
CREATE TABLE IF NOT EXISTS conversation_messages(
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    message_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT unique_session_message_order UNIQUE(session_id, message_order)
);

-- Create index for efficient conversation retrieval
CREATE INDEX IF NOT EXISTS idx_conversation_session_order ON conversation_messages(session_id, message_order);
