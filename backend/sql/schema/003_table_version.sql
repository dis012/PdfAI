-- +goose Up
CREATE TABLE table_version(
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES session(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    response_json JSONB NOT NULL,
    version_number INTEGER NOT NULL,
    is_active BOOLEAN
);

-- +goose Down
DROP TABLE table_version;