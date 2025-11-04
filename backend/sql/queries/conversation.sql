-- name: GetConversationHistory :many
SELECT * FROM conversation_messages
WHERE session_id = $1
ORDER BY message_order ASC;

-- name: SaveConversationMessage :one
INSERT INTO conversation_messages(id, session_id, role, content, message_order, created_at)
VALUES(
    gen_random_uuid(),
    $1,
    $2,
    $3,
    COALESCE((SELECT MAX(message_order) FROM conversation_messages WHERE session_id = $1), 0) + 1,
    NOW()
)
RETURNING *;

-- name: GetConversationMessageCount :one
SELECT COUNT(*) FROM conversation_messages
WHERE session_id = $1;

-- name: DeleteConversation :exec
DELETE FROM conversation_messages
WHERE session_id = $1;
