import PortalChrome from '@/components/portal/PortalChrome';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalChrome
      title="O‘quvchi"
      nav={[
        { href: '/student', label: 'Asosiy' },
        { href: '/student/assignments', label: 'Topshiriqlar' },
        { href: '/student/grades', label: 'Baholar' },
      ]}
    >
      {children}
    </PortalChrome>
  );
}
