import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. READ TOKENS
  const adminToken = request.cookies.get('mandes_admin_token')?.value;
  const userToken = request.cookies.get('token')?.value;

  // Logging untuk Debugging (Hanya muncul di log Docker Frontend)
  if (pathname.startsWith('/admin') || pathname.startsWith('/cart') || pathname.startsWith('/checkout')) {
    console.log(`--- [Middleware Check] ---`);
    console.log(`Path: ${pathname}`);
    console.log(`Cookies:`, request.cookies.getAll().map(c => c.name));
    console.log(`Admin Token: ${adminToken ? 'VALID' : 'MISSING'}`);
    console.log(`User Token: ${userToken ? 'VALID' : 'MISSING'}`);
  }

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
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin/login')) {
    if (adminToken) {
      return NextResponse.redirect(new URL('/admin-dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ============================================================
  // B. USER ZONE (CUSTOMER)
  // ============================================================
  
  // Redirect jika sudah login tapi akses halaman login/register
  if (pathname === '/login' || pathname === '/register') {
    if (userToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Proteksi rute yang membutuhkan login user
  // ✅ TAMBAHKAN '/cart' ke dalam daftar rute terproteksi
  const protectedUserRoutes = ['/checkout', '/profile', '/account', '/cart'];
  
  if (protectedUserRoutes.some(route => pathname.startsWith(route))) {
    if (!userToken) {
      console.log(`[Middleware] USER REJECTED: No User Token for ${pathname}`);
      // Jika request berasal dari fetch (API), jangan redirect, biarkan fetch menangkap 401
      if (request.headers.get('accept')?.includes('application/json')) {
        return NextResponse.next(); 
      }
      
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // ✅ Pastikan matcher tidak memblokir /api/proxy agar cookie bisa lewat
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};