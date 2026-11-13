# Fixture project agreements

Use dependency-free HTML, CSS and JavaScript with progressive enhancement. Keep the existing IDs, destinations and integration callbacks stable. Prefer readable, scoped changes and preserve working behavior. Do not add packages or contact outside services. Browser policy: Baseline 2024; newer APIs need feature detection and a usable fallback. Do not weaken the requested interaction or compatibility behavior to use a newer API. Work only in this project; do not inspect other projects or runs. Do not commit changes. Verify what you can with the provided tools and report any checks that could not run.

The final behavior grader runs separately. Use node --check app.js and any useful self-checks. A generic node verify.mjs smoke check is available; if browser startup is blocked, report that limitation and continue with the available checks rather than seeking broader permissions.
