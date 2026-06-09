import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes — must be logged in
  const protectedRoutes = ['/dashboard']
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Auth routes — redirect to dashboard if already logged in
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some((route) => pathname === route)

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}