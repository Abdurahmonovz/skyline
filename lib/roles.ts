export const ROLES = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as const;
export type Role = (typeof ROLES)[number];

export function isRole(s: string): s is Role {
  return (ROLES as readonly string[]).includes(s);
}

export const PAYMENT_STATUSES = ['PAID', 'DEBT', 'PARTIAL'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function homePathForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard';
    case 'TEACHER':
      return '/teacher';
    case 'STUDENT':
      return '/student';
    case 'PARENT':
      return '/parent';
    default:
      return '/login';
  }
}
