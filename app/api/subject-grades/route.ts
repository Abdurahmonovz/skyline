import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

async function assertTeacherOwnsStudent(teacherUserId: string, studentId: string) {
  const st = await prisma.student.findUnique({
    where: { id: studentId },
    include: { group: true },
  });
  return st && st.group.teacherId === teacherUserId;
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const qStudentId = url.searchParams.get('studentId');

  if (s.role === 'STUDENT') {
    const st = await prisma.student.findUnique({ where: { userId: s.userId } });
    if (!st) return NextResponse.json({ ok: true, grades: [] });
    const grades = await prisma.subjectGrade.findMany({
      where: { studentId: st.id },
      orderBy: [{ period: 'asc' }, { subject: 'asc' }],
    });
    return NextResponse.json({ ok: true, grades, student: { id: st.id, name: `${st.lastName} ${st.firstName}` } });
  }

  if (s.role === 'PARENT') {
    if (!qStudentId) return NextResponse.json({ ok: false, error: 'studentId_required' }, { status: 400 });
    const ok = await prisma.parentOfStudent.findFirst({
      where: { parentUserId: s.userId, studentId: qStudentId },
    });
    if (!ok) return NextResponse.json({ ok: false }, { status: 403 });
    const st = await prisma.student.findUnique({ where: { id: qStudentId } });
    const grades = await prisma.subjectGrade.findMany({
      where: { studentId: qStudentId },
      orderBy: [{ period: 'asc' }, { subject: 'asc' }],
    });
    return NextResponse.json({
      ok: true,
      grades,
      student: st ? { id: st.id, name: `${st.lastName} ${st.firstName}` } : null,
    });
  }

  if (s.role === 'TEACHER') {
    if (!qStudentId) return NextResponse.json({ ok: false, error: 'studentId_required' }, { status: 400 });
    if (!(await assertTeacherOwnsStudent(s.userId, qStudentId))) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const grades = await prisma.subjectGrade.findMany({
      where: { studentId: qStudentId },
      orderBy: [{ period: 'asc' }, { subject: 'asc' }],
    });
    return NextResponse.json({ ok: true, grades });
  }

  if (s.role === 'ADMIN') {
    const where = qStudentId ? { studentId: qStudentId } : {};
    const grades = await prisma.subjectGrade.findMany({
      where,
      orderBy: [{ studentId: 'asc' }, { period: 'asc' }, { subject: 'asc' }],
      include: { student: { select: { firstName: true, lastName: true, id: true } } },
    });
    return NextResponse.json({ ok: true, grades });
  }

  return NextResponse.json({ ok: false }, { status: 403 });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || (s.role !== 'ADMIN' && s.role !== 'TEACHER')) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let body: {
    studentId?: string;
    subject?: string;
    period?: string;
    score?: number | null;
    maxScore?: number;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const studentId = String(body.studentId ?? '');
  if (!studentId) return NextResponse.json({ ok: false }, { status: 400 });

  if (s.role === 'TEACHER' && !(await assertTeacherOwnsStudent(s.userId, studentId))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const row = await prisma.subjectGrade.upsert({
    where: {
      studentId_subject_period: {
        studentId,
        subject: String(body.subject ?? '').trim() || 'Fan',
        period: String(body.period ?? '').trim() || 'chorak',
      },
    },
    create: {
      studentId,
      subject: String(body.subject ?? '').trim() || 'Fan',
      period: String(body.period ?? '').trim() || 'chorak',
      score: body.score === undefined ? null : Number(body.score),
      maxScore: body.maxScore !== undefined ? Number(body.maxScore) : 100,
      note: String(body.note ?? ''),
    },
    update: {
      score: body.score === undefined ? undefined : Number(body.score),
      maxScore: body.maxScore !== undefined ? Number(body.maxScore) : undefined,
      note: body.note !== undefined ? String(body.note) : undefined,
    },
  });

  return NextResponse.json({ ok: true, grade: row });
}
