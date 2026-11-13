customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    // Content stays visible unless every part of the enhancement is available.
    if (typeof window.matchMedia !== 'function' ||
        typeof window.IntersectionObserver !== 'function') {
      this.reveal();
      return;
    }

    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionChange = () => {
      if (this.motionPreference.matches) this.reveal(true);
    };
    this.motionPreference.addEventListener('change', this.onMotionChange);

    if (this.motionPreference.matches) {
      this.reveal(true);
      return;
    }
    if (this.classList.contains('revealed')) return;

    // Cards already reached by the reader never need to wait for observation.
    if (this.getBoundingClientRect().top < window.innerHeight) {
      this.reveal();
      return;
    }

    try {
      const observer = new IntersectionObserver(entries => {
        if (this.observer !== observer || !this.isConnected) return;
        if (entries.some(entry => entry.target === this && entry.isIntersecting)) {
          this.reveal();
        }
      }, { threshold: .06 });
      this.observer = observer;
      observer.observe(this);
      this.classList.add('reveal-enabled', 'reveal-pending');
    } catch {
      this.reveal();
    }
  }

  reveal(immediate = false) {
    this.observer?.disconnect();
    this.observer = null;
    if (immediate) this.classList.remove('reveal-enabled');
    this.classList.remove('reveal-pending');
    this.classList.add('revealed');
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.observer = null;
    this.motionPreference?.removeEventListener('change', this.onMotionChange);
    this.motionPreference = null;
    this.onMotionChange = null;
    this.classList.remove('reveal-enabled', 'reveal-pending');
  }
});
