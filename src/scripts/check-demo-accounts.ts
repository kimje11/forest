import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// .env.local 파일 로드
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkDemoAccounts() {
  console.log("데모 계정 상태를 확인합니다...");

  try {
    // 데모 계정들 조회
    const demoUsers = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@demo.com'
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log(`\n총 ${demoUsers.length}개의 데모 계정을 찾았습니다:\n`);

    // 교사 계정들
    const teachers = demoUsers.filter(u => u.role === 'TEACHER');
    console.log("👨‍🏫 교사 계정:");
    for (const teacher of teachers) {
      console.log(`- ${teacher.name} (${teacher.email})`);
      console.log(`  ID: ${teacher.id}`);
      console.log(`  생성일: ${teacher.createdAt.toLocaleDateString()}`);
      
      // 비밀번호 확인
      const passwordMatch = await bcrypt.compare('demo123!', teacher.password || '');
      console.log(`  비밀번호 확인: ${passwordMatch ? '✓ 올바름' : '✗ 불일치'}`);
      console.log();
    }

    // 학생 계정들
    const students = demoUsers.filter(u => u.role === 'STUDENT');
    console.log("👩‍🎓 학생 계정:");
    for (const student of students) {
      console.log(`- ${student.name} (${student.email})`);
      console.log(`  ID: ${student.id}`);
      
      // 비밀번호 확인
      const passwordMatch = await bcrypt.compare('demo123!', student.password || '');
      console.log(`  비밀번호: ${passwordMatch ? '✓' : '✗'}`);
    }

    // 비밀번호 테스트
    console.log("\n🔐 비밀번호 테스트:");
    const testUser = demoUsers[0];
    if (testUser) {
      console.log(`테스트 사용자: ${testUser.name}`);
      console.log(`저장된 해시: ${testUser.password?.substring(0, 20)}...`);
      
      const isCorrect = await bcrypt.compare('demo123!', testUser.password || '');
      console.log(`'demo123!' 일치 여부: ${isCorrect ? '✓' : '✗'}`);
    }

  } catch (error) {
    console.error("확인 중 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDemoAccounts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
