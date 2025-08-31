import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log("Demo login API called");
    
    const { email, password } = await request.json();

    if (!email || !password) {
      console.log("Missing email or password");
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 데모 계정인지 확인 (demo.com 도메인)
    if (!email.endsWith('@demo.com')) {
      console.log("Not a demo account:", email);
      return NextResponse.json(
        { error: '데모 계정이 아닙니다.' },
        { status: 400 }
      );
    }

    console.log(`Demo login attempt: ${email}`);
    
    // 데모 사용자 데이터 정의
    const demoUserData: Record<string, any> = {
      'teacher1@demo.com': {
        id: 'demo-teacher-1',
        email: 'teacher1@demo.com',
        name: '교사1',
        role: 'TEACHER',
        password: '123'
      },
      'teacher2@demo.com': {
        id: 'demo-teacher-2',
        email: 'teacher2@demo.com',
        name: '교사2',
        role: 'TEACHER',
        password: '123'
      },
      'student1@demo.com': {
        id: 'demo-student-1',
        email: 'student1@demo.com',
        name: '학생1',
        role: 'STUDENT',
        password: '123'
      },
      'student2@demo.com': {
        id: 'demo-student-2',
        email: 'student2@demo.com',
        name: '학생2',
        role: 'STUDENT',
        password: '123'
      },
      'student3@demo.com': {
        id: 'demo-student-3',
        email: 'student3@demo.com',
        name: '학생3',
        role: 'STUDENT',
        password: '123'
      },
      'student4@demo.com': {
        id: 'demo-student-4',
        email: 'student4@demo.com',
        name: '학생4',
        role: 'STUDENT',
        password: '123'
      },
      'student5@demo.com': {
        id: 'demo-student-5',
        email: 'student5@demo.com',
        name: '학생5',
        role: 'STUDENT',
        password: '123'
      },
      'student6@demo.com': {
        id: 'demo-student-6',
        email: 'student6@demo.com',
        name: '학생6',
        role: 'STUDENT',
        password: '123'
      }
    };
    
    const userData = demoUserData[email as keyof typeof demoUserData];
    if (!userData) {
      console.log("Invalid demo account:", email);
      return NextResponse.json(
        { error: '유효하지 않은 데모 계정입니다.' },
        { status: 400 }
      );
    }
    
    // 비밀번호 확인
    if (password !== userData.password) {
      console.log("Invalid password for demo account:", email);
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }
    
    console.log(`Login successful for ${email}`);

    // 성공적인 로그인 - 쿠키 설정
    const response = NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      }
    });

    // 데모 사용자 정보를 쿠키에 저장
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    
    console.log("Cookie settings - Production:", isProduction, "Vercel:", isVercel);
    
    // Vercel 환경에서는 쿠키 설정을 더 안전하게
    const cookieOptions = {
      path: '/',
      httpOnly: false, // 클라이언트에서 접근 가능하도록
      secure: isProduction || isVercel, // Vercel에서는 HTTPS이므로 true
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7 // 7일
    };
    
    response.cookies.set('demoUser', JSON.stringify({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role
    }), cookieOptions);

    console.log("Cookie set successfully");
    return response;

  } catch (error) {
    console.error('Demo login error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json(
      { 
        error: '로그인 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
