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

    // 데이터베이스에서 사용자 확인
    console.log(`Demo login attempt: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`User not found: ${email}`);
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`User found: ${user.name}, stored password hash: ${user.password?.substring(0, 20)}...`);
    
    // 비밀번호 확인
    const passwordMatch = await bcrypt.compare(password, user.password || '');
    console.log(`Password match result: ${passwordMatch}`);
    
    // 추가 디버깅: 다양한 비밀번호로 테스트
    const test123 = await bcrypt.compare('123', user.password || '');
    const test1234 = await bcrypt.compare('1234', user.password || '');
    console.log(`Test with '123': ${test123}, Test with '1234': ${test1234}`);

    if (!passwordMatch) {
      console.log(`Login failed for ${email}: password mismatch`);
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 성공적인 로그인 - 쿠키 설정
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // 데모 사용자 정보를 쿠키에 저장
    response.cookies.set('demoUser', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
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
