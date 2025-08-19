import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// .env.local 파일 로드
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const prisma = new PrismaClient();

async function syncDemoAccounts() {
  console.log("데모 계정을 Supabase Auth에 동기화합니다...");

  try {
    // 데모 계정들 조회
    const demoUsers = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@demo.com'
        }
      }
    });

    console.log(`총 ${demoUsers.length}개의 데모 계정을 찾았습니다.`);

    for (const user of demoUsers) {
      try {
        // Supabase Auth에 사용자 생성
        const { data: authUser, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'demo123!',
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: user.role
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            console.log(`✓ ${user.name} (${user.email}) - 이미 등록됨`);
            
            // 기존 사용자의 ID를 업데이트
            const { data: existingUser } = await supabase.auth.admin.listUsers();
            const existing = existingUser.users.find(u => u.email === user.email);
            
            if (existing) {
              await prisma.user.update({
                where: { id: user.id },
                data: { id: existing.id }
              });
              console.log(`  → ID 동기화 완료: ${existing.id}`);
            }
          } else {
            console.error(`✗ ${user.name} (${user.email}) - 오류:`, error.message);
          }
        } else if (authUser.user) {
          console.log(`✓ ${user.name} (${user.email}) - 새로 생성됨`);
          
          // Prisma 사용자의 ID를 Supabase Auth ID로 업데이트
          await prisma.user.update({
            where: { id: user.id },
            data: { id: authUser.user.id }
          });
          console.log(`  → ID 동기화 완료: ${authUser.user.id}`);
        }
      } catch (userError) {
        console.error(`사용자 ${user.name} 처리 중 오류:`, userError);
      }
    }

    console.log("\n=== 동기화 완료 ===");
    console.log("이제 다음 계정으로 로그인할 수 있습니다:");
    console.log("\n👨‍🏫 교사 계정:");
    console.log("- 김수현: kim.teacher@demo.com / demo123!");
    console.log("- 김민지: kim.teacher2@demo.com / demo123!");
    console.log("- 김영호: kim.teacher3@demo.com / demo123!");
    
    console.log("\n👩‍🎓 학생 계정:");
    console.log("- 이지훈: lee.student1@demo.com / demo123!");
    console.log("- 이서연: lee.student2@demo.com / demo123!");
    console.log("- 이동현: lee.student3@demo.com / demo123!");
    console.log("- 이미나: lee.student4@demo.com / demo123!");
    console.log("- 이준혁: lee.student5@demo.com / demo123!");
    console.log("- 이채영: lee.student6@demo.com / demo123!");
    console.log("- 이현우: lee.student7@demo.com / demo123!");
    console.log("- 이소영: lee.student8@demo.com / demo123!");
    console.log("- 이태민: lee.student9@demo.com / demo123!");
    console.log("- 이유진: lee.student10@demo.com / demo123!");

  } catch (error) {
    console.error("동기화 중 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

syncDemoAccounts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
