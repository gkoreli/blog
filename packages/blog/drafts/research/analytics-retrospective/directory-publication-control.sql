SELECT collection_version AS collectionVersion, reader_kind AS readerKind,
  json_extract(signature_evidence,'$.version') AS evidenceVersion,
  json_extract(signature_evidence,'$.source') AS evidenceSource,
  json_extract(signature_evidence,'$.localOutcome') AS localOutcome,
  json_extract(signature_evidence,'$.verifierProfile') AS verifierProfile,
  json_extract(signature_evidence,'$.vendor.status') AS documentedVendorStatus,
  json_extract(signature_evidence,'$.directoryPublication.profile') AS publicationProfile,
  json_extract(signature_evidence,'$.directoryPublication.method') AS publicationMethod,
  json_extract(signature_evidence,'$.directoryPublication.reviewedOn') AS publicationReviewedOn,
  json_extract(signature_evidence,'$.directoryPublication.status') AS publicationStatus,
  json_extract(signature_evidence,'$.directoryPublication.configuredDeclarationCount') AS configuredDeclarationCount,
  json_extract(signature_evidence,'$.directoryPublication.unmappedDeclarationCount') AS unmappedDeclarationCount,
  request_evidence IS NULL AS optionalCaptureAbsent,
  referrer_host='traffic2cash.xyz' AS referralControl
FROM page_observations
WHERE id=CAST(? AS INTEGER) AND path='/privacy' AND collection_version=?;
