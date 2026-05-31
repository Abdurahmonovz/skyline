import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE, getAuthSecret } from '@/lib/authConstants';
import { isRole, type Role } from '@/lib/roles';

export type SessionUser = {
  userId: string;
  role: Role;
  name: string;
};

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = String(payload.sub ?? '');
    let rawRole = String(payload.role ?? '');
    const name = String(payload.name ?? 'Admin');
    if (!userId) return null;
    // Eski login tokenlarida role bo‘lmagan — middleware o‘tkazardi, API esa rad etardi
    if (!isRole(rawRole) && userId === 'skyline-admin') {
      rawRole = 'ADMIN';
    }
    if (!isRole(rawRole)) return null;
    return { userId, role: rawRole, name: name || 'Admin' };
  } catch {
    return null;
  }
}

export function unauthorizedJson() {
  return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

export function forbiddenJson() {
  return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
}
