import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// .env.local 파일 로드
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function updateDemoPassword() {
  console.log("데모 계정 비밀번호를 업데이트합니다...");

  try {
    // 1234를 bcrypt로 해시화
    const hashedPassword = await bcrypt.hash("1234", 10);
    
    // math@demo.com 계정의 비밀번호 업데이트
    const updatedUser = await prisma.user.update({
      where: { email: "math@demo.com" },
      data: { password: hashedPassword }
    });

    console.log(`✅ ${updatedUser.name} (${updatedUser.email}) 비밀번호 업데이트 완료`);
    console.log(`📋 로그인 정보:`);
    console.log(`이메일: math@demo.com`);
    console.log(`비밀번호: 1234`);

    // 비밀번호 검증 테스트
    const isValid = await bcrypt.compare("1234", hashedPassword);
    console.log(`🔐 비밀번호 검증: ${isValid ? '성공' : '실패'}`);

  } catch (error) {
    if (error.code === 'P2025') {
      console.error("❌ math@demo.com 계정을 찾을 수 없습니다.");
      console.log("📋 현재 데모 계정들을 확인해보세요:");
      
      const demoUsers = await prisma.user.findMany({
        where: { email: { endsWith: '@demo.com' } },
        select: { email: true, name: true }
      });
      
      demoUsers.forEach(user => {
        console.log(`- ${user.name}: ${user.email}`);
      });
    } else {
      console.error("비밀번호 업데이트 중 오류:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoPassword()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
