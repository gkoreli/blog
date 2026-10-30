-- Additive server-side policy provenance. Historical rows remain NULL.
-- Apply after schema preflight, before deploying the writer that names this column.
ALTER TABLE client_errors ADD COLUMN processing_evidence TEXT;
