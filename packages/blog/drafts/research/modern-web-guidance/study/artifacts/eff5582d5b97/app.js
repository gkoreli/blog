if ('customElements' in window) {
  customElements.define('blog-reveal', class extends HTMLElement {
    connectedCallback() {
      if (typeof window.matchMedia !== 'function') {
        this.reveal();
        return;
      }

      this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.onMotionChange = () => {
        if (this.motionPreference.matches) {
          // Cancel any running transition before making the card visible.
          this.classList.remove('reveal-enabled');
          this.reveal();
        }
      };
      this.motionPreference.addEventListener('change', this.onMotionChange);

      if (this.motionPreference.matches ||
          typeof window.IntersectionObserver !== 'function' ||
          this.classList.contains('revealed') ||
          this.getBoundingClientRect().top < window.innerHeight) {
        this.reveal();
        return;
      }

      this.observer = new IntersectionObserver(entries => {
        if (this.isConnected && entries.some(entry => entry.isIntersecting)) {
          this.reveal();
        }
      }, { threshold: 0.06 });
      this.observer.observe(this);
      this.classList.add('reveal-enabled', 'reveal-pending');
    }

    reveal() {
      this.classList.add('revealed');
      this.classList.remove('reveal-pending');
      this.observer?.disconnect();
      this.observer = null;
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      this.observer = null;
      this.motionPreference?.removeEventListener('change', this.onMotionChange);
      this.classList.remove('reveal-enabled', 'reveal-pending');
    }
  });
}
