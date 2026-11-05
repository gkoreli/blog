WITH bounded AS MATERIALIZED (SELECT status,created_at,confirmed_at FROM subscribers LIMIT 1001)
SELECT status,COUNT(*) retained_rows,SUM(created_at>='2026-10-29 00:00:00') created_since_oct29,SUM(confirmed_at>='2026-10-29 00:00:00') confirmed_since_oct29,MAX(confirmed_at) latest_confirmation,(SELECT COUNT(*) FROM bounded) bounded_total FROM bounded GROUP BY status;
