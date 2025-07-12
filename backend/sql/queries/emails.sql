-- name: CreateEmail :one
INSERT INTO emails(id, created_at, email_text)
VALUES(
    gen_random_uuid(),
    NOW(),
    $1
)
RETURNING *;

-- name: GetEmailById :one
SELECT email_text FROM emails
WHERE id = $1;