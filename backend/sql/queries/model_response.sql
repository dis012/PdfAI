-- name: AddResponse :one
INSERT INTO model_response(id, model, created_at, response, email_id)
VALUES(
    gen_random_uuid(),
    $1,
    NOW(),
    $2,
    $3
)
RETURNING *;