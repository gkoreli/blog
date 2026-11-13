customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    // Visible is the default; only opt into waiting when observation is available.
    if (this.classList.contains('revealed')) return;
    if (typeof IntersectionObserver !== 'function') {
      this.reveal();
      return;
    }

    this.motionPreference = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    this.onMotionChange = event => {
      if (event.matches) this.reveal(true);
    };
    this.motionPreference?.addEventListener('change', this.onMotionChange);

    if (this.motionPreference?.matches) {
      this.reveal(true);
      return;
    }

    // Cards already in or above the viewport should never wait for entry.
    if (this.getBoundingClientRect().top < window.innerHeight) {
      this.reveal();
      return;
    }

    const observer = new IntersectionObserver(entries => {
      if (this.observer !== observer || !this.isConnected) return;
      if (entries.some(entry => entry.target === this && entry.isIntersecting)) {
        this.reveal();
      }
    });
    this.observer = observer;
    this.classList.add('reveal-enabled', 'reveal-pending');
    observer.observe(this);
  }

  reveal(immediate = false) {
    this.observer?.disconnect();
    this.observer = null;
    if (immediate) this.classList.remove('reveal-enabled');
    this.classList.remove('reveal-pending');
    this.classList.add('revealed');
    // Keep the motion listener during a reveal so a preference change can
    // cancel a transition that is still running.
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.observer = null;
    this.motionPreference?.removeEventListener('change', this.onMotionChange);
    this.motionPreference = null;
    this.classList.remove('reveal-enabled', 'reveal-pending');
  }
});
