import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple JWT decode function (without verification for middleware)
// Note: This is just for reading the payload. Actual verification should be done server-side
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || '';
  const isLoginPage = request.nextUrl.pathname === '/';
  const isPublicPath = isLoginPage || request.nextUrl.pathname.startsWith('/q'); // Include questionnaire routes as public

  // If no token and trying to access protected routes, redirect to login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If token exists, validate it
  if (token) {
    // Check if token is expired
    if (isTokenExpired(token)) {
      // Token is expired, clear it and redirect to login
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('token');
      response.cookies.delete('systemRole');
      return response;
    }

    const decoded = decodeJWT(token);
    
    // If user is on login page with valid token, redirect based on role from JWT
    if (isLoginPage) {
      if (decoded && decoded.systemRole) {
        if (decoded.systemRole === 'ORG_USER') {
          return NextResponse.redirect(new URL('/app/projects', request.url));
        } else if (decoded.systemRole === 'SUPER_USER') {
          return NextResponse.redirect(new URL('/admin/organisations', request.url));
        }
      }
      
      // Fallback: default to app/projects for all users
      return NextResponse.redirect(new URL('/app/projects', request.url));
    }

    // Additional route protection based on user role
    if (decoded && decoded.systemRole) {
      const pathname = request.nextUrl.pathname;
      const userRole = decoded.systemRole;

      // ORG_USER trying to access admin routes
      if (userRole === 'ORG_USER' && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/app/projects', request.url));
      }

      // Additional role-based protections can be added here
      // For example, specific admin-only routes for SUPER_USER
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/app/:path*'],
};