import { CONTENT_LICENSE } from '../lib/license.js';

export function robotsTxt(): string {
  return `User-agent: *
Allow: /

Content-Signal: search=yes, ai-input=yes
# Content license: ${CONTENT_LICENSE.name} (${CONTENT_LICENSE.pageUrl}). Quote and cite freely with attribution and a link to the canonical URL. Machine-readable citation: request any post with Accept: application/vnd.citationstyles.csl+json

Sitemap: https://gkoreli.com/sitemap.xml
`;
}
