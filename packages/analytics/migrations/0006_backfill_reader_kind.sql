-- Backfill reader_kind and reader_reason for rows written before migration 0005.
-- Ingestion version-gates the no-Sec-Fetch case on the claimed engine version
-- (readerkind.ts, research artifact 09). The raw User-Agent is not stored, so
-- history cannot be gated: every evidence-recorded browser row that is not
-- navigation-shaped is labelled http-client / not-navigation-shaped here (after
-- the hosting-ASN check, which is a verdict regardless of shape), and
-- the pre-Fetch-Metadata share (under 4.3% of global browser usage) is folded in.
UPDATE page_observations
SET
  reader_kind = CASE
    WHEN signature_status = 'verified' THEN 'signed-agent'
    WHEN agent_name IN (
      'ChatGPT-User', 'Claude-User', 'Perplexity-User', 'Meta-ExternalFetcher',
      'MistralAI-User', 'DuckAssistBot', 'Amzn-User', 'Google-Agent',
      'Google-GeminiNotebook'
    ) THEN 'ai-assistant'
    WHEN agent_name IN (
      'OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'MistralAI-Index',
      'Amzn-SearchBot', 'Meta-WebIndexer', 'Applebot'
    ) THEN 'ai-search'
    WHEN agent_name IN (
      'GPTBot', 'ClaudeBot', 'MistralAI-Training', 'Meta-ExternalAgent',
      'Amazonbot', 'CCBot', 'Google-CloudVertexBot', 'Bytespider', 'PetalBot',
      'Cohere-AI'
    ) THEN 'ai-crawler'
    WHEN agent_name IN (
      'Googlebot', 'Bingbot', 'DuckDuckBot', 'YandexBot', 'Baiduspider'
    ) THEN 'search-crawler'
    WHEN agent_name IN ('FacebookBot', 'LinkedInBot', 'Slackbot') THEN 'preview-or-feed'
    WHEN agent_name IN ('HeadlessChrome', 'Cypress', 'Lightpanda') THEN 'headless-browser'
    WHEN traffic_class IN ('bot', 'ai') THEN 'other-bot'
    WHEN observation_source = 'beacon' THEN 'browser'
    WHEN has_accept_language IS NULL THEN 'unchecked'
    WHEN asn IN (
        16509, 14618, 396982, 8075, 14061, 24940, 16276, 20473, 63949,
        31898, 45102, 45090, 132203, 51167, 40021, 141995, 12876, 16265,
        60781, 8560
      ) THEN 'cloud-browser'
    WHEN sec_fetch_mode = 'navigate' AND sec_fetch_dest = 'document' THEN 'browser'
    ELSE 'http-client'
  END,
  reader_reason = CASE
    WHEN signature_status = 'unverified' THEN COALESCE(reader_reason, 'signature-unverified')
    WHEN signature_status = 'verified' THEN signature_agent
    WHEN agent_name IS NOT NULL THEN agent_name
    WHEN traffic_class IN ('bot', 'ai') THEN 'generic-bot'
    WHEN observation_source = 'beacon' THEN 'legacy-beacon'
    WHEN has_accept_language IS NULL THEN 'evidence-not-recorded'
    WHEN asn IN (
        16509, 14618, 396982, 8075, 14061, 24940, 16276, 20473, 63949,
        31898, 45102, 45090, 132203, 51167, 40021, 141995, 12876, 16265,
        60781, 8560
      ) THEN 'hosting-asn:' || asn
    WHEN sec_fetch_mode = 'navigate' AND sec_fetch_dest = 'document' THEN 'navigation-shaped'
    ELSE 'not-navigation-shaped'
  END
WHERE reader_kind IS NULL;
