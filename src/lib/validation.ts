export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

export function isValidSingaporePostalCode(postalCode: string): boolean {
  return /^\d{6}$/.test(postalCode.trim());
}

export function normalizePostalCode(postalCode: string): string {
  return postalCode.trim();
}
