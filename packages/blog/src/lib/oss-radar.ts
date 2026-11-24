/** Read the published issue identity and preserve its display padding. */
export function ossRadarIssueNumber(slug: string): string | undefined {
  return /^oss-radar-([0-9]+)(?:-|$)/u.exec(slug)?.[1];
}
