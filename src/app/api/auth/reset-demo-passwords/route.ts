import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("데모 계정 비밀번호 재설정 시작...");
    
    // 모든 데모 계정 조회
    const demoUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@demo.com' } },
      select: { id: true, name: true, email: true, password: true }
    });

    console.log(`발견된 데모 계정: ${demoUsers.length}개`);
    
    if (demoUsers.length === 0) {
      return NextResponse.json({
        success: false,
        message: "데모 계정이 없습니다."
      });
    }

    const results = [];
    
    // 각 계정의 비밀번호를 "123"으로 재설정
    for (const user of demoUsers) {
      console.log(`처리 중: ${user.name} (${user.email})`);
      
      // 새 해시 생성
      const newHashedPassword = await bcrypt.hash("123", 10);
      
      // 데이터베이스 업데이트
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHashedPassword }
      });
      
      // 검증
      const isValid = await bcrypt.compare("123", newHashedPassword);
      
      results.push({
        name: user.name,
        email: user.email,
        success: isValid
      });
      
      console.log(`${user.name}: ${isValid ? '성공' : '실패'}`);
    }

    return NextResponse.json({
      success: true,
      message: "데모 계정 비밀번호가 모두 '123'으로 재설정되었습니다.",
      results,
      accounts: [
        "physics@demo.com / 123",
        "chemistry@demo.com / 123", 
        "math@demo.com / 123",
        "student1@demo.com / 123",
        "student2@demo.com / 123",
        "student3@demo.com / 123",
        "student4@demo.com / 123",
        "student5@demo.com / 123",
        "student6@demo.com / 123"
      ]
    });

  } catch (error) {
    console.error('비밀번호 재설정 오류:', error);
    return NextResponse.json({
      success: false,
      error: '비밀번호 재설정 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
