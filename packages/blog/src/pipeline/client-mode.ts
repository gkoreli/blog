/** Standard NODE_ENV guards retain dev diagnostics and remove them in production. */
export function clientDefines(production: boolean): Record<string, string> {
  return {
    'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
  };
}
