import { Marked } from 'marked';
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
      link({ href, text }: { href: string; text: string }) {
        if (href.startsWith('/') || href.startsWith('#')) {
          return `<a href="${href}">${text}</a>`;
        }
        return `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
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
