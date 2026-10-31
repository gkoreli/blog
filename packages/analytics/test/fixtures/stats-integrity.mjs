/** Synthetic stored events, not operator/human labels or production measurements. */
export const STATS_INTEGRITY_NOW = '2026-10-31T12:00:00Z';
export const STATS_INTEGRITY_INSERT = `INSERT INTO page_observations
  (path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,observed_at,country,referrer_host,referrer_state,internal_referrer_path,signature_status,signature_agent,agent_name,representation)
  VALUES(?,?,?,'desktop',?,?,?,?,?,?,?,?,?,?,?,'html')`;
export function statsIntegrityValues() {
  const row = (path, client, extra={}) => [path,client.repeat(32),extra.traffic??'browser',extra.owner??0,
    extra.kind??'browser',extra.reason??'navigation-shaped-network-unlisted','2026-10-30 10:00:00',
    extra.country===undefined?'US':extra.country,extra.referrer??null,extra.state??'absent',extra.from??null,
    extra.signed?'verified':null,extra.signed?'https://crawler.exa.ai':null,extra.agent??null];
  return [
    row('/alpha','1',{referrer:'google.com',state:'external'}),
    row('/beta','1',{state:'internal',from:'/alpha'}),
    row('/gamma','2',{state:'internal',from:'/alpha'}),
    row('/delta','3',{traffic:'ai',kind:'ai-assistant',reason:'ExaUser',agent:'ExaUser',signed:true,referrer:'private-unreviewed.example',state:'external'}),
    row('/epsilon','1',{kind:'unresolved',reason:'fetch-metadata-absent',country:null}),
    row('/excluded','4',{referrer:'traffic2cash.xyz',state:'external'}),
    row('/owner','5',{owner:1}),
  ];
}

/** Closed mutation vocabulary applies equally after SQLite and native local D1. */
export function applyStatsFault(rows, fault) {
  if (!fault) return;
  const section = rows.find(row => row.section===fault.section);
  if (!section) throw Error('Fixture section missing');
  const payload = JSON.parse(section.payload), index = fault.index??0;
  if (fault.operation==='delete-field') delete payload[index][fault.field];
  else if (fault.operation==='set') payload[index][fault.field]=fault.value;
  else if (fault.operation==='drop-row') payload.splice(index,1);
  else if (fault.operation==='duplicate-row') payload.push(structuredClone(payload[index]));
  else throw Error('Unknown fixture operation');
  section.payload=JSON.stringify(payload);
}

export function statsIntegrityFaults() {
  const faults=[];
  const add=(name,section,operation,extra={})=>faults.push({name,fault:{section,operation,...extra}});
  for(const [section,fields] of [
    ['totals',['views','dailyClients','unattributedViews']],['path',['key1','views','dailyClients']],
    ['country',['key1','views']],['series',['key1','views','dailyClients']],['referrer',['key1','views']],
    ['referrer-state',['key1','views']],['transitions',['key1','key2','views']],
    ['device',['key1','views','recordedViews','unsupportedHintViews','differingSignalsViews','legacyDefaultedViews']],
    ['agent',['key1','key2','views']],['signer',['key1','views']],['excluded',['views']],
    ['referrer-details',['unrecognizedPathViews','selfReferrals','firstCapturedAt']],['kind-signature',['key1']],
  ])for(const field of fields)add(`missing-${section}-${field}`,section,'delete-field',{field});
  for(const value of [null,'unavailable',-1,0.5,Number.MAX_SAFE_INTEGER+1])add(`invalid-clients-${String(value)}`,'totals','set',{field:'dailyClients',value});
  for(const section of ['path','series','referrer-state','device','referrer'])add(`partition-gap-${section}`,section,'drop-row');
  for(const section of ['path','country','series','referrer','referrer-state','device','agent','signer','transitions'])add(`duplicate-${section}`,section,'duplicate-row');
  for(const section of ['country','agent','signer'])add(`subset-overflow-${section}`,section,'set',{field:'views',value:6});
  add('populated-series-string-count','series','set',{field:'views',value:'unavailable'});
  add('page-string-count','path','set',{field:'views',value:'unavailable'});
  add('impossible-path-client-count','path','set',{field:'dailyClients',value:2});
  add('headline-zero-clients-with-events','totals','set',{field:'dailyClients',value:0});
  add('page-duplicate-key-same-total','path','set',{index:1,field:'key1',value:'/alpha'});
  add('unrecognized-bucket','series','set',{field:'key1',value:'2026-10-30T10:00:01Z'});
  add('bucket-outside-window','series','set',{field:'key1',value:'2026-11-01T00:00:00Z'});
  add('hint-count-overflow','device','set',{field:'unsupportedHintViews',value:6});
  return faults;
}
