export const MAX_QUERY_LENGTH = 120;

export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

export function isValidQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  return normalized.length >= 2 && normalized.length <= MAX_QUERY_LENGTH;
}

export function isValidSingaporePostalCode(postalCode: string): boolean {
  return /^\d{6}$/.test(postalCode.trim());
}

export function normalizePostalCode(postalCode: string): string {
  return postalCode.trim();
}
