customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    // Content stays visible unless all enhancement prerequisites are available.
    if (this.classList.contains('revealed') ||
        typeof IntersectionObserver !== 'function' ||
        typeof window.matchMedia !== 'function') {
      this.reveal();
      return;
    }

    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionChange = () => {
      if (this.motionPreference.matches) {
        this.reveal();
        this.classList.remove('reveal-enabled');
      }
    };
    this.motionPreference.addEventListener('change', this.onMotionChange);

    const bounds = this.getBoundingClientRect();
    if (this.motionPreference.matches || bounds.top < window.innerHeight) {
      this.reveal();
      return;
    }

    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) this.reveal();
    });
    this.observer.observe(this);
    this.classList.add('reveal-enabled', 'reveal-pending');
  }

  reveal() {
    this.classList.add('revealed');
    this.classList.remove('reveal-pending');
    this.observer?.disconnect();
    this.observer = null;
  }

  disconnectedCallback() {
    this.reveal();
    this.classList.remove('reveal-enabled');
    this.motionPreference?.removeEventListener('change', this.onMotionChange);
    this.motionPreference = null;
    this.onMotionChange = null;
  }
});
