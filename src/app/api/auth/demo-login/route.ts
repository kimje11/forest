import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("Demo login API called");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log("VERCEL:", process.env.VERCEL);
    console.log("VERCEL_ENV:", process.env.VERCEL_ENV);
    
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
    
    // 먼저 쿠키에서 업데이트된 사용자 정보 확인
    const demoUserCookie = request.cookies.get('demoUser')?.value;
    let user = null;
    
    if (demoUserCookie) {
      try {
        const demoUser = JSON.parse(demoUserCookie);
        if (demoUser.email === email) {
          user = demoUser;
          console.log(`Using updated demo user from cookie: ${user.name}`);
        }
      } catch (e) {
        console.log('Failed to parse demo user cookie');
      }
    }
    
    // 쿠키에 없으면 데이터베이스에서 데모 사용자 찾기
    if (!user) {
      try {
        console.log("Attempting to find user in database...");
        user = await prisma.user.findUnique({
          where: { email }
        });
        console.log("Database query result:", user ? "User found" : "User not found");
      } catch (dbError) {
        console.error("Database error:", dbError);
        // 데이터베이스 연결 실패 시 하드코딩된 데모 사용자 사용
        console.log("Using fallback demo users due to database error");
        const fallbackUsers = {
          'math@demo.com': {
            id: 'demo-teacher-math',
            email: 'math@demo.com',
            name: '김수학',
            role: 'TEACHER',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // 'password'의 해시
          },
          'chemistry@demo.com': {
            id: 'demo-teacher-chemistry',
            email: 'chemistry@demo.com',
            name: '이화학',
            role: 'TEACHER',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
          },
          'physics@demo.com': {
            id: 'demo-teacher-physics',
            email: 'physics@demo.com',
            name: '박물리',
            role: 'TEACHER',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
          },
          'student1@demo.com': {
            id: 'demo-student-1',
            email: 'student1@demo.com',
            name: '학생1',
            role: 'STUDENT',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
          },
          'student2@demo.com': {
            id: 'demo-student-2',
            email: 'student2@demo.com',
            name: '학생2',
            role: 'STUDENT',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
          },
          'student3@demo.com': {
            id: 'demo-student-3',
            email: 'student3@demo.com',
            name: '학생3',
            role: 'STUDENT',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
          },
          'student4@demo.com': {
            id: 'demo-student-4',
            email: 'student4@demo.com',
            name: '학생4',
            role: 'STUDENT',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
          }
        };
        
        user = fallbackUsers[email as keyof typeof fallbackUsers];
      }
    }

    if (!user) {
      console.log(`User not found: ${email}`);
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`User found: ${user.name}`);
    
    // 비밀번호 확인 (bcrypt 비교)
    try {
      const passwordMatch = await bcrypt.compare(password, user.password || '');
      if (!passwordMatch) {
        console.log(`Login failed for ${email}: password mismatch`);
        return NextResponse.json(
          { error: '비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        );
      }
    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError);
      // bcrypt 실패 시 간단한 문자열 비교 (fallback)
      if (password !== '123') {
        console.log(`Login failed for ${email}: password mismatch (fallback)`);
        return NextResponse.json(
          { error: '비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        );
      }
    }

    console.log(`Login successful for ${email}`);

    // 성공적인 로그인 - 쿠키 설정
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,

        role: user.role,
        password: user.password // 비밀번호는 해시화된 상태로 유지
      }
    });

    // 데모 사용자 정보를 쿠키에 저장 (업데이트된 정보 포함)
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    
    console.log("Setting cookie with production settings:", isProduction, "Vercel:", isVercel);
    
    response.cookies.set('demoUser', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      password: user.password // 비밀번호도 포함하여 다음 로그인 시 사용
    }), {
      path: '/',
      httpOnly: false, // 클라이언트에서 접근 가능하도록
      secure: isProduction || isVercel, // Vercel에서는 HTTPS이므로 true
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7일
    });

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
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Prisma disconnect error:', disconnectError);
    }
  }
}
