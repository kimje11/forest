import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkClassActivities() {
  console.log("클래스 활동 데이터를 확인합니다...");

  try {
    const classId = "cmefkr58z0001ub0o2jsg9tob";
    
    // 1. 클래스 정보 확인
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: { name: true, email: true }
        },
        enrollments: {
          include: {
            student: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });
    
    console.log("\n=== 클래스 정보 ===");
    if (classInfo) {
      console.log(`클래스명: ${classInfo.name}`);
      console.log(`교사: ${classInfo.teacher.name} (${classInfo.teacher.email})`);
      console.log(`등록 학생 수: ${classInfo.enrollments.length}`);
      classInfo.enrollments.forEach(enrollment => {
        console.log(`- ${enrollment.student.name} (${enrollment.student.email})`);
      });
    } else {
      console.log("❌ 클래스를 찾을 수 없습니다!");
      return;
    }

    // 2. 해당 클래스의 모든 활동 확인 (isActive 필터링 없이)
    const allActivities = await prisma.classActivity.findMany({
      where: { classId: classId },
      include: {
        template: {
          select: { id: true, title: true }
        },
        teacher: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    console.log("\n=== 모든 클래스 활동 ===");
    console.log(`총 활동 수: ${allActivities.length}`);
    
    allActivities.forEach((activity, index) => {
      console.log(`\n${index + 1}. ${activity.title}`);
      console.log(`   ID: ${activity.id}`);
      console.log(`   템플릿: ${activity.template.title} (${activity.template.id})`);
      console.log(`   교사: ${activity.teacher.name}`);
      console.log(`   활성화: ${activity.isActive ? "✅" : "❌"}`);
      console.log(`   마감일: ${activity.dueDate ? activity.dueDate.toLocaleDateString() : "없음"}`);
      console.log(`   생성일: ${activity.createdAt.toLocaleDateString()}`);
    });

    // 3. 활성화된 활동만 확인
    const activeActivities = allActivities.filter(a => a.isActive);
    console.log(`\n=== 활성화된 활동 ===`);
    console.log(`활성화된 활동 수: ${activeActivities.length}`);
    
    // 4. 데모 계정별 클래스 정보 확인
    console.log("\n=== 데모 계정 클래스 참여 현황 ===");
    const demoUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@demo.com' } },
      include: {
        enrolledClasses: {
          include: {
            class: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    demoUsers.forEach(user => {
      console.log(`\n${user.name} (${user.email}) - ${user.role}`);
      if (user.enrolledClasses.length === 0) {
        console.log("  참여 클래스: 없음");
      } else {
        user.enrolledClasses.forEach(enrollment => {
          console.log(`  - ${enrollment.class.name} (${enrollment.class.id})`);
          if (enrollment.class.id === classId) {
            console.log("    ⭐ 현재 조회 중인 클래스!");
          }
        });
      }
    });

  } catch (error) {
    console.error("오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClassActivities();
