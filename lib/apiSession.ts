import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/** Telegram marshrutlarida middleware redirect bo‘lmasin — sessiya shu yerda tekshiriladi */
export async function rejectWithoutSession(): Promise<NextResponse | null> {
  const s = await getSession();
  if (!s) {
    return NextResponse.json({ ok: false, description: 'Sessiya yoq.' }, { status: 401 });
  }
  return null;
}

export async function rejectUnlessRoles(
  allowed: import('@/lib/roles').Role[]
): Promise<NextResponse | null> {
  const s = await getSession();
  if (!s) {
    return NextResponse.json({ ok: false, description: 'Sessiya yoq.' }, { status: 401 });
  }
  if (!allowed.includes(s.role)) {
    return NextResponse.json({ ok: false, description: 'Ruxsat yoq.' }, { status: 403 });
  }
  return null;
}
