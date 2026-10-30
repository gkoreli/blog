/** Replaced by esbuild. Unbundled/manual clients retain an unknown build. */
declare const __GK_CLIENT_BUILD_ID__: string | undefined;

export function clientBuildId(): string | undefined {
  return typeof __GK_CLIENT_BUILD_ID__ === 'string' ? __GK_CLIENT_BUILD_ID__ : undefined;
}
