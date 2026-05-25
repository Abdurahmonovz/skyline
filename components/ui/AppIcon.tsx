'use client';

import { motion, type Transition } from 'framer-motion';
import { ICON_PATHS, type IconName } from '@/lib/iconPaths';

export type IconAnimation = 'none' | 'hover' | 'pulse' | 'spin' | 'bounce' | 'float' | 'wiggle';

const SIZE = { sm: 16, md: 20, lg: 24, xl: 32 } as const;

type AppIconProps = {
  name: IconName;
  size?: keyof typeof SIZE;
  className?: string;
  strokeWidth?: number;
  animation?: IconAnimation;
  /** Yumshoq fonli doira */
  variant?: 'plain' | 'soft' | 'gradient';
  active?: boolean;
  label?: string;
};

const animMap: Record<IconAnimation, object> = {
  none: {},
  hover: {
    whileHover: { scale: 1.12, rotate: 4 },
    whileTap: { scale: 0.92 },
    transition: { type: 'spring', stiffness: 400, damping: 17 } as Transition,
  },
  pulse: {
    animate: { scale: [1, 1.08, 1] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  spin: {
    animate: { rotate: 360 },
    transition: { duration: 8, repeat: Infinity, ease: 'linear' },
  },
  bounce: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 380, damping: 18 },
  },
  float: {
    animate: { y: [0, -4, 0] },
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
  wiggle: {
    whileHover: { rotate: [0, -8, 8, -4, 0] },
    transition: { duration: 0.45 },
  },
};

export default function AppIcon({
  name,
  size = 'md',
  className = '',
  strokeWidth = 2,
  animation = 'hover',
  variant = 'plain',
  active = false,
  label,
}: AppIconProps) {
  const px = SIZE[size];
  const paths = ICON_PATHS[name];
  const motionProps = animation === 'none' ? {} : animMap[animation];
  const spinWhenActive = active && name === 'settings' ? animMap.spin : {};

  const svg = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );

  const inner = (
    <motion.span
      className="inline-flex shrink-0 items-center justify-center"
      {...motionProps}
      {...spinWhenActive}
    >
      {svg}
    </motion.span>
  );

  if (variant === 'plain') return inner;

  const shell =
    variant === 'gradient'
      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25'
      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400';

  return (
    <motion.span
      className={`inline-flex items-center justify-center rounded-xl p-2.5 ${shell} ${
        active ? 'ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''
      }`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {inner}
    </motion.span>
  );
}
