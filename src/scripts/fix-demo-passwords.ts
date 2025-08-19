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

    console.log(`\n발견된 데모 계정: ${demoUsers.length}개`);
    
    if (demoUsers.length === 0) {
      console.log("❌ 데모 계정이 없습니다. 먼저 데모 데이터를 생성해주세요.");
      return;
    }

    // 각 계정의 현재 비밀번호 상태 확인
    for (const user of demoUsers) {
      console.log(`\n--- ${user.name} (${user.email}) ---`);
      
      // 현재 저장된 해시와 "123" 비교
      const isValid123 = await bcrypt.compare("123", user.password);
      const isValid1234 = await bcrypt.compare("1234", user.password);
      
      console.log(`현재 비밀번호 해시: ${user.password.substring(0, 20)}...`);
      console.log(`"123" 검증: ${isValid123 ? '✅' : '❌'}`);
      console.log(`"1234" 검증: ${isValid1234 ? '✅' : '❌'}`);
      
      if (!isValid123) {
        // "123"으로 비밀번호 재설정
        const newHashedPassword = await bcrypt.hash("123", 10);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHashedPassword }
        });
        
        console.log(`🔧 비밀번호를 "123"으로 재설정했습니다.`);
        
        // 재검증
        const recheck = await bcrypt.compare("123", newHashedPassword);
        console.log(`재검증: ${recheck ? '✅ 성공' : '❌ 실패'}`);
      } else {
        console.log(`✅ 비밀번호가 이미 올바르게 설정되어 있습니다.`);
      }
    }

    console.log("\n=== 최종 로그인 정보 ===");
    console.log("\n👨‍🏫 교사 계정:");
    console.log("- physics@demo.com / 123");
    console.log("- chemistry@demo.com / 123");  
    console.log("- math@demo.com / 123");
    
    console.log("\n👩‍🎓 학생 계정:");
    console.log("- student1@demo.com / 123");
    console.log("- student2@demo.com / 123");
    console.log("- student3@demo.com / 123");
    console.log("- student4@demo.com / 123");
    console.log("- student5@demo.com / 123");
    console.log("- student6@demo.com / 123");

    console.log("\n🔗 로그인 페이지: http://localhost:3000/auth/login");

  } catch (error) {
    console.error("오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDemoPasswords();