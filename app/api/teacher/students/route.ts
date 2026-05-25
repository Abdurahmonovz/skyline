import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'TEACHER') return NextResponse.json({ ok: false }, { status: 403 });

  const groups = await prisma.group.findMany({
    where: { teacherId: s.userId },
    select: { id: true },
  });
  const ids = groups.map((g) => g.id);
  if (ids.length === 0) return NextResponse.json({ ok: true, students: [] });

  const students = await prisma.student.findMany({
    where: { groupId: { in: ids } },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: { group: { select: { name: true } } },
  });
  return NextResponse.json({ ok: true, students });
}
