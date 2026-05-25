import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import fs from 'fs/promises';
import { submissionFilePath } from '@/lib/uploadPaths';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { fileId: string } }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });

  const file = await prisma.submissionFile.findUnique({
    where: { id: params.fileId },
    include: {
      submission: {
        include: {
          assignment: { include: { group: true } },
          student: true,
        },
      },
    },
  });
  if (!file) return NextResponse.json({ ok: false }, { status: 404 });

  const { submission } = file;
  const a = submission.assignment;
  let allowed = false;
  if (s.role === 'ADMIN') allowed = true;
  if (s.role === 'TEACHER' && a.teacherId === s.userId) allowed = true;
  if (s.role === 'STUDENT' && submission.student.userId === s.userId) allowed = true;
  if (s.role === 'PARENT') {
    const ok = await prisma.parentOfStudent.findFirst({
      where: { parentUserId: s.userId, studentId: submission.studentId },
    });
    allowed = !!ok;
  }

  if (!allowed) return NextResponse.json({ ok: false }, { status: 403 });

  try {
    const data = await fs.readFile(submissionFilePath(file.storedName));
    return new NextResponse(data, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}
