import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { mimeToKind } from '@/lib/mimeKind';
import { ensureUploadDirs, assignmentFilePath } from '@/lib/uploadPaths';

export const runtime = 'nodejs';

async function canTeacherAccessAssignment(userId: string, assignmentId: string) {
  const a = await prisma.assignment.findFirst({
    where: { id: assignmentId, teacherId: userId },
  });
  return !!a;
}

export async function POST(
  req: Request,
  { params }: { params: { assignmentId: string } }
) {
  const s = await getSession();
  if (!s || s.role !== 'TEACHER') return NextResponse.json({ ok: false }, { status: 403 });

  const assignmentId = params.assignmentId;
  if (!(await canTeacherAccessAssignment(s.userId, assignmentId))) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'file_required' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 25 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: 'file_too_large' }, { status: 400 });
  }

  ensureUploadDirs();
  const ext = path.extname(file.name || '') || '';
  const storedName = `${randomUUID()}${ext}`;
  await fs.writeFile(assignmentFilePath(storedName), buf);

  const row = await prisma.assignmentFile.create({
    data: {
      assignmentId,
      filename: file.name || 'fayl',
      storedName,
      mimeType: file.type || 'application/octet-stream',
      kind: mimeToKind(file.type || ''),
      size: buf.length,
    },
  });

  return NextResponse.json({ ok: true, file: row });
}
