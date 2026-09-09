// Loaded before the official CLI during export-only verification.
// No network is needed to reopen a local evaluation database.
globalThis.fetch = async () => { throw new Error('Offline CLI export blocked outbound fetch'); };
