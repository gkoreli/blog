import { component, html, onMount } from '@nisli/core';

component('nisli-scroll-reveal', (_props, host) => {
  // Save children before template replaces them
  const fragment = document.createDocumentFragment();
  while (host.firstChild) fragment.appendChild(host.firstChild);

  onMount(() => {
    // Restore children after mount
    host.appendChild(fragment);

    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
      }
    }, { threshold: 0.06 });
    io.observe(host);
    return () => io.disconnect();
  });

  return html``;
});
