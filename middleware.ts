import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/dashboard/:path*'];
const publicRoutes = ['/login', '/'];

export function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get('shelfwatch_token')?.value || null;
  
  const { pathname } = request.nextUrl;
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route.replace('*', ''))
  );
  
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // For demo purposes, allow access with any token that exists
  // In production, you'd verify the token properly here
  
  if (isProtectedRoute && !token) {
    // Redirect to login
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  
  if (isPublicRoute && token && pathname === '/login') {
    // Already logged in, redirect to dashboard
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/'],
};