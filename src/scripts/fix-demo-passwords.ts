import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// .env.local 파일 로드
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function fixDemoPasswords() {
  console.log("데모 계정 비밀번호를 수정합니다...");

  try {
    // 모든 데모 계정 조회
    const demoUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@demo.com' } },
      select: { id: true, name: true, email: true, password: true }
    });

    console.log(`발견된 데모 계정: ${demoUsers.length}개`);
    
    if (demoUsers.length === 0) {
      console.log("데모 계정이 없습니다.");
      return;
    }

    // 비밀번호 "123"을 bcrypt로 해시화
    const hashedPassword = await bcrypt.hash("123", 10);
    
    // 모든 데모 계정의 비밀번호를 "123"으로 통일
    for (const user of demoUsers) {
      console.log(`처리 중: ${user.name} (${user.email})`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log(`✅ ${user.name} 비밀번호 업데이트 완료`);
    }

    console.log("\n=== 모든 데모 계정 비밀번호가 '123'으로 설정되었습니다 ===");
    console.log("📋 로그인 정보:");
    demoUsers.forEach(user => {
      console.log(`- ${user.name}: ${user.email} / 123`);
    });

  } catch (error) {
    console.error("비밀번호 수정 중 오류:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDemoPasswords()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });