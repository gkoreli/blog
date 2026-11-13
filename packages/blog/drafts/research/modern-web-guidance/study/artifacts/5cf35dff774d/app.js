customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    // A reveal is permanent, including across motion changes and reconnection.
    if (this.classList.contains('revealed')) return;
    if (typeof IntersectionObserver !== 'function' || typeof matchMedia !== 'function') {
      this.reveal();
      return;
    }

    this.motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    if (this.motionPreference.matches || this.getBoundingClientRect().top < window.innerHeight) {
      this.reveal();
      return;
    }

    this.onMotionChange = event => {
      if (event.matches) this.reveal();
    };
    this.motionPreference.addEventListener('change', this.onMotionChange);

    try {
      this.observer = new IntersectionObserver(entries => {
        if (!this.isConnected) return;
        if (this.motionPreference.matches || entries.some(entry => entry.isIntersecting)) {
          this.reveal();
        }
      }, { threshold: .06 });
      this.observer.observe(this);
      this.classList.add('reveal-ready', 'reveal-pending');
    } catch {
      // Keep content readable if observation cannot be started.
      this.reveal();
    }
  }

  reveal() {
    if (this.motionPreference?.matches) this.classList.remove('reveal-ready');
    this.classList.add('revealed');
    this.classList.remove('reveal-pending');
    this.stopObserving();
  }

  stopObserving() {
    this.observer?.disconnect();
    this.observer = null;
    if (this.onMotionChange) {
      this.motionPreference.removeEventListener('change', this.onMotionChange);
      this.onMotionChange = null;
    }
  }

  disconnectedCallback() {
    this.stopObserving();
    this.classList.remove('reveal-ready', 'reveal-pending');
  }
});
