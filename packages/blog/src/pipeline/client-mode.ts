/** Standard NODE_ENV guards retain dev diagnostics and remove them in production. */
export function clientDefines(
  production: boolean,
  environment: Readonly<Record<string, string | undefined>> = {},
): Record<string, string> {
  let buildId: string | undefined;
  if (production && environment.WORKERS_CI === '1') {
    const uuid = environment.WORKERS_CI_BUILD_UUID;
    const commit = environment.WORKERS_CI_COMMIT_SHA;
    if (!uuid || uuid.length !== 36 || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(uuid)
      || !commit || commit.length !== 40 || !/^[a-f0-9]{40}$/i.test(commit)) {
      throw new Error('Workers client build metadata is missing or invalid');
    }
    // Exactly 80 characters; identifies the client build, not its current server.
    buildId = `cf:${uuid.toLowerCase()}:${commit.toLowerCase()}`;
  }
  return {
    'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
    '__GK_CLIENT_BUILD_ID__': buildId === undefined ? 'undefined' : JSON.stringify(buildId),
  };
}
