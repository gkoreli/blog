import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setDevMode, type TemplateResult } from '@nisli/core';
import { buildStaticSite, writeRoute } from '@nisli/ssg';

// Static snapshots deliberately leave browser-only custom elements unregistered.
setDevMode(false);

export interface PageDocument {
  head: string;
  body: TemplateResult;
}

export async function buildDocuments(outDir: string, pages: { path: string; document: PageDocument }[]) {
  const documents = new Map(pages.map(page => [page.path, page.document]));
  return buildStaticSite({
    outDir,
    clean: false,
    routes: pages.map(page => ({ path: page.path, render: () => page.document.body })),
    onPage(page) {
      const document = documents.get(page.path);
      if (!document) throw new Error(`Missing document shell for ${page.path}`);
      // SSG snapshots body fragments. Assemble the document outside the DOM
      // renderer so HTML parsing cannot discard the doctype, head, or body.
      page.html = `<!DOCTYPE html>\n<html lang="en">\n<head>${document.head}</head>\n<body>${page.html}</body>\n</html>`;
      writeRoute(outDir, page.path, page.html);
    },
  });
}

/** Render a separate snapshot for Markdown twins without consuming page templates. */
export async function renderContent(templates: TemplateResult[]): Promise<string[]> {
  if (templates.length === 0) return [];
  const outDir = mkdtempSync(join(tmpdir(), 'gkoreli-content-'));
  try {
    const result = await buildStaticSite({
      outDir,
      routes: templates.map((template, index) => ({ path: `/${index}`, render: () => template })),
    });
    return result.pages.map(page => page.html);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}
