/** Explicitly supplied examples, never evidence about a live site. */
export const ROBOTS_EXAMPLES = [
  { id: 'search', label: 'Allow search, block training', token: 'OAI-SearchBot', path: '/guides/agent-access', robots: 'User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n' },
  { id: 'exception', label: 'A private path with an exception', token: 'OAI-SearchBot', path: '/private/public/article', robots: 'User-agent: *\nDisallow: /private/\nAllow: /private/public/\n' },
  { id: 'specific', label: 'A client-specific group', token: 'GPTBot', path: '/guides/article', robots: 'User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n' },
] as const;
