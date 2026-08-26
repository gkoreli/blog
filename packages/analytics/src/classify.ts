import type { DeviceType, TrafficClass } from './contracts.js';

export interface TrafficClassification {
  trafficClass: TrafficClass;
  agentName: string | null;
}

interface AgentRule {
  name: string;
  pattern: RegExp;
}

const AI_RULES: readonly AgentRule[] = [
  { name: 'GPTBot', pattern: /GPTBot/i },
  { name: 'ChatGPT-User', pattern: /ChatGPT-User/i },
  { name: 'ClaudeBot', pattern: /ClaudeBot/i },
  { name: 'Claude-Web', pattern: /Claude-Web/i },
  { name: 'PerplexityBot', pattern: /PerplexityBot/i },
  { name: 'CCBot', pattern: /CCBot/i },
  { name: 'Amazonbot', pattern: /Amazonbot/i },
  { name: 'Applebot-Extended', pattern: /Applebot-Extended/i },
  { name: 'Bytespider', pattern: /Bytespider/i },
  { name: 'GoogleOther', pattern: /GoogleOther/i },
  { name: 'Google-CloudVertexBot', pattern: /Google-CloudVertexBot/i },
  { name: 'Meta-ExternalAgent', pattern: /Meta-ExternalAgent/i },
  { name: 'DuckAssistBot', pattern: /DuckAssistBot/i },
  { name: 'Cohere-AI', pattern: /Cohere-AI/i },
  { name: 'PetalBot', pattern: /PetalBot/i },
];

const BOT_RULES: readonly AgentRule[] = [
  { name: 'Googlebot', pattern: /Googlebot/i },
  { name: 'Bingbot', pattern: /bingbot/i },
  { name: 'DuckDuckBot', pattern: /DuckDuckBot/i },
  { name: 'YandexBot', pattern: /YandexBot/i },
  { name: 'Baiduspider', pattern: /Baiduspider/i },
  { name: 'FacebookBot', pattern: /facebookexternalhit|Facebot/i },
  { name: 'LinkedInBot', pattern: /LinkedInBot/i },
  { name: 'Slackbot', pattern: /Slackbot/i },
];

const GENERIC_BOT = /bot\b|spider|crawler|crawl\b|slurp|scrapy|headless|phantom|selenium|wget|curl\/|python-requests|Go-http-client|UptimeRobot|Lighthouse/i;

function namedMatch(userAgent: string, rules: readonly AgentRule[]): string | null {
  for (const rule of rules) {
    if (rule.pattern.test(userAgent)) return rule.name;
  }
  return null;
}

export function classifyTraffic(userAgent: string): TrafficClassification {
  const aiName = namedMatch(userAgent, AI_RULES);
  if (aiName !== null) return { trafficClass: 'ai', agentName: aiName };

  const botName = namedMatch(userAgent, BOT_RULES);
  if (botName !== null) return { trafficClass: 'bot', agentName: botName };

  if (GENERIC_BOT.test(userAgent)) return { trafficClass: 'bot', agentName: null };
  return { trafficClass: 'browser', agentName: null };
}

export function classifyDevice(userAgent: string): DeviceType {
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))) {
    return 'tablet';
  }
  if (/Mobile|iPhone|iPod|Android|IEMobile|Opera Mini/i.test(userAgent)) return 'mobile';
  return 'desktop';
}
