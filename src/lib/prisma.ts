import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DATABASE_URL 환경 변수 검증
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  console.error("📝 .env.local 파일에 DATABASE_URL을 추가해주세요.");
  console.error("💡 예시: DATABASE_URL=postgresql://username:password@localhost:5432/database");
  
  // 개발 환경에서는 더 자세한 정보 제공
  if (process.env.NODE_ENV === 'development') {
    console.error("🔧 현재 환경 변수들:");
    console.error("NODE_ENV:", process.env.NODE_ENV);
    console.error("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "설정됨" : "설정되지 않음");
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "설정됨" : "설정되지 않음");
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ["warn", "error"] : ["error"],
    // 연결 풀 최적화
    datasources: {
      db: {
        url: databaseUrl || "postgresql://dummy:dummy@localhost:5432/dummy", // 기본값 제공
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
