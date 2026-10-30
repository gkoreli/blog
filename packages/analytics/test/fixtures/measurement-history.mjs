import assert from 'node:assert/strict';

const profile = {collection:'2026-10-01.1',classifier:'2026-10-01.2',observationSource:'edge',representation:'html'};
const item = (id, overrides, expected) => ({
  row: {path:'/a',daily_client_id:id.toString(16).padStart(32,'0'),traffic_class:'browser',device_type:'desktop',reader_kind:'browser',is_owner:0,referrer_state:'absent',referrer_host:null,
    collection_version:'2026-10-01.1',classifier_version:'2026-10-01.2',observation_source:'edge',representation:'html',observed_at:'2026-10-01 12:00:00',...overrides},
  expected: {path:'/a',week:0,...profile,...expected},
});
// Expected labels are specified independently of the SQL or stamp decoder.
export const measurementCases = [
  item(201,{},{}),
  item(202,{observed_at:'2026-10-08 12:00:00'},{week:1}),
  item(203,{classifier_version:'2026-10-15.1',observed_at:'2026-10-15 12:00:00'},{classifier:'2026-10-15.1',week:2}),
  item(204,{observation_source:'beacon',representation:'markdown',observed_at:'2026-10-22 12:00:00'},{observationSource:'beacon',representation:'markdown',week:3}),
  item(205,{path:'/b',collection_version:null,classifier_version:null,representation:null},{path:'/b',collection:null,classifier:null,representation:'not-recorded'}),
  item(206,{collection_version:'private-canary',classifier_version:'2026-02-30.1'},{collection:'unrecognized',classifier:'unrecognized'}),
  item(207,{path:'/',collection_version:'2026-02-28.999999',classifier_version:null},{path:null,collection:'2026-02-28.999999',classifier:null}),
  item(208,{observed_at:'2026-10-25 99:00:00'},{week:-1}),
  item(209,{is_owner:1},{excluded:true}),
  item(210,{referrer_state:'external',referrer_host:'traffic2cash.xyz'},{excluded:true}),
  item(211,{collection_version:'2026-10-01.01',classifier_version:'2026-10-01.1000000'},{collection:'unrecognized',classifier:'unrecognized'}),
  item(212,{collection_version:'2026-10-01.0',classifier_version:'2026-10-01.1'},{collection:'2026-10-01.0',classifier:'2026-10-01.1'}),
  item(213,{path:'/engineering',representation:null},{path:null,representation:'not-recorded'}),
];
export function expectedMeasurementHistory(cases = measurementCases) {
  const groups=new Map();
  for(const {expected:e} of cases){
    if(e.excluded)continue;
    const key=JSON.stringify([e.path,e.collection,e.classifier,e.observationSource,e.representation]);
    const group=groups.get(key)??{path:e.path,collection:e.collection,classifier:e.classifier,observationSource:e.observationSource,representation:e.representation,views:0,weeks:[0,0,0,0],unrecognizedTimeViews:0};
    group.views++;if(e.week===-1)group.unrecognizedTimeViews++;else group.weeks[e.week]++;
    groups.set(key,group);
  }
  return [...groups.values()];
}
export function checkMeasurementHistory(report,cases=measurementCases){
  const canonical=rows=>rows.map(r=>JSON.stringify(r,Object.keys(r).sort())).sort();
  assert.deepEqual(canonical(report.measurementHistory),canonical(expectedMeasurementHistory(cases)));
  assert.equal(JSON.stringify(report).includes('private-canary'),false);
}
export function measurementMutations(){return[
  r=>delete r.measurementHistory,
  r=>r.measurementHistory.pop(),
  r=>r.measurementHistory.push(structuredClone(r.measurementHistory[0])),
  r=>r.measurementHistory[0].path='/outside',
  r=>r.measurementHistory[0].collection='private-canary',
  r=>r.measurementHistory[0].classifier='2026-02-30.1',
  r=>r.measurementHistory[0].observationSource='unknown-browser',
  r=>r.measurementHistory[0].representation='text/plain',
  r=>r.measurementHistory[0].weeks.pop(),
  r=>r.measurementHistory[0].weeks[0]++,
  r=>r.measurementHistory[0].views++,
  r=>r.measurementHistory[0].unrecognizedTimeViews++,
  r=>r.measurementHistory[0].extra='private-canary',
  r=>r.measurementHistory.find(p=>p.classifier!==null).classifier=null,
  r=>r.measurementHistory[0].weeks[0]='1',
  r=>r.measurementHistory[0].views=Number.MAX_SAFE_INTEGER,
];}
