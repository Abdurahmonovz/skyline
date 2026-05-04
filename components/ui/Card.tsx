'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-2xl shadow-lg
        border border-gray-200 dark:border-gray-700
        transition-all duration-300
        ${hover ? 'hover:shadow-xl hover:scale-[1.02] hover:border-emerald-300 dark:hover:border-emerald-700' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}