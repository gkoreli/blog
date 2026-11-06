import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveTechnicalAssessment, compareSiteReports, evaluateRobotsWorkbench, WorkbenchInputError, isTechnicalAssessment } from '../.test-dist/product.js';
import { inspectHtml } from '../.test-dist/html.js';

function fixture() {
  const resource = kind => ({ kind, requestedUrl: `https://public.site/${kind}`, finalUrl: `https://public.site/${kind}`, outcome: 'received', status: 200,
    contentType: kind === 'page' ? 'text/html' : 'text/plain', bytes: 300, elapsedMs: 1, redirects: 0, probeAgent: null, headersOmitted: [],
    headers: { robots: null, link: null, contentLocation: null, vary: null } });
  return { version: '2026-11-06.1', checkedAt: '2026-11-06T12:00:00Z', target: 'https://public.site/article', complete: true,
    resources: ['page','robots','llms','sitemap','markdown'].map(resource),
    page: { title: 'Public page', description: null, canonical: null, language: null, textCharacters: 300, headings: 1, links: 1, scriptElements: 1,
      metaRobots: [], structuredDataTypes: [], structuredDataBlocks: 0, invalidStructuredDataBlocks: 0, alternateLinks: [], parseState: 'parsed', indexingAssessmentComplete: true },
    robots: { state: 'parsed', groups: 1, rules: 1, sitemaps: [], bots: [{token:'GPTBot',provider:'OpenAI',role:'training-control',source:'https://developers.openai.com/api/docs/bots',decision:'disallowed',matchedGroups:['GPTBot'],matchedRule:'Disallow: /',reason:'Intentional training control'}] },
    discovery: {llms:'present',llmsLinks:1,sitemap:'xml-observed',markdown:'not-negotiated'}, findings: [], limits: [] };
}
const indexCheck = assessment => assessment.components.find(item => item.id === 'indexing').checks[0];
test('fixed transparent technical index reconciles components and intentional training controls', () => {
  const report = fixture();
  const assessment = deriveTechnicalAssessment(report);
  assert.deepEqual(assessment.score, {lower:100,upper:100,max:100,coveragePercent:100});
  assert.deepEqual(assessment.components.map(item=>item.max), [40,40,20]);
  assert.deepEqual(assessment.counts,{passed:6,failed:0,unknown:0});
  assert.equal(assessment.components.flatMap(item=>item.checks).reduce((sum,item)=>sum+item.weight,0),100);
  assert.equal(assessment.optional.find(item=>item.id==='structured-data').state,'not-provided');
});
test('optional missing files and malformed supplied JSON-LD do not change core score', () => {
  const report=fixture();
  for(const resource of report.resources) if(['llms','sitemap'].includes(resource.kind)) resource.status=404;
  report.discovery.llms='missing';report.discovery.sitemap='missing';
  report.page.structuredDataBlocks=1;report.page.invalidStructuredDataBlocks=1;
  const assessment=deriveTechnicalAssessment(report);
  assert.equal(assessment.score.lower,100);
  assert.equal(assessment.optional.find(item=>item.id==='llms').state,'not-provided');
  assert.equal(assessment.optional.find(item=>item.id==='structured-data').state,'unexpected-content');
});
test('unknown main response cannot become a perfect score from passed secondary facts', () => {
  const report=fixture();const page=report.resources[0];
  page.outcome='network-error';page.status=null;report.page.parseState='unavailable';report.page.indexingAssessmentComplete=false;
  const assessment=deriveTechnicalAssessment(report);
  assert.deepEqual(assessment.score,{lower:0,upper:100,max:100,coveragePercent:0});
  assert.equal(assessment.counts.unknown,6);
  page.outcome='received';page.status=403;
  assert.deepEqual(deriveTechnicalAssessment(report).score,{lower:0,upper:70,max:100,coveragePercent:30});
});
test('generic noindex loses only indexing points; provider scope is never widened', () => {
  const report=fixture();
  report.page.metaRobots=[{agent:'robots',value:'noindex,follow'}];
  assert.equal(deriveTechnicalAssessment(report).score.lower,80);
  report.page.metaRobots=[{agent:'googlebot',value:'noindex'}];
  assert.equal(deriveTechnicalAssessment(report).score.lower,100);
  report.page.metaRobots=[];report.resources[0].headers.robots='googlebot: noindex, nofollow';
  const scoped=deriveTechnicalAssessment(report);
  assert.equal(indexCheck(scoped).state,'unknown');assert.equal(scoped.score.lower,80);assert.equal(scoped.score.upper,100);
  report.resources[0].headers.robots='max-snippet: 0, max-image-preview: none';
  assert.equal(indexCheck(deriveTechnicalAssessment(report)).state,'pass');
  report.resources[0].headers.robots='noindex, googlebot: index';
  assert.equal(indexCheck(deriveTechnicalAssessment(report)).state,'fail');
});
test('legacy completeness flags, omitted headers and metadata limits keep indexing unknown', () => {
  const legacy=fixture();delete legacy.resources[0].headersOmitted;delete legacy.page.indexingAssessmentComplete;
  assert.deepEqual(deriveTechnicalAssessment(legacy).score,{lower:80,upper:100,max:100,coveragePercent:80});
  const longHeader=fixture();longHeader.resources[0].headersOmitted=['robots'];
  assert.equal(indexCheck(deriveTechnicalAssessment(longHeader)).state,'unknown');
  const capped=fixture();capped.page=inspectHtml(`<html><head><title>Test</title>${'<meta name="robots" content="index">'.repeat(32)}<meta name="robots" content="noindex"></head><body><h1>Text</h1></body></html>`,new URL(capped.target));
  assert.equal(capped.page.indexingAssessmentComplete,false);
  assert.equal(indexCheck(deriveTechnicalAssessment(capped)).state,'unknown');
  capped.page.metaRobots.unshift({agent:'robots',value:'noindex'});
  assert.equal(indexCheck(deriveTechnicalAssessment(capped)).state,'fail');
  const longMeta=inspectHtml(`<title>Test</title><meta name="robots" content="${'index,'.repeat(100)}"><h1>Text</h1>`,new URL(capped.target));
  assert.equal(longMeta.indexingAssessmentComplete,false);
});
test('Markdown optional states distinguish unsupported negotiation from HTTP and transport errors', () => {
  for(const [outcome,status,type,expected] of [['received',200,'text/html','not-negotiated'],['received',403,'text/html','http-error'],['received',404,'text/html','http-error'],['received',500,'text/html','http-error'],['timeout',null,null,'unavailable']]) {
    const report=fixture();Object.assign(report.resources.find(item=>item.kind==='markdown'),{outcome,status,contentType:type});
    assert.equal(deriveTechnicalAssessment(report).optional.find(item=>item.id==='markdown').state,expected);
  }
  const report=fixture();report.discovery.markdown='negotiated';report.resources.find(item=>item.kind==='markdown').contentType='text/markdown';
  assert.equal(deriveTechnicalAssessment(report).optional.find(item=>item.id==='markdown').state,'available');
  report.resources.find(item=>item.kind==='llms').status=403;
  assert.equal(deriveTechnicalAssessment(report).optional.find(item=>item.id==='llms').state,'http-error');
});
test('local robots workbench reports actual matched rule without network or persistence', () => {
  const result=evaluateRobotsWorkbench({robots:'User-agent: GPTBot\nDisallow: /\nUser-agent: ChatGPT-User\nAllow: /docs\nDisallow: /',token:'ChatGPT-User',path:'/docs/page'});
  assert.equal(result.decision,'allowed');assert.equal(result.matchedRule,'Allow: /docs');assert.equal(result.complete,true);
  assert.equal(evaluateRobotsWorkbench({robots:'User-agent: *\nDisallow: /',token:'GPTBot',path:'/docs'}).decision,'disallowed');
  for(const input of [{robots:'x'.repeat(524289),token:'GPTBot',path:'/'},{robots:'',token:'Bad Bot',path:'/'},{robots:'',token:'GPTBot',path:'https://private/'}]) assert.throws(()=>evaluateRobotsWorkbench(input),WorkbenchInputError);
  assert.equal(evaluateRobotsWorkbench({robots:`User-agent: *\n${'Allow: /a\n'.repeat(5001)}`,token:'GPTBot',path:'/'}).decision,'unknown');
});
test('local report diff identifies changes while keeping target and policy choices explicit', () => {
  const before=fixture();const after=structuredClone(before);after.checkedAt='2026-11-07T12:00:00Z';after.page.title=null;
  after.robots.bots[0].decision='allowed';after.robots.bots[0].matchedRule='Allow: /';
  const result=compareSiteReports(before,after);
  assert.equal(result.comparable,true);assert.equal(result.changes.find(item=>item.path==='checks.page-title').meaning,'regressed');
  assert.equal(result.changes.find(item=>item.path==='robots.GPTBot.decision').meaning,'changed');
  after.target='https://different.site/article';
  const different=compareSiteReports(before,after);assert.equal(different.comparable,false);assert.ok(different.changes.every(item=>item.meaning==='changed'));
  assert.deepEqual(compareSiteReports(before,before).changes,[]);
});
test('report diff shows equal-score check swaps and added/removed policy tokens', () => {
  const before=fixture();before.page.headings=0;
  const after=structuredClone(before);after.page.title=null;after.page.headings=1;
  after.robots.bots=[{...after.robots.bots[0],token:'NewBot',decision:'allowed'}];
  const result=compareSiteReports(before,after);
  assert.equal(deriveTechnicalAssessment(before).score.lower,deriveTechnicalAssessment(after).score.lower);
  assert.equal(result.changes.some(item=>item.path==='assessment.score'),false);
  assert.equal(result.changes.find(item=>item.path==='checks.page-title').meaning,'regressed');
  assert.equal(result.changes.find(item=>item.path==='checks.page-heading').meaning,'improved');
  assert.equal(result.changes.find(item=>item.path==='robots.GPTBot').after,'not captured');
  assert.equal(result.changes.find(item=>item.path==='robots.NewBot').before,'not captured');
});
test('duplicate resource and policy keys reject comparison without arbitrary pairing', () => {
  for(const kind of ['resource','policy']) {
    const before=fixture();const after=fixture();
    if(kind==='resource') after.resources.push({...after.resources[0],status:403});
    else after.robots.bots.push({...after.robots.bots[0],token:'gptbot',decision:'allowed'});
    const result=compareSiteReports(before,after);
    assert.equal(result.comparable,false);assert.deepEqual(result.changes,[]);
    assert.match(result.reasons.join(' '),/duplicate/);
    assert.match(result.limits.join(' '),/does not mean.*equal/);
  }
});

test('technical assessment guard validates complete published ledgers and rejects forged attachments', () => {
  const valid=deriveTechnicalAssessment(fixture());
  assert.equal(isTechnicalAssessment(valid),true);
  const mutations=[
    value=>{value.profile='unreviewed-rubric';},
    value=>{value.score.lower=99;},
    value=>{value.score.upper=99;},
    value=>{value.score.coveragePercent=50;},
    value=>{value.score.lower=100.5;},
    value=>{value.counts.passed=5;},
    value=>{value.components[0].earned=0;},
    value=>{value.components[0].max=50;},
    value=>{value.components[0].checks[0].weight=20;value.components[0].checks[1].weight=20;},
    value=>{value.components[0].checks[1].id='page-status';},
    value=>{value.components[0].checks[0].state='probably';},
    value=>{value.components[1]=structuredClone(value.components[0]);},
    value=>{value.optional[1]=structuredClone(value.optional[0]);},
    value=>{value.score.unexplainedBonus=10;},
    value=>{value.components[0].checks[0].evidence={secret:'not text'};},
  ];
  for(const mutate of mutations){const forged=structuredClone(valid);mutate(forged);assert.equal(isTechnicalAssessment(forged),false);}
  for(const invalid of [null,{},'100',[],{profile:valid.profile,score:100}])assert.equal(isTechnicalAssessment(invalid),false);
  const legacy=fixture();delete legacy.resources[0].headersOmitted;delete legacy.page.indexingAssessmentComplete;
  const interval=deriveTechnicalAssessment(legacy);assert.equal(isTechnicalAssessment(interval),true);
  interval.score.upper=interval.score.lower;assert.equal(isTechnicalAssessment(interval),false);
});
