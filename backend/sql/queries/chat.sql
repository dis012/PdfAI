-- name: GetChatHistory :many
SELECT prompt, response FROM chat
WHERE session_id = $1
ORDER BY created_at ASC;

-- name: SaveNewChat :one
INSERT INTO chat(id, session_id, prompt, response, created_at)
VALUES(
    gen_random_uuid(),
    $1,
    $2,
    $3,
    NOW()
)
RETURNING *;
