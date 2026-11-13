if ('customElements' in window) {
  customElements.define('blog-reveal', class extends HTMLElement {
    connectedCallback() {
      this.motionPreference = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
      this.onMotionChange = () => {
        if (this.motionPreference.matches) {
          this.reveal();
          this.classList.remove('reveal-enabled');
        }
      };
      this.motionPreference?.addEventListener('change', this.onMotionChange);

      // Only opt into hiding after the enhancement's prerequisites are met.
      if (this.classList.contains('revealed') || !this.motionPreference ||
          this.motionPreference.matches || !('IntersectionObserver' in window) ||
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
