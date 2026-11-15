/** Progressive reading affordances. Source content and navigation stay native. */
export function enhanceReadingTables(root: ParentNode = document): () => void {
  const disposers: (() => void)[] = [];
  for (const frame of root.querySelectorAll<HTMLElement>('[data-reading-table]')) {
    if (frame.dataset['readingReady']) continue;
    const scroll = frame.querySelector<HTMLElement>('.reading-table-scroll');
    const cue = frame.querySelector<HTMLElement>('.reading-table-cue');
    if (!scroll || !cue) continue;
    frame.dataset['readingReady'] = 'true';
    const update = () => {
      const overflow = scroll.scrollWidth > scroll.clientWidth + 1;
      cue.hidden = !overflow;
      frame.classList.toggle('reading-table--overflowing', overflow);
      frame.classList.toggle('reading-table--panned', scroll.scrollLeft > 1);
    };
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : undefined;
    resize?.observe(scroll);
    scroll.addEventListener('scroll', update, { passive: true });
    update();
    disposers.push(() => { resize?.disconnect(); scroll.removeEventListener('scroll', update); delete frame.dataset['readingReady']; });
  }
  return () => { for (const dispose of disposers) dispose(); };
}

export function initReading(): void {
  enhanceReadingTables();
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-reading-contents] a'));
  const sections = links.flatMap(link => {
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    return target ? [{ link, target }] : [];
  });
  if (sections.length) {
    let scheduled = false;
    const update = () => {
      scheduled = false;
      let active = sections[0]?.target;
      for (const { target } of sections) if (target.getBoundingClientRect().top <= 140) active = target;
      for (const { link, target } of sections) {
        if (target === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    };
    const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
    document.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
  }
}
