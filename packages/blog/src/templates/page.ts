import { html, raw } from 'nisli-static';

export function pageShell({ title, description, content }: { title: string; description: string; content: string }) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Goga Koreli</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="article">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header>
    <nav>
      <a href="/" class="site-title">gkoreli.com</a>
    </nav>
  </header>

  <main>
    ${raw(content)}
  </main>

  <footer>
    <p>Built with <a href="https://www.npmjs.com/package/@nisli/core">@nisli/core</a></p>
  </footer>

  <script type="module" src="/main.js"></script>
</body>
</html>`;
}
