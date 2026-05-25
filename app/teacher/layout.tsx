import PortalChrome from '@/components/portal/PortalChrome';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalChrome
      title="O‘qituvchi"
      nav={[
        { href: '/teacher', label: 'Asosiy' },
        { href: '/teacher/assignments', label: 'Topshiriqlar' },
        { href: '/teacher/students', label: "O'quvchilar" },
        { href: '/teacher/grades', label: 'Fan / chorak' },
      ]}
    >
      {children}
    </PortalChrome>
  );
}
