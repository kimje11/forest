import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log("Logout API called");
    
    // 데모 계정 확인
    const demoUserCookie = request.cookies.get('demoUser')?.value;
    
    if (demoUserCookie) {
      console.log("Demo user logout");
      // 데모 계정 로그아웃 - 쿠키 삭제
      const response = NextResponse.json(
        { message: "데모 계정 로그아웃되었습니다." },
        { status: 200 }
      );
      
      // 쿠키 삭제 (모든 브라우저에서 확실히 삭제되도록)
      response.cookies.set('demoUser', '', {
        path: '/',
        expires: new Date(0),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      return response;
    }
    
    // 일반 Supabase 계정 로그아웃
    console.log("Supabase user logout");
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
            })
          },
        },
      }
    )
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error("Supabase logout error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    const response = NextResponse.json(
      { message: "로그아웃되었습니다." },
      { status: 200 }
    );
    
    // Supabase 관련 쿠키들도 명시적으로 삭제
    const supabaseCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token'
    ];
    
    supabaseCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        path: '/',
        expires: new Date(0),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "로그아웃 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}