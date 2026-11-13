customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    if (this.classList.contains('revealed')) return;

    if (typeof window.IntersectionObserver !== 'function' ||
        typeof window.matchMedia !== 'function') {
      this.reveal();
      return;
    }

    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (this.motionPreference.matches ||
        this.getBoundingClientRect().top < document.documentElement.clientHeight) {
      this.reveal();
      return;
    }

    this.onMotionChange = event => {
      if (event.matches) this.reveal();
    };
    this.motionPreference.addEventListener('change', this.onMotionChange);

    const observer = new IntersectionObserver(entries => {
      // Ignore queued notifications from an observation that has ended.
      if (this.observer !== observer || !this.isConnected) return;
      if (entries.some(entry => entry.target === this && entry.isIntersecting)) {
        this.reveal();
      }
    }, { threshold: 0.06 });
    this.observer = observer;
    observer.observe(this);
    this.classList.add('reveal-pending');
  }

  reveal() {
    this.stopObserving();
    this.classList.remove('reveal-pending');
    this.classList.add('revealed');
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.onMotionChange) {
      this.motionPreference.removeEventListener('change', this.onMotionChange);
      this.onMotionChange = null;
    }
  }

  disconnectedCallback() {
    this.stopObserving();
    this.classList.remove('reveal-pending');
  }
});
