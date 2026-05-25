import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { assignmentId: string } }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: {
      group: true,
      files: true,
      submissions: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          files: true,
          grade: true,
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });
  if (!assignment) return NextResponse.json({ ok: false }, { status: 404 });

  if (s.role === 'ADMIN') {
    return NextResponse.json({ ok: true, assignment });
  }
  if (s.role === 'TEACHER' && assignment.teacherId === s.userId) {
    return NextResponse.json({ ok: true, assignment });
  }
  if (s.role === 'STUDENT') {
    const st = await prisma.student.findUnique({ where: { userId: s.userId } });
    if (!st || st.groupId !== assignment.groupId) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const mine = assignment.submissions.filter((x) => x.studentId === st.id);
    return NextResponse.json({
      ok: true,
      assignment: { ...assignment, submissions: mine },
    });
  }
  if (s.role === 'PARENT') {
    const ok = await prisma.parentOfStudent.findFirst({
      where: { parentUserId: s.userId, student: { groupId: assignment.groupId } },
    });
    if (!ok) return NextResponse.json({ ok: false }, { status: 403 });
    /** Ota-ona topshiriq matnini ko‘radi, baholarni farzand orqali alohida sahifada */
    return NextResponse.json({
      ok: true,
      assignment: {
        ...assignment,
        submissions: [],
      },
    });
  }

  return NextResponse.json({ ok: false }, { status: 403 });
}
