/** HTTP-only cookie nomi (login sessiyasi). */
export const AUTH_COOKIE = 'skyline_session';

export const DEFAULT_AUTH_USER = 'admin_skyline';
export const DEFAULT_AUTH_PASSWORD = 'admin123';

export function getAuthSecret(): Uint8Array {
  const s =
    process.env.AUTH_SECRET ||
    'skyline-auth-dev-only-set-AUTH_SECRET-in-env-min-32-chars';
  return new TextEncoder().encode(s);
}

export function getExpectedCredentials(): { user: string; pass: string } {
  return {
    user: process.env.SKYLINE_AUTH_USER || DEFAULT_AUTH_USER,
    pass: process.env.SKYLINE_AUTH_PASSWORD || DEFAULT_AUTH_PASSWORD,
  };
}
