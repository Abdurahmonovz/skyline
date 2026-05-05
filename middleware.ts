import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE, getAuthSecret } from '@/lib/authConstants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  /** POST redirect sessiyada fetch ni buzishi mumkin — sessiyani route ichida tekshiramiz */
  if (pathname.startsWith('/api/telegram/')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/login')) {
    const existing = request.cookies.get(AUTH_COOKIE)?.value;
    if (existing) {
      try {
        await jwtVerify(existing, getAuthSecret());
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        /* sessiya eskirgan */
      }
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, getAuthSecret());
    return NextResponse.next();
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const res = NextResponse.redirect(url);
    res.cookies.set(AUTH_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|txt|json|xml|webmanifest)$).*)',
  ],
};
