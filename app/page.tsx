'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StorageService } from '@/lib/storage';
import {
  dummyGroups,
  dummyStudents,
  dummyAttendance,
  buildDummyMonthlyScoreSheets,
} from '@/data/dummyData';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Initialize with dummy data if empty
    const groups = StorageService.getGroups();
    if (groups.length === 0) {
      StorageService.saveGroups(dummyGroups);
      StorageService.saveStudents(dummyStudents);
      StorageService.saveAttendance(dummyAttendance);
      StorageService.saveMonthlyScoreSheets(buildDummyMonthlyScoreSheets());
    }
    
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading Skyline Education Archive...</p>
      </div>
    </div>
  );
}