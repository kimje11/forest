import { createRouteHandlerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 데모 계정 확인
    const demoUserCookie = request.cookies.get('demoUser')?.value;
    
    if (demoUserCookie) {
      // 데모 계정 로그아웃 - 쿠키 삭제
      const response = NextResponse.json(
        { message: "데모 계정 로그아웃되었습니다." },
        { status: 200 }
      );
      
      // 쿠키 삭제
      response.cookies.set('demoUser', '', {
        path: '/',
        expires: new Date(0)
      });
      
      return response;
    }
    
    // 일반 Supabase 계정 로그아웃
    const supabase = createRouteHandlerClient(request)
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "로그아웃되었습니다." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "로그아웃 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}