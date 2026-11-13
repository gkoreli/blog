customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    if (this.classList.contains('revealed')) return;

    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (this.motionPreference.matches ||
        typeof window.IntersectionObserver !== 'function' ||
        this.getBoundingClientRect().top < window.innerHeight) {
      this.reveal();
      return;
    }

    this.onMotionChange = event => {
      if (event.matches) this.reveal();
    };
    this.motionPreference.addEventListener('change', this.onMotionChange);

    try {
      const observer = new IntersectionObserver(entries => {
        if (this.observer !== observer || !this.isConnected) return;
        if (entries.some(entry => entry.target === this && entry.isIntersecting)) {
          this.reveal();
        }
      }, { threshold: 0 });
      this.observer = observer;
      observer.observe(this);
      this.classList.add('reveal-enabled', 'reveal-pending');
    } catch {
      this.reveal();
    }
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
  }

  disconnectedCallback() {
    this.stopObserving();
    this.classList.remove('reveal-enabled', 'reveal-pending');
  }
});
