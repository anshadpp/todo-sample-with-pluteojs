-- Backfill missing statusValue on status board categories
-- so that the grouping logic on page reload works consistently.

UPDATE categories c
SET status_value = CASE
    WHEN LOWER(c.name) = 'todo' THEN 'todo'
    WHEN LOWER(c.name) = 'in progress' THEN 'in_progress'
    WHEN LOWER(c.name) = 'review' THEN 'review'
    WHEN LOWER(c.name) = 'done' THEN 'done'
END
FROM boards b
WHERE c.board_id = b.id
  AND b.type = 'status'
  AND c.status_value IS NULL
  AND LOWER(c.name) IN ('todo', 'in progress', 'review', 'done');
