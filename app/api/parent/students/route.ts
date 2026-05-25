import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'PARENT') return NextResponse.json({ ok: false }, { status: 403 });

  const links = await prisma.parentOfStudent.findMany({
    where: { parentUserId: s.userId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          group: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    students: links.map((l) => ({
      id: l.student.id,
      name: `${l.student.lastName} ${l.student.firstName}`,
      groupName: l.student.group.name,
    })),
  });
}
