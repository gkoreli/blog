class PrototypeToolLens extends HTMLElement {
  connectedCallback() {
    if (this.hasAttribute('data-enhanced')) return;
    const tabs = [...this.querySelectorAll('[data-panel]')];
    const panels = [...this.querySelectorAll('[data-tool-panel]')];
    const tablist = this.querySelector('.lens-tabs');
    if (!tablist || !tabs.length || panels.length !== tabs.length) return;
    tablist.setAttribute('role', 'tablist');
    this.setAttribute('data-enhanced', '');
    const select = (target, focus = false) => {
      for (const tab of tabs) {
        const active = tab === target;
        tab.setAttribute('aria-selected', String(active));
        tab.setAttribute('tabindex', active ? '0' : '-1');
      }
      for (const panel of panels) panel.hidden = panel.dataset.toolPanel !== target.dataset.panel;
      if (focus) target.focus();
    };
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
        if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
        if (event.key === 'Home') next = tabs[0];
        if (event.key === 'End') next = tabs[tabs.length - 1];
        if (next) { event.preventDefault(); select(next, true); }
      });
    });
    for (const panel of panels) {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${panel.dataset.toolPanel}`);
      panel.setAttribute('tabindex', '0');
    }
    select(tabs[0]);
  }
}
customElements.define('prototype-tool-lens', PrototypeToolLens);

// Preview controls never persist theme preferences to the real publication.
const theme = new URLSearchParams(location.search).get('theme');
if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
