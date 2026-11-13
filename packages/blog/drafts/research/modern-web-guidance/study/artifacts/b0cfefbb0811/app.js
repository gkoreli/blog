customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    // Visibility is the fallback; only cards below the viewport need to wait.
    if (this.classList.contains('revealed')) return;
    if (!('IntersectionObserver' in window) || !window.matchMedia) return;

    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (this.motionPreference.matches || this.getBoundingClientRect().top < window.innerHeight) {
      this.reveal();
      return;
    }

    this.onMotionChange = event => {
      if (event.matches) this.reveal();
    };
    this.motionPreference.addEventListener('change', this.onMotionChange);
    this.observer = new IntersectionObserver(entries => {
      if (this.isConnected && entries.some(entry => entry.isIntersecting)) this.reveal();
    }, { threshold: 0.06 });
    this.observer.observe(this);
    this.classList.add('reveal-enabled', 'reveal-pending');
  }

  reveal() {
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
    this.motionPreference = null;
  }

  disconnectedCallback() {
    this.stopObserving();
    this.classList.remove('reveal-enabled', 'reveal-pending');
  }
});
