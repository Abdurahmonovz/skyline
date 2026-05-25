import PortalChrome from '@/components/portal/PortalChrome';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalChrome
      title="Ota-ona"
      nav={[
        { href: '/parent', label: 'Farzandlar' },
        { href: '/parent/grades', label: 'Baholar' },
      ]}
    >
      {children}
    </PortalChrome>
  );
}
