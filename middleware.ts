import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Create a Supabase client using the new SSR package
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          })
        },
      },
    }
  );
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the request is for the auth callback route
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    // Allow the callback to proceed without redirection
    return response;
  }

  // Check if the user is authenticated
  if (!session && !request.nextUrl.pathname.startsWith('/auth')) {
    // Check if there's an ongoing authentication process by looking for auth cookies
    const authCookie = request.cookies.get('sb-auth-token');
    
    // If there's no auth cookie, redirect to login
    if (!authCookie) {
      // Redirect to login page if not authenticated and not already on an auth page
      const redirectUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

// Add the paths that should be protected
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};