import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const publicPaths = ['/', '/landing', '/register', '/onboarding', '/login', '/auth']
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith('/auth')) || pathname.startsWith('/api/cron') || pathname.startsWith('/api/top-gainers') || pathname.startsWith('/api/trade-tracker')

  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        }
    }}
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/landing', request.url))
  }
  if (user && (pathname === '/' || pathname === '/landing')) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)']
}
