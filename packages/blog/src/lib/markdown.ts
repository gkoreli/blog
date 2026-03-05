import { Marked } from 'marked';
import { createHighlighter } from 'shiki';
import markedShiki from 'marked-shiki';

let renderer: Marked | undefined;

export async function initMarkdown(): Promise<void> {
  const highlighter = await createHighlighter({
    themes: ['github-dark'],
    langs: ['typescript', 'javascript', 'html', 'css', 'json', 'bash', 'markdown', 'yaml'],
  });

  renderer = new Marked(
    markedShiki({ highlight: (code, lang) => highlighter.codeToHtml(code, { lang: lang || 'text', theme: 'github-dark' }) }),
  );
}

export async function renderMarkdown(content: string): Promise<string> {
  if (!renderer) throw new Error('Call initMarkdown() first');
  return await renderer.parse(content);
}
