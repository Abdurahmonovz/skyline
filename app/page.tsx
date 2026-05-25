import { redirect } from 'next/navigation';

/** Autentifikatsiya middleware orqali; bu yerda doim bosh panelga. */
export default function HomePage() {
  redirect('/dashboard');
}
