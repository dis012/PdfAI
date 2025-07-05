-- +goose Up
CREATE TABLE emails(
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    email_text TEXT NOT NULL
);

-- +goose Down
DROP TABLE emails;