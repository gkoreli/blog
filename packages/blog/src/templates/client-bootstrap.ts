/** Runs before external scripts, so a missing main bundle can still report its own load failure.
 * Closed stage names, no resource URL/exception text, at most three reports per page.
 */
export function clientBootstrap(buildIdLiteral: string): string {
  return `(() => {
  window.gkTurnstileScriptState = 'loading';
  window.gkTurnstileReady = () => {
    window.gkTurnstileScriptState = 'ready';
    window.dispatchEvent(new Event('gk-turnstile-ready'));
  };
  const seen = new Set();
  function report(stage) {
    if (seen.has(stage) || seen.size >= 3) return;
    seen.add(stage);
    if (stage === 'client_entry_script_load_error') {
      const message = document.querySelector('#sub-form .subscribe-msg');
      if (message) message.textContent = 'Subscriptions could not load. Please refresh the page and try again.';
    }
    const event = {type:'interaction_error', component:'client_bootstrap', message:stage,
      path:location.pathname, occurredAt:new Date().toISOString(), buildId:${buildIdLiteral}};
    try {
      fetch('/api/client-error', {method:'POST', headers:{'content-type':'application/json'},
        body:JSON.stringify(event), keepalive:true, redirect:'error'})
        .then(response => { if (response.status !== 204) console.warn('[client:bootstrap-delivery]', {outcome:'unconfirmed'}); })
        .catch(() => console.warn('[client:bootstrap-delivery]', {outcome:'unconfirmed'}));
    } catch {}
  }
  function resource(value) {
    try {
      const url = new URL(value, location.origin);
      if (url.origin === 'https://challenges.cloudflare.com') return 'turnstile';
      if (url.origin === location.origin && url.pathname === '/main.js') return 'client_entry';
    } catch {}
    return null;
  }
  window.addEventListener('error', event => {
    if (!event.target || event.target.tagName !== 'SCRIPT') return;
    const kind = resource(event.target.src);
    if (kind === 'turnstile') window.gkTurnstileScriptState = 'failed';
    if (kind) report(kind + '_script_load_error');
  }, true);
  document.addEventListener('securitypolicyviolation', event => {
    if (event.disposition === 'enforce' && resource(event.blockedURI) === 'turnstile'
      && ['script-src', 'script-src-elem', 'frame-src', 'connect-src'].includes(event.effectiveDirective)) {
      report('turnstile_csp_blocked');
    }
  });
})();`;
}
