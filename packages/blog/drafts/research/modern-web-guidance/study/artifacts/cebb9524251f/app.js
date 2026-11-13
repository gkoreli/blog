customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    if (this.classList.contains('revealed')) return;

    // Hide content only when entry observation and motion are available.
    if (!('IntersectionObserver' in window) || !window.matchMedia) {
      this.reveal();
      return;
    }

    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (this.motionPreference.matches || this.getBoundingClientRect().top < window.innerHeight) {
      this.reveal();
      return;
    }

    this.onMotionChange = event => {
      if (event.matches) this.reveal();
    };
    this.motionPreference.addEventListener('change', this.onMotionChange);
    this.onFocus = () => this.reveal();
    this.addEventListener('focusin', this.onFocus);
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) this.reveal();
    }, { threshold: 0.06 });
    this.observer.observe(this);
    this.classList.add('reveal-pending');
  }

  reveal() {
    this.classList.add('revealed');
    this.classList.remove('reveal-pending');
    this.cleanup();
  }

  cleanup() {
    this.observer?.disconnect();
    this.observer = null;
    if (this.onFocus) {
      this.removeEventListener('focusin', this.onFocus);
      this.onFocus = null;
    }
    if (this.onMotionChange) {
      this.motionPreference.removeEventListener('change', this.onMotionChange);
      this.onMotionChange = null;
    }
  }

  disconnectedCallback() {
    this.cleanup();
    this.classList.remove('reveal-pending');
  }
});
