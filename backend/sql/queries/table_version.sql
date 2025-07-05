-- name: CreateTableVersion :one
INSERT INTO table_version(id, session_id, created_at, response_json, version_number, is_active)
VALUES(
    gen_random_uuid(),
    $1,
    NOW(),
    $2,
    1,
    TRUE
)
RETURNING *;

-- name: GetTableBasedOnSession :one
SELECT * FROM table_version
WHERE session_id = $1 AND is_active = TRUE;