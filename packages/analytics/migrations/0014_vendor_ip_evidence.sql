-- Derived public-feed method results; no request addresses or raw User-Agents.
ALTER TABLE page_observations ADD COLUMN vendor_ip_evidence TEXT
  CHECK (vendor_ip_evidence IS NULL OR (json_valid(vendor_ip_evidence) AND length(CAST(vendor_ip_evidence AS BLOB)) <= 4096));
