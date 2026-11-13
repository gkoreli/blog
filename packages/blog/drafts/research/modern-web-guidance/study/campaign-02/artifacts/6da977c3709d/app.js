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

    const observer = new IntersectionObserver(entries => {
      if (!this.isConnected || this.observer !== observer) return;
      if (entries.some(entry => entry.isIntersecting)) this.reveal();
    }, { threshold: 0 });
    this.observer = observer;
    this.classList.add('reveal-pending');
    observer.observe(this);
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
    this.classList.remove('reveal-pending');
  }
});
