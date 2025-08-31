import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 데모 계정인지 확인 (demo.com 도메인)
    if (!email.endsWith('@demo.com')) {
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
      user = await prisma.user.findUnique({
        where: { email }
      });
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
    const passwordMatch = await bcrypt.compare(password, user.password || '');
    if (!passwordMatch) {
      console.log(`Login failed for ${email}: password mismatch`);
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
        id: user.id,
        email: user.email,
        name: user.name,

        role: user.role,
        password: user.password // 비밀번호는 해시화된 상태로 유지
      }
    });

    // 데모 사용자 정보를 쿠키에 저장 (업데이트된 정보 포함)
    response.cookies.set('demoUser', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,

      role: user.role,
      password: user.password // 비밀번호도 포함하여 다음 로그인 시 사용
    }), {
      path: '/',
      httpOnly: false, // 클라이언트에서 접근 가능하도록
      secure: false,   // 개발 환경에서는 false
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7일
    });

    return response;

  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
