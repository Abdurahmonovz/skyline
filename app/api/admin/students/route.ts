import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return NextResponse.json({ ok: false }, { status: 403 });

  const students = await prisma.student.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: { group: { select: { name: true } } },
  });
  return NextResponse.json({ ok: true, students });
}
