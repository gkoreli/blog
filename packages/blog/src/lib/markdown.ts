import { Marked, Renderer, type Tokens } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { createHighlighter } from 'shiki';
import markedShiki from 'marked-shiki';

let renderer: Marked | undefined;
let rendering = Promise.resolve();

export async function initMarkdown(): Promise<void> {
  if (renderer) return;

  const highlighter = await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: ['typescript', 'javascript', 'html', 'css', 'json', 'bash', 'markdown', 'yaml', 'go', 'c'],
  });

  const externalLinks = {
    renderer: {
      link(this: Renderer, token: Tokens.Link) {
        const link = Renderer.prototype.link.call(this, token);
        if (token.href.startsWith('/') || token.href.startsWith('#')) {
          return link;
        }
        return link.replace(/^<a /, '<a target="_blank" rel="noopener" ');
      },
    },
  };

  renderer = new Marked(
    externalLinks,
    gfmHeadingId(),
    markedShiki({
      highlight: (code, lang) => highlighter.codeToHtml(code, {
        lang: lang || 'text',
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: false,
      }),
    }),
  );
}

export async function renderMarkdown(content: string): Promise<string> {
  if (!renderer) throw new Error('Call initMarkdown() first');
  const current = renderer;
  // The heading extension keeps module-level slug state. Serialize async parses
  // so another document cannot reset it while Shiki is awaiting token work.
  const result = rendering.then(() => current.parse(content));
  rendering = result.then(() => undefined, () => undefined);
  return await result;
}
