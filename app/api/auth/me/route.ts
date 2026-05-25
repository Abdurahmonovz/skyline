import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, user: s });
}
