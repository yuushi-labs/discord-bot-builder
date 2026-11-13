/**
 * Reduce a Discord bot token to a short, non-reversible preview for display.
 * The full token is never returned to the client except through the explicit
 * export endpoint; a masked value cannot be used to authenticate.
 */
export function maskToken(token: string | null | undefined): string {
  if (!token) return "";
  if (token.length <= 8) return "*".repeat(token.length);
  return `${token.slice(0, 4)}${"*".repeat(12)}${token.slice(-4)}`;
}
