customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    // A reveal is permanent, including across removal and reinsertion.
    if (this.classList.contains('revealed')) return;

    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionChange = event => {
      if (event.matches) this.reveal();
    };
    this.motionPreference.addEventListener('change', this.onMotionChange);

    if (this.motionPreference.matches ||
        typeof IntersectionObserver === 'undefined' ||
        this.getBoundingClientRect().top < window.innerHeight) {
      this.reveal();
      return;
    }

    const observer = new IntersectionObserver(entries => {
      // Ignore callbacks queued before removal or a preference change.
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
    this.stopListening();
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  stopListening() {
    if (this.motionPreference && this.onMotionChange) {
      this.motionPreference.removeEventListener('change', this.onMotionChange);
      this.onMotionChange = null;
    }
  }

  disconnectedCallback() {
    this.stopObserving();
    this.stopListening();
    this.classList.remove('reveal-pending');
  }
});
