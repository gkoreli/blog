customElements.define('blog-reveal', class extends HTMLElement {
  connectedCallback() {
    // Visibility is permanent once a card has been shown, even after reconnecting.
    if (this.classList.contains('revealed')) return;

    if (typeof window.IntersectionObserver !== 'function' || !window.matchMedia) {
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
    // Keyboard users should never focus an invisible link.
    this.onFocus = () => this.reveal();
    this.addEventListener('focusin', this.onFocus);

    const observer = new IntersectionObserver(entries => {
      if (!this.isConnected || this.observer !== observer) return;
      if (entries.some(entry => entry.isIntersecting)) this.reveal();
    }, { threshold: 0 });
    this.observer = observer;
    observer.observe(this);
    this.classList.add('reveal-enabled', 'reveal-pending');
  }

  reveal() {
    this.classList.add('revealed');
    this.classList.remove('reveal-pending');
    this.cleanup();
  }

  cleanup() {
    this.observer?.disconnect();
    this.observer = null;
    if (this.onMotionChange) {
      this.motionPreference.removeEventListener('change', this.onMotionChange);
      this.onMotionChange = null;
    }
    if (this.onFocus) {
      this.removeEventListener('focusin', this.onFocus);
      this.onFocus = null;
    }
  }

  disconnectedCallback() {
    this.cleanup();
    this.classList.remove('reveal-enabled', 'reveal-pending');
  }
});
