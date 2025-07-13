-- +goose Up
CREATE TABLE chat(
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES session(id) ON DELETE CASCADE,
    prompt TEXT DEFAULT NULL,
    response TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL
);

-- +goose Down
DROP TABLE chat;