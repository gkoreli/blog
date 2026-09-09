WITH selected AS MATERIALIZED (
 SELECT referrer_host, country, daily_client_id, traffic_class, agent_name, device_type,
        asn, as_org, sec_fetch_mode, sec_fetch_dest, sec_fetch_site, sec_fetch_user,
        accepts_html, has_accept_language, representation, signature_agent,
        signature_status, reader_kind, reader_reason, observed_at, asn_source
 FROM page_observations
 WHERE is_owner = 0 AND path = '/how-i-separate-readers-from-bots-without-javascript'
   AND observed_at >= '2026-09-03 00:00:00' AND observed_at < '2026-09-09 00:33:35'
   AND NOT EXISTS (SELECT 1 FROM owner_clients
     WHERE owner_clients.daily_client_id = page_observations.daily_client_id)
), repeats AS (
 SELECT substr(observed_at,1,10) AS day, daily_client_id, COUNT(*) AS views
 FROM selected WHERE reader_kind = 'browser' AND referrer_host IS NULL
 GROUP BY day, daily_client_id
)
SELECT 'request-groups' AS panel, json_object(
 'referrerHost',referrer_host,'country',country,'trafficClass',traffic_class,'agentName',agent_name,
 'deviceType',device_type,'asn',asn,'asOrg',as_org,'fetchMode',sec_fetch_mode,
 'fetchDest',sec_fetch_dest,'fetchSite',sec_fetch_site,'fetchUser',sec_fetch_user,
 'acceptsHtml',accepts_html,'hasAcceptLanguage',has_accept_language,
 'representation',representation,'signatureAgent',signature_agent,'signatureStatus',signature_status,
 'readerKind',reader_kind,'readerReason',reader_reason,'day',substr(observed_at,1,10),
 'asnSource',asn_source,'views',COUNT(*),'firstAt',MIN(observed_at),'lastAt',MAX(observed_at)) AS data
FROM selected
GROUP BY referrer_host,country,traffic_class,agent_name,device_type,asn,as_org,
 sec_fetch_mode,sec_fetch_dest,sec_fetch_site,sec_fetch_user,accepts_html,has_accept_language,
 representation,signature_agent,signature_status,reader_kind,reader_reason,substr(observed_at,1,10),asn_source
UNION ALL
SELECT 'no-referrer-repeat',json_object('viewsPerDailyId',views,'dailyIds',COUNT(*))
FROM repeats GROUP BY views
UNION ALL
SELECT 'no-referrer-hours',json_object('hour',substr(observed_at,1,13),'fetchSite',sec_fetch_site,'views',COUNT(*))
FROM selected WHERE reader_kind = 'browser' AND referrer_host IS NULL
GROUP BY substr(observed_at,1,13),sec_fetch_site
LIMIT 10001;
