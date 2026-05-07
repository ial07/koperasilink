import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if trying to access dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Next.js middleware runs on edge, so we can't easily read Zustand state.
    // But we can check if token cookie exists or we rely on client-side protection.
    // Wait, the token is stored in localStorage by default, not cookies!
    // We can't check localStorage in middleware.
    // Let's pass for now and rely on a client-side layout protection.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
