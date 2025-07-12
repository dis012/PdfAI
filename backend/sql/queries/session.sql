-- name: CreateNewSession :one
INSERT INTO session(id, email_id, created_at)
VALUES(
    gen_random_uuid(),
    $1,
    NOW()
)
RETURNING *;

-- name: GetAllSessions :many
SELECT * FROM session
ORDER BY created_at ASC;

-- name: GetSessionById :one
SELECT * FROM session
WHERE id = $1;