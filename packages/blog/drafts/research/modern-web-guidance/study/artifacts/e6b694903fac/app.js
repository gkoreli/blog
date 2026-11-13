if ('customElements' in window) {
  customElements.define('blog-reveal', class extends HTMLElement {
    connectedCallback() {
      if (this.classList.contains('revealed')) return;

      this.motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      this.onMotionChange = event => {
        if (event.matches) this.reveal();
      };

      if (this.motionPreference?.matches || !('IntersectionObserver' in window)) {
        this.reveal();
        return;
      }

      // Content already in or above the viewport needs no entrance animation.
      if (this.getBoundingClientRect().top < window.innerHeight) {
        this.reveal();
        return;
      }

      try {
        this.observer = new IntersectionObserver(entries => {
          if (entries.some(entry => entry.isIntersecting)) this.reveal();
        }, { threshold: .06 });
        this.classList.add('reveal-pending');
        this.observer.observe(this);
        if (this.motionPreference?.addEventListener) {
          this.motionPreference.addEventListener('change', this.onMotionChange);
        } else {
          this.motionPreference?.addListener(this.onMotionChange);
        }
      } catch {
        // Enhancement failure must leave the article readable.
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
      if (this.motionPreference?.removeEventListener) {
        this.motionPreference.removeEventListener('change', this.onMotionChange);
      } else {
        this.motionPreference?.removeListener(this.onMotionChange);
      }
    }

    disconnectedCallback() {
      this.stopObserving();
      this.classList.remove('reveal-pending');
    }
  });
}
