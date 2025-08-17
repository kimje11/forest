import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedClassActivities() {
  console.log("클래스 활동 시드 데이터 생성 중...");

  try {
    // 기본 교사 계정 찾기
    const teacher = await prisma.user.findFirst({
      where: {
        email: "teacher@test.com",
        role: "TEACHER",
      },
    });

    if (!teacher) {
      console.log("교사 계정이 없습니다. 먼저 교사 계정을 생성해주세요.");
      return;
    }

    // 교사의 클래스 찾기
    const teacherClass = await prisma.class.findFirst({
      where: {
        teacherId: teacher.id,
      },
    });

    if (!teacherClass) {
      console.log("교사의 클래스가 없습니다. 먼저 클래스를 생성해주세요.");
      return;
    }

    // 사용할 템플릿 찾기
    const template = await prisma.template.findFirst({
      where: {
        OR: [
          { isDefault: true },
          { teacherId: teacher.id },
        ],
      },
    });

    if (!template) {
      console.log("사용할 템플릿이 없습니다.");
      return;
    }

    // 기존 클래스 활동 삭제
    await prisma.classActivity.deleteMany({
      where: {
        classId: teacherClass.id,
      },
    });

    // 새 클래스 활동 생성
    const classActivities = [
      {
        title: "과학 탐구 프로젝트",
        description: "물리 현상에 대한 탐구 활동입니다. 실험을 통해 원리를 이해해보세요.",
        classId: teacherClass.id,
        templateId: template.id,
        teacherId: teacher.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2주 후
      },
      {
        title: "역사 연구 활동",
        description: "흥미로운 역사적 사건을 선택하여 심층적으로 탐구해보세요.",
        classId: teacherClass.id,
        templateId: template.id,
        teacherId: teacher.id,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3주 후
      },
    ];

    for (const activityData of classActivities) {
      await prisma.classActivity.create({
        data: activityData,
      });
    }

    console.log("✅ 클래스 활동 시드 데이터 생성 완료");
  } catch (error) {
    console.error("❌ 클래스 활동 시드 데이터 생성 실패:", error);
    throw error;
  }
}

// 직접 실행 시
if (require.main === module) {
  seedClassActivities()
    .then(() => {
      console.log("시드 완료");
      process.exit(0);
    })
    .catch((error) => {
      console.error("시드 실패:", error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { seedClassActivities };
