export function mimeToKind(mime: string): string {
  const m = mime.toLowerCase();
  if (m === 'application/pdf' || m.includes('pdf')) return 'PDF';
  if (m.startsWith('video/')) return 'VIDEO';
  if (m.startsWith('image/')) return 'IMAGE';
  return 'OTHER';
}
