import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { mimeToKind } from '@/lib/mimeKind';
import { ensureUploadDirs, submissionFilePath } from '@/lib/uploadPaths';

export const runtime = 'nodejs';

export async function POST(
  req: Request,
  { params }: { params: { assignmentId: string } }
) {
  const s = await getSession();
  if (!s || s.role !== 'STUDENT') return NextResponse.json({ ok: false }, { status: 403 });

  const st = await prisma.student.findUnique({ where: { userId: s.userId } });
  if (!st) return NextResponse.json({ ok: false, error: 'no_student' }, { status: 400 });

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
  });
  if (!assignment || assignment.groupId !== st.groupId) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get('file');
  const comment = String(form.get('comment') ?? '');

  ensureUploadDirs();

  const sub = await prisma.submission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: st.id,
      },
    },
    create: {
      assignmentId: assignment.id,
      studentId: st.id,
      comment,
    },
    update: {
      comment,
      submittedAt: new Date(),
    },
    include: { files: true },
  });

  if (file instanceof File) {
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > 25 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'file_too_large' }, { status: 400 });
    }
    const ext = path.extname(file.name || '') || '';
    const storedName = `${randomUUID()}${ext}`;
    await fs.writeFile(submissionFilePath(storedName), buf);
    await prisma.submissionFile.create({
      data: {
        submissionId: sub.id,
        filename: file.name || 'javob',
        storedName,
        mimeType: file.type || 'application/octet-stream',
        size: buf.length,
      },
    });
  }

  const full = await prisma.submission.findUnique({
    where: { id: sub.id },
    include: { files: true, grade: true },
  });

  return NextResponse.json({ ok: true, submission: full });
}
