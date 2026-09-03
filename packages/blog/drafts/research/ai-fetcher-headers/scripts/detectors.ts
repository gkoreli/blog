/**
 * Runs the captured User-Agent strings through the open-source detectors.
 *
 * Standalone; not part of the site build. Run from a scratch folder:
 *   npm i isbot node-device-detector js-yaml tsx
 *   curl -sLo bots.yml https://raw.githubusercontent.com/matomo-org/device-detector/master/regexes/bots.yml
 *   curl -sLo crawler-user-agents.json https://raw.githubusercontent.com/monperrus/crawler-user-agents/master/crawler-user-agents.json
 *   curl -sLo ai-robots.json https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json
 *   npx tsx detectors.ts
 *
 * Three device-detector views are reported: the Node port (node-device-detector,
 * which ships the upstream regexes compiled), and the upstream bots.yml parsed with
 * js-yaml and evaluated with the same anchoring rule the PHP library uses.
 */
import { readFileSync } from 'node:fs';
import { isbot } from 'isbot';
import DeviceDetector from 'node-device-detector';
import yaml from 'js-yaml';

const captured: Record<string, string> = {
  'ChatGPT-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  'Claude-User (claude.ai)': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +claude-user@anthropic.com)',
  'Gemini app': 'Google',
  'Claude Code WebFetch': 'Claude-User (claude-code/2.1.259; +https://support.anthropic.com/)',
  'Grok exit, Safari UA': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15',
  'Grok exit, Chrome UA': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  'Chrome 152 (human baseline)': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
};

type BotRule = { regex: string; name: string; category?: string };
const upstreamRules = yaml.load(readFileSync('bots.yml', 'utf8')) as BotRule[];
// The PHP library anchors every bot regex this way (Parser/AbstractParser.php, matchUserAgent).
const anchor = (rx: string): RegExp => new RegExp(`(?:^|[^A-Z0-9\\-_]|[^A-Z0-9\\-]_|sprd-|MZ-)(?:${rx})`, 'i');
const upstream = (ua: string): string[] => {
  const hits: string[] = [];
  for (const r of upstreamRules) {
    try { if (anchor(r.regex).test(ua)) hits.push(`${r.name} (${r.category ?? 'no category'})`); } catch { hits.push(`UNCOMPILABLE ${r.name}`); }
  }
  return hits;
};

const detector = new DeviceDetector({ skipBotDetection: false });
const nodePort = (ua: string): string => {
  const bot = detector.parseBot(ua) as { name?: string; category?: string } | null;
  return bot && bot.name ? `${bot.name} (${bot.category ?? 'no category'})` : 'no match';
};

type Cua = { pattern: string };
const cua = JSON.parse(readFileSync('crawler-user-agents.json', 'utf8')) as Cua[];
const crawlerUa = (ua: string): string[] => cua.filter((c) => new RegExp(c.pattern).test(ua)).map((c) => c.pattern);

const aiRobots = JSON.parse(readFileSync('ai-robots.json', 'utf8')) as Record<string, { operator?: string }>;
const aiRobotsEntry = (ua: string): string[] => Object.keys(aiRobots).filter((k) => ua.toLowerCase().includes(k.toLowerCase()));

console.log(`isbot ${JSON.parse(readFileSync('node_modules/isbot/package.json', 'utf8')).version}; node-device-detector ${JSON.parse(readFileSync('node_modules/node-device-detector/package.json', 'utf8')).version}; upstream bots.yml rules ${upstreamRules.length}; crawler-user-agents ${cua.length}; ai.robots.txt ${Object.keys(aiRobots).length}`);
console.log('');
console.log('| Captured | isbot | node-device-detector | upstream bots.yml (PHP anchoring) | crawler-user-agents | ai.robots.txt |');
console.log('|---|---|---|---|---|---|');
for (const [label, ua] of Object.entries(captured)) {
  const row = [label, isbot(ua) ? 'bot' : 'not a bot', nodePort(ua), upstream(ua).join('; ') || 'no match', crawlerUa(ua).join('; ') || 'no match', aiRobotsEntry(ua).join('; ') || 'no entry'];
  console.log(`| ${row.join(' | ')} |`);
}
