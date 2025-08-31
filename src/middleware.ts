import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const { pathname } = request.nextUrl

  // 세션과 사용자 정보 모두 확인 (implicit flow 사용)
  let session = null
  let user = null
  
  try {
    const sessionResult = await supabase.auth.getSession()
    session = sessionResult.data.session
    
    const userResult = await supabase.auth.getUser()
    user = userResult.data.user
    
    // AuthSessionMissingError는 정상적인 상황이므로 무시
    // API 경로가 아닌 경우에만 로그 출력
    if (!pathname.startsWith('/api/')) {
      if (sessionResult.error && sessionResult.error.name === 'AuthSessionMissingError') {
        console.log(`No session found in middleware for ${pathname} (normal for unauthenticated users)`)
      } else if (sessionResult.error) {
        console.error("Session error in middleware:", sessionResult.error)
      }
      
      if (userResult.error && userResult.error.name === 'AuthSessionMissingError') {
        console.log(`No user found in middleware for ${pathname} (normal for unauthenticated users)`)
      } else if (userResult.error) {
        console.error("User error in middleware:", userResult.error)
      }
    }
  } catch (error) {
    // API 경로가 아닌 경우에만 로그 출력
    if (!pathname.startsWith('/api/')) {
      console.error("Middleware auth error:", error)
      // AuthSessionMissingError는 정상적인 상황이므로 무시
      if (error instanceof Error && error.name === 'AuthSessionMissingError') {
        console.log(`No session/user found in middleware for ${pathname} (normal for unauthenticated users)`)
      }
    }
  }

  // 세션이 있지만 사용자 정보가 없는 경우 로그만 출력
  if (session && !user) {
    console.log("Session exists but no user found in middleware")
  }

  // 데모 계정 세션 확인 (localStorage는 서버에서 접근 불가하므로 쿠키나 헤더 확인)
  const demoUserCookie = request.cookies.get('demoUser')?.value
  let demoUser = null
  if (demoUserCookie) {
    try {
      demoUser = JSON.parse(demoUserCookie)
    } catch (e) {
      // 쿠키 파싱 실패 시 무시
    }
  }

  // 보호된 경로들
  const protectedPaths = {
    teacher: ['/teacher'],
    student: ['/student'], 
    admin: ['/admin'],
    auth: ['/auth/login', '/auth/register']
  }

  // 인증이 필요한 경로인지 확인
  const isProtectedPath = Object.values(protectedPaths).flat().some(path => 
    pathname.startsWith(path) && path !== '/auth/login' && path !== '/auth/register'
  )

  // 로그인/회원가입 페이지인지 확인
  const isAuthPath = protectedPaths.auth.some(path => pathname.startsWith(path))

  if (!user && !demoUser && isProtectedPath) {
    // 인증되지 않은 사용자가 보호된 경로에 접근하려고 할 때
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if ((user || demoUser) && isAuthPath) {
    // 이미 로그인된 사용자가 로그인/회원가입 페이지에 접근하려고 할 때
    const userRole = user?.user_metadata?.role || user?.app_metadata?.role || demoUser?.role

    const url = request.nextUrl.clone()
    if (userRole === 'TEACHER') {
      url.pathname = '/teacher/dashboard'
    } else if (userRole === 'STUDENT') {
      url.pathname = '/student/dashboard'
    } else if (userRole === 'ADMIN') {
      url.pathname = '/admin/dashboard'
    } else {
      url.pathname = '/auth/login'
    }
    return NextResponse.redirect(url)
  }

  // 역할 기반 접근 제어
  if ((user || demoUser) && isProtectedPath) {
    const userRole = user?.user_metadata?.role || user?.app_metadata?.role || demoUser?.role

    if (pathname.startsWith('/teacher') && userRole !== 'TEACHER') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('message', '접근 권한이 없습니다.')
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/student') && userRole !== 'STUDENT') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('message', '접근 권한이 없습니다.')
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('message', '접근 권한이 없습니다.')
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
