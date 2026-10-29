/** Trusted SQL expressions and flat identifier keys only; never request input.
 * D1 documents at most 32 arguments per SQL function. json_set adds at most
 * fifteen pairs after its document argument and preserves explicit SQL NULLs.
 * json_patch would instead delete null-valued fields on an empty aggregate.
 */
export function boundedJsonObjectSql(fields: Readonly<Record<string, string>>): string {
  const entries = Object.entries(fields);
  for (const [key] of entries) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new Error('SQL JSON fields require flat identifier keys');
    }
  }
  let result = `json_object(${entries.slice(0, 16).map(([key, value]) => `'${key}', ${value}`).join(',\n')})`;
  for (let start = 16; start < entries.length; start += 15) {
    const additions = entries.slice(start, start + 15)
      .map(([key, value]) => `'$.${key}', ${value}`).join(',\n');
    result = `json_set(${result}, ${additions})`;
  }
  return result;
}
