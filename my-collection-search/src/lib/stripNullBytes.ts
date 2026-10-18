/**
 * Postgres text columns reject U+0000 outright (error 22021), failing the
 * whole statement. Strip it from untrusted strings, e.g. LLM output, before
 * they reach a query.
 */
export function stripNullBytes(value: string): string {
  return value.replace(/\u0000/g, "");
}
