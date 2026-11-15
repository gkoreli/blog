/** Keep a changing current item visible without moving the page's vertical position. */
export function initSectionNavigation(root: ParentNode = document): () => void {
  const disposers: (() => void)[] = [];
  for (const navigation of root.querySelectorAll<HTMLElement>('[data-section-navigation]')) {
    if (navigation.dataset['navigationReady']) continue;
    const fragmentLinks = Array.from(navigation.querySelectorAll<HTMLAnchorElement>('a')).filter(link => link.hash && link.pathname === location.pathname);
    const destinations = fragmentLinks.flatMap(link => {
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      return target ? [{ link, target }] : [];
    });
    // A report's dynamic sections register after their first complete render.
    if (destinations.length !== fragmentLinks.length) continue;
    navigation.dataset['navigationReady'] = 'true';
    let frame = 0;
    const reveal = () => {
      const current = navigation.querySelector<HTMLElement>('a[aria-current]');
      if (!current) return;
      const view = navigation.getBoundingClientRect(), item = current.getBoundingClientRect();
      if (item.left < view.left) navigation.scrollLeft -= view.left - item.left + 8;
      else if (item.right > view.right) navigation.scrollLeft += item.right - view.right + 8;
    };
    const update = () => {
      frame = 0;
      const boundary = Math.max(0, navigation.getBoundingClientRect().top) + Math.min(navigation.clientHeight, 70) + 32;
      let active = destinations[0];
      for (const destination of destinations) if (destination.target.getClientRects().length && destination.target.getBoundingClientRect().top <= boundary) active = destination;
      for (const destination of destinations) {
        if (destination === active && destination.link.getAttribute('aria-current') !== 'location') destination.link.setAttribute('aria-current', 'location');
        else if (destination !== active) destination.link.removeAttribute('aria-current');
      }
      reveal();
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const mutation = new MutationObserver(reveal);
    mutation.observe(navigation, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : undefined;
    resize?.observe(navigation);
    document.addEventListener('scroll', schedule, { passive: true });
    update();
    disposers.push(() => { mutation.disconnect(); resize?.disconnect(); document.removeEventListener('scroll', schedule); cancelAnimationFrame(frame); delete navigation.dataset['navigationReady']; });
  }
  return () => { for (const dispose of disposers) dispose(); };
}
