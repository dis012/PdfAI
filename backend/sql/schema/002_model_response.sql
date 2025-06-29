-- +goose Up
CREATE TABLE model_response(
    id UUID PRIMARY KEY,
    model TEXT,
    created_at TIMESTAMP NOT NULL,
    response TEXT NOT NULL,
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE
);

-- +goose Down
DROP TABLE model_response;