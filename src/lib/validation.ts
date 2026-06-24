export const MAX_QUERY_LENGTH = 120;

export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

export function isValidQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  return normalized.length >= 2 && normalized.length <= MAX_QUERY_LENGTH;
}
