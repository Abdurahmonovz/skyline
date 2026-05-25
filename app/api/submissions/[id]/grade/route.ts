import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const s = await getSession();
  if (!s || s.role !== 'TEACHER') return NextResponse.json({ ok: false }, { status: 403 });

  let body: { score?: number | null; teacherComment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { assignment: true },
  });
  if (!submission || submission.assignment.teacherId !== s.userId) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const score =
    body.score === null || body.score === undefined ? null : Math.round(Number(body.score));
  if (score !== null && (Number.isNaN(score) || score < 0 || score > 100)) {
    return NextResponse.json({ ok: false, error: 'bad_score' }, { status: 400 });
  }

  const grade = await prisma.submissionGrade.upsert({
    where: { submissionId: submission.id },
    create: {
      submissionId: submission.id,
      score,
      teacherComment: String(body.teacherComment ?? ''),
      gradedById: s.userId,
    },
    update: {
      score,
      teacherComment: String(body.teacherComment ?? ''),
      gradedAt: new Date(),
      gradedById: s.userId,
    },
  });

  return NextResponse.json({ ok: true, grade });
}
