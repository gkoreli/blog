customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    if (this.classList.contains('revealed')) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const bounds = this.getBoundingClientRect();
    if (motion.matches || typeof window.IntersectionObserver !== 'function' ||
        bounds.top < document.documentElement.clientHeight) {
      this.reveal();
      return;
    }

    this.motion = motion;
    this.onMotionChange = event => {
      if (event.matches) this.reveal();
    };
    motion.addEventListener('change', this.onMotionChange);
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) this.reveal();
    });
    this.observer.observe(this);
    this.classList.add('reveal-enabled', 'reveal-pending');
  }

  reveal() {
    this.classList.add('revealed');
    this.classList.remove('reveal-pending');
    this.stopObserving();
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.motion) {
      this.motion.removeEventListener('change', this.onMotionChange);
      this.motion = null;
      this.onMotionChange = null;
    }
  }

  disconnectedCallback() {
    this.stopObserving();
    this.classList.remove('reveal-enabled', 'reveal-pending');
  }
});
