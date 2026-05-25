import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import fs from 'fs/promises';
import { assignmentFilePath } from '@/lib/uploadPaths';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { fileId: string } }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });

  const file = await prisma.assignmentFile.findUnique({
    where: { id: params.fileId },
    include: { assignment: { include: { group: true } } },
  });
  if (!file) return NextResponse.json({ ok: false }, { status: 404 });

  const a = file.assignment;
  let allowed = false;
  if (s.role === 'ADMIN') allowed = true;
  else if (s.role === 'TEACHER' && a.teacherId === s.userId) allowed = true;
  else if (s.role === 'STUDENT') {
    const st = await prisma.student.findUnique({ where: { userId: s.userId } });
    if (st && st.groupId === a.groupId) allowed = true;
  } else if (s.role === 'PARENT') {
    const ok = await prisma.parentOfStudent.findFirst({
      where: { parentUserId: s.userId, student: { groupId: a.groupId } },
    });
    allowed = !!ok;
  }

  if (!allowed) return NextResponse.json({ ok: false }, { status: 403 });

  try {
    const data = await fs.readFile(assignmentFilePath(file.storedName));
    return new NextResponse(data, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'missing_file' }, { status: 404 });
  }
}
