import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

console.log("데이터베이스 연결을 테스트합니다...");

// .env.local 파일 로드
config({ path: '.env.local' });

console.log("환경변수 DATABASE_URL:", process.env.DATABASE_URL ? "설정됨" : "설정되지 않음");

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Prisma 클라이언트로 연결 시도 중...");
    
    const userCount = await prisma.user.count();
    console.log(`✅ 연결 성공! 총 사용자 수: ${userCount}`);
    
    const demoUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@demo.com' } },
      select: { name: true, email: true }
    });
    
    console.log(`📋 데모 계정 수: ${demoUsers.length}`);
    demoUsers.forEach(user => {
      console.log(`- ${user.name}: ${user.email}`);
    });
    
  } catch (error) {
    console.error("❌ 데이터베이스 연결 실패:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
