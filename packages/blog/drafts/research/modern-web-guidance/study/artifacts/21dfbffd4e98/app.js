customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    if (this.classList.contains('revealed')) return;

    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (this.motionPreference.matches || !('IntersectionObserver' in window)) {
      this.reveal();
      return;
    }

    // Cards already in or above the viewport should be readable immediately.
    if (this.getBoundingClientRect().top < window.innerHeight) {
      this.reveal();
      return;
    }

    this.onMotionChange = event => {
      if (event.matches) this.reveal();
    };
    this.motionPreference.addEventListener('change', this.onMotionChange);
    this.observer = new IntersectionObserver(entries => {
      if (!this.isConnected) return;
      if (entries.some(entry => entry.target === this && entry.isIntersecting)) {
        this.reveal();
      }
    }, { threshold: 0.06 });
    this.classList.add('reveal-enabled', 'reveal-pending');
    this.observer.observe(this);
  }

  reveal() {
    this.stopObserving();
    this.classList.remove('reveal-pending');
    this.classList.add('revealed');
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
    this.classList.remove('reveal-pending', 'reveal-enabled');
  }
});
