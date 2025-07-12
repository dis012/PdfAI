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

-- name: DisableCurrentTable :exec
UPDATE table_version
SET is_active = FALSE
WHERE session_id = $1 AND is_active = TRUE;

-- name: UpdateTableVersion :one
INSERT INTO table_version (id, session_id, created_at, response_json, version_number, is_active)
VALUES (
    gen_random_uuid(),
    $1,
    NOW(),
    $2,
    (SELECT COALESCE(MAX(version_number), 0) + 1 FROM table_version WHERE session_id = $1),
    TRUE
)
RETURNING *;

-- name: ChangeVersion :one
UPDATE table_version
SET is_active = TRUE
WHERE session_id = $1 AND version_number = $2
RETURNING response_json;

-- name: GetLatestVersionNumber :one
SELECT COALESCE(MAX(version_number), 0)
FROM table_version
WHERE session_id = $1;