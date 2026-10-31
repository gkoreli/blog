// Synthetic scheduler/patch checks. No agent, model request, user session or daemon.
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const [binaryPath, hookPath, outputPath] = process.argv.slice(2);
const binary = fs.readFileSync(binaryPath);
const hook = fs.readFileSync(hookPath, 'utf8');
const start = binary.indexOf('function Ui(e,n,s,y,r,b={})');
const end = binary.indexOf('function f1n(', start);
if (start < 0 || end < start) throw Error('Pinned scheduler boundaries changed');
const scheduler = binary.subarray(start, end).toString('utf8');
if (!scheduler.includes('[AgentSummary] Timer fired')) throw Error('Wrong scheduler');
const rows = [];
for (const scenario of ['no-hook', 'off', 'pass', 'foreign-process', 'bound-callback']) {
  const calls = [];
  const context = vm.createContext({
    require, Symbol, WeakMap, WeakSet, Date, Error,
    process: {execPath: scenario === 'foreign-process' ? '/tmp/ordinary-bun' : '/tmp/claude',
      env: {CC_AGENT_SUMMARY_MODE: scenario === 'pass' ? 'pass' : 'off'},
      stderr: {write() {}}, on() {}},
    Bun: {main: '/$bunfs/root/cli', version: 'synthetic-vm'},
    setTimeout(fn, delay, ...args) {calls.push({fn, delay, args}); return {unref() {}};},
    clearTimeout() {},
    wEe: () => false,
    ku: () => ({agentModelFamily: 'test',sessionModelFamily: 'test',
      served: {config: {refreshSeconds:[30],mode:'full',writer:{},maxInputTokens:100000}}}),
    ht: () => () => {}, Pi: 30000,
  });
  if (scenario !== 'no-hook' && scenario !== 'bound-callback') vm.runInContext(hook, context);
  vm.runInContext(scheduler + '\nUi("task","agent",{toolUseContext:{options:{mainLoopModel:"test"},agentContext:{agentType:"subagent"}}},()=>[],new Map());', context);
  const scheduled = calls[0];
  if (!scheduled) throw Error('No scheduler call');
  // Off already replaced the callback. In the bound case the scheduler is first allowed
  // to expose the real callback, then the hook sees only its bound wrapper.
  if (scenario === 'bound-callback') {
    vm.runInContext(hook, context);
    context.bound = scheduled.fn.bind(null);
    const before = calls.length;
    vm.runInContext('setTimeout(bound,30000)', context);
    if (calls.length !== before+1) throw Error('Bound call not observed');
  }
  vm.runInContext('setTimeout(function ordinary(){return 7},1234)', context);
  rows.push({scenario,schedulerDelayMs:scheduled.delay,
    schedulerCallbackCarriesAnchor:Function.prototype.toString.call(scheduled.fn).includes('[AgentSummary] Timer fired'),
    ordinaryDelayMs:calls.at(-1).delay,
    ...(scenario==='bound-callback'?{boundDelayMs:calls.at(-2).delay}:{}),
  });
}
for (const row of rows) {
  if (row.ordinaryDelayMs !== 1234) throw Error('Unrelated timer altered');
  if (row.scenario === 'off' && row.schedulerDelayMs !== 2147483647) throw Error('Expected suppression');
  if (row.scenario !== 'off' && row.schedulerDelayMs !== 30000) throw Error('Unexpected scheduler change');
  if (row.scenario === 'bound-callback' && row.boundDelayMs !== 30000) throw Error('Bound callback did not fail open');
}
fs.writeFileSync(outputPath,JSON.stringify({
  scope:'Extracted scheduler source in a synthetic Node VM; no live summary or billing measurement',
  binarySha256:crypto.createHash('sha256').update(binary).digest('hex'),
  hookSha256:crypto.createHash('sha256').update(hook).digest('hex'),
  schedulerSha256:crypto.createHash('sha256').update(scheduler).digest('hex'),
  schedulerSourceRange:[start,end],rows,
},null,2)+'\n');
