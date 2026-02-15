import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    console.log(`[Middleware] Checking Path: ${pathname}`);
    console.log(`[Middleware] Cookies Available:`, request.cookies.getAll().map(c => c.name));

    const adminToken = request.cookies.get('mandes_admin_token')?.value;
    console.log(`[Middleware] Admin Token Value: ${adminToken ? 'FOUND (Length: ' + adminToken.length + ')' : 'MISSING'}`);
  }

  // 1. READ TOKENS
  const adminToken = request.cookies.get('mandes_admin_token')?.value;
  const userToken = request.cookies.get('token')?.value;

  // ============================================================
  // A. ADMIN ZONE
  // ============================================================
  if (pathname.startsWith('/admin-dashboard')) {
    if (!adminToken) {
      console.log("[Middleware] REJECTED: No Admin Token");
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    console.log("[Middleware] ACCEPTED: Admin Token Found"); 
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin/login')) {
    if (adminToken) {
      return NextResponse.redirect(new URL('/admin-dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ============================================================
  // B. USER ZONE
  // ============================================================
  if (pathname === '/login' || pathname === '/register') {
    if (userToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  const protectedUserRoutes = ['/checkout', '/profile', '/account'];
  if (protectedUserRoutes.some(route => pathname.startsWith(route))) {
    if (!userToken) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};