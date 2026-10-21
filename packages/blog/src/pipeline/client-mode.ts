/** Nisli probes the import.meta.env object before its buildless dev fallback. */
export function clientDefines(production: boolean): Record<string, string> {
  return {
    'import.meta.env': JSON.stringify({ DEV: !production, PROD: production }),
  };
}
