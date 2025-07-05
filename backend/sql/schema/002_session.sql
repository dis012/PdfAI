-- +goose Up
CREATE TABLE session(
    id UUID PRIMARY KEY,
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL
);

-- +goose Down
DROP TABLE session;