'use client';

import Link from 'next/link';

export default function StudentHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kabinet</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Topshiriqlarni ko‘ring, fayl yuklab bajaring. Fan bo‘yicha baholaringizni alohida sahifada
        ko‘rasiz.
      </p>
      <Link
        href="/student/assignments"
        className="inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Topshiriqlar
      </Link>
    </div>
  );
}
