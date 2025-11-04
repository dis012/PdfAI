-- +goose Up
CREATE TABLE conversation_messages(
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    message_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT unique_session_message_order UNIQUE(session_id, message_order)
);

-- Index for efficient conversation retrieval
CREATE INDEX idx_conversation_session_order ON conversation_messages(session_id, message_order);

-- +goose Down
DROP INDEX IF EXISTS idx_conversation_session_order;
DROP TABLE conversation_messages;
