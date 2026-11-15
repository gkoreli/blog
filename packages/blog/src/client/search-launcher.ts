let modulePromise: Promise<typeof import('./search.js')> | undefined;
const load = () => modulePromise ??= import('./search.js');
const shortcut = /Mac|iPhone|iPad/u.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
for (const trigger of document.querySelectorAll('[data-search-open]')) trigger.setAttribute('title', `Search publication (${shortcut})`);
const dialog = document.querySelector('[data-publication-search-dialog]');
let opener: HTMLElement | null = null;

async function openSearch(trigger?: HTMLElement): Promise<void> {
  if (!(dialog instanceof HTMLDialogElement)) { location.assign('/search'); return; }
  if (dialog.open) { dialog.close(); return; }
  opener = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  dialog.showModal(); document.documentElement.classList.add('search-open');
  const input = dialog.querySelector('input'); if (input instanceof HTMLInputElement) input.focus();
  const root = dialog.querySelector('[data-search-surface]'); if (root instanceof HTMLElement) { const search = await load(); if (dialog.open) search.enhanceSearch(root)?.run(); }
}
document.querySelectorAll('[data-search-open]').forEach(link => link.addEventListener('click', event => { if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)) return; event.preventDefault(); void openSearch(link instanceof HTMLElement ? link : undefined); }));
document.addEventListener('keydown', event => {
  const target = event.target;
  const editable = target instanceof Element && (target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]') !== null);
  if (event.defaultPrevented || event.isComposing || event.repeat) return;
  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k' || event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && !editable) { event.preventDefault(); void openSearch(); }
});
if (dialog instanceof HTMLDialogElement) {
  // type=search can consume the first Escape to clear a nonempty value. The
  // dialog's advertised shortcut closes immediately and retains that query.
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.isComposing) { event.preventDefault(); event.stopPropagation(); dialog.close(); }
  }, { capture: true });
  dialog.querySelector('[data-search-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.documentElement.classList.remove('search-open'); opener?.focus(); });
}
const page = document.querySelector('.search-page [data-search-surface]');
if (page instanceof HTMLElement) {
  const params = new URLSearchParams(location.search), query = params.get('q') ?? '';
  void load().then(search => {
    const section = page.querySelector('select[name="section"]');
    if (section instanceof HTMLSelectElement) section.value = params.get('section') ?? '';
    const surface = search.enhanceSearch(page);
    if (surface) { surface.input.value = query; if (query) surface.run(); }
  });
}
