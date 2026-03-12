import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Redirect unauthenticated users to login
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user?.role

  // Admin-only routes
  if (pathname.startsWith('/admin')) {
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/schedules', req.url))
    }
  }

  // ADMIN and REGISTER only
  if (pathname.startsWith('/history')) {
    if (role !== 'ADMIN' && role !== 'REGISTER') {
      return NextResponse.redirect(new URL('/schedules', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/schedules/:path*', '/history/:path*', '/admin/:path*'],
}
