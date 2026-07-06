import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  
  // Better Auth stores session in a cookie
  // Note: In production over HTTPS, it might be prefixed with __Secure-
  const sessionCookie = request.cookies.get('better-auth.session_token') || request.cookies.get('__Secure-better-auth.session_token');

  if (!sessionCookie) {
    if (!isAuthPage && request.nextUrl.pathname !== '/') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/create/:path*',
    '/config/:path*',
    '/job/:path*',
    '/login'
  ],
};
