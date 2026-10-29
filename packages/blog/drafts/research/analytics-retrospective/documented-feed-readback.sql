SELECT CAST(id AS TEXT) AS privateReference,
  collection_version, classifier_version, reader_kind, signature_status,
  classification_evidence, signature_evidence, vendor_ip_evidence,
  is_owner, referrer_state,
  referrer_host = 'traffic2cash.xyz' AS supplied_referrer_matches
FROM page_observations
WHERE id IN (CAST(? AS INTEGER), CAST(? AS INTEGER))
ORDER BY id
LIMIT 3;
