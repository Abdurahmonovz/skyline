import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });

  if (s.role === 'ADMIN') {
    const groups = await prisma.group.findMany({
      orderBy: { name: 'asc' },
      include: { teacher: { select: { id: true, displayName: true, username: true } }, _count: { select: { students: true } } },
    });
    return NextResponse.json({ ok: true, groups });
  }

  if (s.role === 'TEACHER') {
    const groups = await prisma.group.findMany({
      where: { teacherId: s.userId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { students: true } } },
    });
    return NextResponse.json({ ok: true, groups });
  }

  return NextResponse.json({ ok: false }, { status: 403 });
}
