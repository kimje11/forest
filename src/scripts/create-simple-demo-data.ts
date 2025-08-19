import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';

// .env.local 파일 로드
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function createSimpleDemoData() {
  console.log("간단한 데모 계정을 생성합니다...");

  try {
    const hashedPassword = await bcrypt.hash("123", 10);

    // 기존 데모 계정들 삭제
    await prisma.user.deleteMany({
      where: {
        email: {
          endsWith: '@demo.com'
        }
      }
    });

    // 간단한 계정들 생성
    const accounts = [
      { name: "교사1", email: "teacher1@demo.com", role: "TEACHER" },
      { name: "교사2", email: "teacher2@demo.com", role: "TEACHER" },
      { name: "학생1", email: "student1@demo.com", role: "STUDENT" },
      { name: "학생2", email: "student2@demo.com", role: "STUDENT" },
      { name: "학생3", email: "student3@demo.com", role: "STUDENT" },
      { name: "학생4", email: "student4@demo.com", role: "STUDENT" },
      { name: "학생5", email: "student5@demo.com", role: "STUDENT" }
    ];

    for (const account of accounts) {
      await prisma.user.create({
        data: {
          id: randomUUID(),
          name: account.name,
          email: account.email,
          password: hashedPassword,
          role: account.role as any
        }
      });
      console.log(`${account.name} (${account.email}) 계정 생성 완료`);
    }

    // 교사1로 클래스 생성
    const teacher1 = await prisma.user.findFirst({ where: { email: "teacher1@demo.com" } });
    if (!teacher1) throw new Error("교사1 계정을 찾을 수 없습니다.");

    const demoClass = await prisma.class.upsert({
      where: { id: "simple-demo-class" },
      update: {},
      create: {
        id: "simple-demo-class",
        name: "데모 클래스",
        description: "간단한 데모용 클래스입니다.",
        teacherId: teacher1.id,
        classCode: "DEMO01"
      }
    });

    // 학생들을 클래스에 등록
    const students = await prisma.user.findMany({
      where: { role: "STUDENT", email: { endsWith: "@demo.com" } }
    });

    for (const student of students) {
      await prisma.classEnrollment.upsert({
        where: {
          studentId_classId: {
            studentId: student.id,
            classId: demoClass.id
          }
        },
        update: {},
        create: {
          studentId: student.id,
          classId: demoClass.id
        }
      });
    }

    // 간단한 템플릿 생성
    const template = await prisma.template.create({
      data: {
        title: "기본 탐구 템플릿",
        description: "데모용 탐구 활동 템플릿입니다.",
        teacherId: teacher1.id,
        steps: {
          create: [
            {
              title: "주제 설정",
              description: "탐구할 주제를 정합니다.",
              order: 1,
              components: {
                create: [
                  {
                    type: "TEXT",
                    label: "탐구 주제",
                    placeholder: "탐구하고 싶은 주제를 입력하세요",
                    required: true,
                    order: 1
                  },
                  {
                    type: "TEXTAREA",
                    label: "주제 설명",
                    placeholder: "주제에 대한 자세한 설명을 입력하세요. 표 삽입과 수식 입력도 가능합니다.",
                    required: true,
                    order: 2
                  }
                ]
              }
            },
            {
              title: "탐구 과정",
              description: "탐구를 진행합니다.",
              order: 2,
              components: {
                create: [
                  {
                    type: "TEXTAREA",
                    label: "탐구 내용",
                    placeholder: "탐구한 내용을 자세히 작성해주세요. 이미지나 표도 삽입할 수 있습니다.",
                    required: true,
                    order: 1
                  }
                ]
              }
            },
            {
              title: "결론",
              description: "탐구 결과를 정리합니다.",
              order: 3,
              components: {
                create: [
                  {
                    type: "TEXTAREA",
                    label: "탐구 결론",
                    placeholder: "탐구를 통해 알게 된 내용을 정리해주세요.",
                    required: true,
                    order: 1
                  }
                ]
              }
            }
          ]
        }
      }
    });

    // 클래스 활동 생성
    await prisma.classActivity.create({
      data: {
        title: "기본 탐구 활동",
        description: "데모용 탐구 활동입니다.",
        templateId: template.id,
        classId: demoClass.id,
        teacherId: teacher1.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // 샘플 프로젝트 생성 (학생1, 학생2용)
    const sampleStudents = students.slice(0, 2);
    
    for (const student of sampleStudents) {
      const project = await prisma.project.create({
        data: {
          title: `${student.name}의 탐구 프로젝트`,
          templateId: template.id,
          studentId: student.id,
          classId: demoClass.id,
          status: student.name === "학생1" ? "SUBMITTED" : "DRAFT"
        }
      });

      // 샘플 입력 데이터
      const steps = await prisma.templateStep.findMany({
        where: { templateId: template.id },
        include: { components: true }
      });

      for (const step of steps) {
        for (const component of step.components) {
          let sampleValue = "";
          
          if (component.label === "탐구 주제") {
            sampleValue = student.name === "학생1" ? "식물의 성장과 빛의 관계" : "물의 온도 변화 실험";
          } else if (component.label === "주제 설명") {
            sampleValue = `${student.name}이 작성한 상세한 주제 설명입니다. 여기에는 표와 수식도 포함될 수 있습니다.`;
          } else if (component.label === "탐구 내용") {
            sampleValue = `${student.name}이 진행한 탐구 과정과 결과입니다. 다양한 실험과 관찰을 통해 얻은 데이터를 정리했습니다.`;
          } else if (component.label === "탐구 결론") {
            sampleValue = `${student.name}의 탐구를 통해 얻은 결론입니다. 가설이 맞았는지 검증하고 새롭게 알게 된 사실들을 정리했습니다.`;
          }

          if (sampleValue) {
            await prisma.projectInput.create({
              data: {
                projectId: project.id,
                stepId: step.id,
                componentId: component.id,
                value: sampleValue
              }
            });
          }
        }
      }

      console.log(`${student.name}의 샘플 프로젝트 생성 완료`);
    }

    console.log("\n=== 간단한 데모 데이터 생성 완료 ===");
    console.log("\n📋 생성된 계정 정보:");
    console.log("\n👨‍🏫 교사 계정:");
    console.log("- 교사1: teacher1@demo.com / 123");
    console.log("- 교사2: teacher2@demo.com / 123");
    
    console.log("\n👩‍🎓 학생 계정:");
    console.log("- 학생1: student1@demo.com / 123");
    console.log("- 학생2: student2@demo.com / 123");
    console.log("- 학생3: student3@demo.com / 123");
    console.log("- 학생4: student4@demo.com / 123");
    console.log("- 학생5: student5@demo.com / 123");

    console.log(`\n🏫 클래스 정보:`);
    console.log(`- 클래스명: ${demoClass.name}`);
    console.log(`- 클래스코드: ${demoClass.classCode}`);
    console.log(`- 담당교사: 교사1`);

    console.log(`\n📝 생성된 템플릿:`);
    console.log(`- 기본 탐구 템플릿 (3단계 구성)`);

  } catch (error) {
    console.error("데모 데이터 생성 중 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleDemoData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
