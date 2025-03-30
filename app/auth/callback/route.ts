import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
    
    // Make sure the session is established before redirecting
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      // Session is established, redirect to home page
      return NextResponse.redirect(new URL('/?upload=true', requestUrl.origin));
    }
  }

  // URL to redirect to after sign in process completes or if no code/session
  return NextResponse.redirect(new URL('/?upload=true', requestUrl.origin));
}