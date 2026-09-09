import type TurndownService from 'turndown';

/** Preserve a table's header/row relationships in the Markdown representation. */
export function preserveMarkdownTables(renderer: TurndownService): void {
  renderer.addRule('table', {
    filter: 'table',
    replacement: (_content, table) => {
      const rows = Array.from(table.querySelectorAll('tr'));
      const header = rows[0];
      if (!header) return '';
      const width = header.cells.length;
      const rectangular = width > 0 && rows.every(row =>
        row.closest('table') === table
        && row.cells.length === width
        && Array.from(row.cells).every(cell => cell.colSpan === 1 && cell.rowSpan === 1));
      if (!rectangular || !Array.from(header.cells).every(cell => cell.tagName === 'TH')) {
        // GFM cannot express merged cells. Retain their HTML relationships.
        return `\n\n${table.outerHTML}\n\n`;
      }
      const line = (row: HTMLTableRowElement) => `| ${Array.from(row.cells).map(cell =>
        renderer.turndown(cell.innerHTML).trim().replace(/\n+/g, ' ').replace(/\\?\|/g, '\\|'),
      ).join(' | ')} |`;
      return `\n\n${[
        line(header),
        `| ${Array.from({ length: width }, () => '---').join(' | ')} |`,
        ...rows.slice(1).map(line),
      ].join('\n')}\n\n`;
    },
  });
}
