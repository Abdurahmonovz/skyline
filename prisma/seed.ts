import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

async function main() {
  const pass = await hashPassword('admin123');

  const admin = await prisma.user.upsert({
    where: { username: 'admin_skyline' },
    update: { passwordHash: pass },
    create: {
      username: 'admin_skyline',
      passwordHash: pass,
      role: 'ADMIN',
      displayName: 'Bosh administrator',
      email: 'admin@example.local',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { username: 'teacher1' },
    update: { passwordHash: pass },
    create: {
      username: 'teacher1',
      passwordHash: pass,
      role: 'TEACHER',
      displayName: "O'qituvchi (demo)",
      phone: '+998901112233',
    },
  });

  const group = await prisma.group.upsert({
    where: { id: 'seed-group-1' },
    update: { teacherId: teacher.id },
    create: {
      id: 'seed-group-1',
      name: 'Demo guruh 9-A',
      direction: 'IT',
      teacherId: teacher.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { username: 'student1' },
    update: { passwordHash: pass },
    create: {
      username: 'student1',
      passwordHash: pass,
      role: 'STUDENT',
      displayName: 'Demo o‘quvchi',
    },
  });

  const student = await prisma.student.upsert({
    where: { id: 'seed-student-1' },
    update: { userId: studentUser.id, groupId: group.id },
    create: {
      id: 'seed-student-1',
      groupId: group.id,
      firstName: 'Ali',
      lastName: 'Karimov',
      phone: '+998901112200',
      userId: studentUser.id,
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { username: 'parent1' },
    update: { passwordHash: pass },
    create: {
      username: 'parent1',
      passwordHash: pass,
      role: 'PARENT',
      displayName: 'Ota-ona (demo)',
      email: 'parent@example.local',
    },
  });

  await prisma.parentOfStudent.upsert({
    where: {
      studentId_parentUserId: {
        studentId: student.id,
        parentUserId: parentUser.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      parentUserId: parentUser.id,
    },
  });

  await prisma.subjectGrade.upsert({
    where: {
      studentId_subject_period: {
        studentId: student.id,
        subject: 'Matematika',
        period: '2026-Q1',
      },
    },
    update: { score: 4.5, maxScore: 5 },
    create: {
      studentId: student.id,
      subject: 'Matematika',
      period: '2026-Q1',
      score: 4.5,
      maxScore: 5,
      note: 'Chorak',
    },
  });

  await prisma.payment.upsert({
    where: { id: 'seed-payment-1' },
    update: {},
    create: {
      id: 'seed-payment-1',
      studentId: student.id,
      amountCents: 5_000_000,
      paidAmountCents: 2_500_000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PARTIAL',
      note: 'Demo to‘lov',
    },
  });

  const assign = await prisma.assignment.upsert({
    where: { id: 'seed-assignment-1' },
    update: {},
    create: {
      id: 'seed-assignment-1',
      groupId: group.id,
      teacherId: teacher.id,
      title: 'Demo topshiriq',
      description: 'PDF yoki rasm yuklang.',
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seed OK:', { admin: admin.username, teacher: teacher.username, student: studentUser.username, parent: parentUser.username, assignment: assign.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
