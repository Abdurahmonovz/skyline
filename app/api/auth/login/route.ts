import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import {
  AUTH_COOKIE,
  getAuthSecret,
  getExpectedCredentials,
} from '@/lib/authConstants';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const { user, pass } = getExpectedCredentials();
  if (body.username !== user || body.password !== pass) {
    return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
  }

  const secret = getAuthSecret();
  const token = await new SignJWT({
    sub: 'skyline-admin',
    role: 'ADMIN',
    name: 'Admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
