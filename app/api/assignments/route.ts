import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });

  const include = {
    group: { select: { id: true, name: true } },
    files: true,
    _count: { select: { submissions: true } },
  } as const;

  if (s.role === 'ADMIN') {
    const rows = await prisma.assignment.findMany({
      orderBy: { createdAt: 'desc' },
      include,
    });
    return NextResponse.json({ ok: true, assignments: rows });
  }

  if (s.role === 'TEACHER') {
    const rows = await prisma.assignment.findMany({
      where: { teacherId: s.userId },
      orderBy: { createdAt: 'desc' },
      include,
    });
    return NextResponse.json({ ok: true, assignments: rows });
  }

  if (s.role === 'STUDENT') {
    const st = await prisma.student.findUnique({ where: { userId: s.userId } });
    if (!st) return NextResponse.json({ ok: true, assignments: [] });
    const rows = await prisma.assignment.findMany({
      where: { groupId: st.groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        ...include,
        submissions: { where: { studentId: st.id }, include: { grade: true, files: true } },
      },
    });
    return NextResponse.json({ ok: true, assignments: rows });
  }

  if (s.role === 'PARENT') {
    const links = await prisma.parentOfStudent.findMany({
      where: { parentUserId: s.userId },
      select: { student: { select: { groupId: true } } },
    });
    const groupIds = [...new Set(links.map((l) => l.student.groupId))];
    if (groupIds.length === 0) return NextResponse.json({ ok: true, assignments: [] });
    const rows = await prisma.assignment.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: { createdAt: 'desc' },
      include,
    });
    return NextResponse.json({ ok: true, assignments: rows });
  }

  return NextResponse.json({ ok: false }, { status: 403 });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== 'TEACHER') return NextResponse.json({ ok: false }, { status: 403 });

  let body: { groupId?: string; title?: string; description?: string; dueAt?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const group = await prisma.group.findFirst({
    where: { id: body.groupId ?? '', teacherId: s.userId },
  });
  if (!group) return NextResponse.json({ ok: false, error: 'group_not_found' }, { status: 400 });

  const dueAt =
    body.dueAt && String(body.dueAt).trim() ? new Date(String(body.dueAt)) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) {
    return NextResponse.json({ ok: false, error: 'bad_due_date' }, { status: 400 });
  }

  const a = await prisma.assignment.create({
    data: {
      groupId: group.id,
      teacherId: s.userId,
      title: String(body.title ?? '').trim() || 'Topshiriq',
      description: String(body.description ?? ''),
      dueAt,
    },
    include: { group: true, files: true },
  });

  return NextResponse.json({ ok: true, assignment: a });
}
