import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE, getAuthSecret } from '@/lib/authConstants';

/** Telegram API marshrutlarida middleware redirect bo‘lmasin — sessiya shu yerda tekshiriladi */
export async function rejectWithoutSession(): Promise<NextResponse | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ ok: false, description: 'Sessiya yoq.' }, { status: 401 });
  }
  try {
    await jwtVerify(token, getAuthSecret());
    return null;
  } catch {
    return NextResponse.json({ ok: false, description: 'Sessiya eskirgan.' }, { status: 401 });
  }
}
