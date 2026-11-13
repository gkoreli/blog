if ('customElements' in window) {
  customElements.define('blog-reveal', class extends HTMLElement {
    connectedCallback() {
      if (this.classList.contains('revealed')) return;

      // Content stays readable unless all enhancement prerequisites succeed.
      if (!('IntersectionObserver' in window) || !window.matchMedia) {
        this.reveal();
        return;
      }

      this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (this.motionPreference.matches ||
          this.getBoundingClientRect().top < window.innerHeight) {
        this.reveal();
        return;
      }

      this.onMotionChange = event => {
        if (event.matches) this.reveal();
      };

      try {
        this.motionPreference.addEventListener('change', this.onMotionChange);
        const observer = new IntersectionObserver(entries => {
          // Ignore callbacks queued before removal or a preference change.
          if (!this.isConnected || this.observer !== observer) return;
          if (entries.some(entry => entry.isIntersecting)) this.reveal();
        }, { threshold: .06 });
        this.observer = observer;
        observer.observe(this);
        this.classList.add('reveal-pending');
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
      if (this.motionPreference && this.onMotionChange) {
        this.motionPreference.removeEventListener('change', this.onMotionChange);
      }
      this.motionPreference = null;
      this.onMotionChange = null;
    }

    disconnectedCallback() {
      this.stopObserving();
      this.classList.remove('reveal-pending');
    }
  });
}
