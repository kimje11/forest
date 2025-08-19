import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';

// .env.local 파일 로드
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function createDemoData() {
  console.log("연구대회용 데모 데이터 생성을 시작합니다...");

  try {
    // 1. 교사 계정 생성
    const teachers = [
      { name: "김수현", email: "kim.teacher@demo.com" },
      { name: "김민지", email: "kim.teacher2@demo.com" },
      { name: "김영호", email: "kim.teacher3@demo.com" }
    ];

    const hashedPassword = await bcrypt.hash("demo123!", 10);

    for (const teacher of teachers) {
      await prisma.user.upsert({
        where: { email: teacher.email },
        update: {},
        create: {
          id: randomUUID(),
          name: teacher.name,
          email: teacher.email,
          password: hashedPassword,
          role: "TEACHER"
        }
      });
      console.log(`교사 ${teacher.name} 계정 생성 완료`);
    }

    // 2. 학생 계정 생성
    const students = [
      { name: "이지훈", email: "lee.student1@demo.com" },
      { name: "이서연", email: "lee.student2@demo.com" },
      { name: "이동현", email: "lee.student3@demo.com" },
      { name: "이미나", email: "lee.student4@demo.com" },
      { name: "이준혁", email: "lee.student5@demo.com" },
      { name: "이채영", email: "lee.student6@demo.com" },
      { name: "이현우", email: "lee.student7@demo.com" },
      { name: "이소영", email: "lee.student8@demo.com" },
      { name: "이태민", email: "lee.student9@demo.com" },
      { name: "이유진", email: "lee.student10@demo.com" }
    ];

    for (const student of students) {
      await prisma.user.upsert({
        where: { email: student.email },
        update: {},
        create: {
          id: randomUUID(),
          name: student.name,
          email: student.email,
          password: hashedPassword,
          role: "STUDENT"
        }
      });
      console.log(`학생 ${student.name} 계정 생성 완료`);
    }

    // 3. 클래스 생성
    const teacherUser = await prisma.user.findFirst({ where: { email: "kim.teacher@demo.com" } });
    if (!teacherUser) throw new Error("교사 계정을 찾을 수 없습니다.");

    const demoClass = await prisma.class.upsert({
      where: { id: "demo-class-research" },
      update: {},
      create: {
        id: "demo-class-research",
        name: "연구대회 시연용 클래스",
        description: "AI 기반 탐구학습 플랫폼 연구대회 시연을 위한 클래스입니다.",
        teacherId: teacherUser.id,
        classCode: "DEMO24"
      }
    });

    console.log("데모 클래스 생성 완료");

    // 4. 학생들을 클래스에 등록
    const studentUsers = await prisma.user.findMany({ 
      where: { role: "STUDENT", email: { contains: "demo.com" } } 
    });

    for (const student of studentUsers) {
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

    console.log("학생 클래스 등록 완료");

    // 5. 연구대회용 템플릿 생성
    const templates = [
      {
        title: "과학적 탐구 보고서 템플릿",
        description: "체계적인 과학 실험 및 관찰을 통한 탐구 활동 템플릿",
        steps: [
          {
            title: "탐구 주제 선정",
            description: "관심 있는 과학 현상이나 문제를 선택하고 탐구 질문을 설정합니다.",
            order: 1,
            components: [
              {
                type: "TEXTAREA",
                label: "탐구 주제 및 배경",
                placeholder: "어떤 과학 현상에 관심을 갖게 되었나요? 이 주제를 선택한 이유는 무엇인가요?",
                required: true,
                order: 1
              },
              {
                type: "TEXT",
                label: "탐구 질문",
                placeholder: "예: 온도가 식물의 성장에 어떤 영향을 미칠까?",
                required: true,
                order: 2
              }
            ]
          },
          {
            title: "가설 설정",
            description: "탐구 질문에 대한 예상 답안을 과학적 근거와 함께 제시합니다.",
            order: 2,
            components: [
              {
                type: "TEXTAREA",
                label: "가설",
                placeholder: "탐구 질문에 대한 예상 답안을 적어보세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "가설의 근거",
                placeholder: "이러한 가설을 세운 과학적 근거나 이론적 배경을 설명해주세요.",
                required: true,
                order: 2
              }
            ]
          },
          {
            title: "실험 설계",
            description: "가설을 검증하기 위한 실험 방법을 구체적으로 계획합니다.",
            order: 3,
            components: [
              {
                type: "TEXTAREA",
                label: "실험 재료 및 도구",
                placeholder: "실험에 필요한 모든 재료와 도구를 나열해주세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "실험 방법",
                placeholder: "실험 과정을 단계별로 상세히 기술해주세요.",
                required: true,
                order: 2
              },
              {
                type: "TEXT",
                label: "독립변수",
                placeholder: "의도적으로 변화시킬 요인",
                required: true,
                order: 3
              },
              {
                type: "TEXT",
                label: "종속변수",
                placeholder: "관찰하고 측정할 요인",
                required: true,
                order: 4
              },
              {
                type: "TEXT",
                label: "통제변수",
                placeholder: "일정하게 유지할 요인들",
                required: true,
                order: 5
              }
            ]
          },
          {
            title: "실험 결과",
            description: "실험을 통해 얻은 데이터와 관찰 결과를 정리합니다.",
            order: 4,
            components: [
              {
                type: "TEXTAREA",
                label: "실험 데이터",
                placeholder: "측정값, 관찰 내용 등을 표나 그래프로 정리해주세요. 표 삽입 버튼을 활용하세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "실험 과정에서의 특이사항",
                placeholder: "실험 중 발생한 예상치 못한 현상이나 어려움 등을 기록해주세요.",
                required: false,
                order: 2
              }
            ]
          },
          {
            title: "결론 및 논의",
            description: "실험 결과를 분석하고 가설과 비교하여 결론을 도출합니다.",
            order: 5,
            components: [
              {
                type: "TEXTAREA",
                label: "결과 분석",
                placeholder: "실험 데이터를 분석하여 나타난 패턴이나 경향성을 설명해주세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "가설 검증",
                placeholder: "실험 결과가 가설을 지지하는지, 반박하는지 논의해주세요.",
                required: true,
                order: 2
              },
              {
                type: "TEXTAREA",
                label: "결론",
                placeholder: "탐구를 통해 얻은 최종 결론을 요약해주세요.",
                required: true,
                order: 3
              },
              {
                type: "TEXTAREA",
                label: "개선점 및 후속 연구",
                placeholder: "실험의 한계점과 앞으로 더 연구해보고 싶은 내용을 적어주세요.",
                required: false,
                order: 4
              }
            ]
          }
        ]
      },
      {
        title: "수학 탐구 프로젝트 템플릿",
        description: "수학적 사고력을 기르는 심화 탐구 활동 템플릿",
        steps: [
          {
            title: "수학적 문제 상황 인식",
            description: "일상생활이나 수학 개념에서 흥미로운 문제를 발견하고 정의합니다.",
            order: 1,
            components: [
              {
                type: "TEXTAREA",
                label: "문제 상황",
                placeholder: "어떤 수학적 현상이나 문제에 관심을 갖게 되었나요? 구체적인 상황을 설명해주세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXT",
                label: "탐구 질문",
                placeholder: "예: 피보나치 수열은 자연계에서 어떻게 나타날까?",
                required: true,
                order: 2
              }
            ]
          },
          {
            title: "수학적 계획 수립",
            description: "문제 해결을 위한 수학적 접근 방법을 계획합니다.",
            order: 2,
            components: [
              {
                type: "TEXTAREA",
                label: "활용할 수학적 개념",
                placeholder: "이 문제를 해결하기 위해 어떤 수학적 개념이나 공식을 사용할 예정인가요?",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "해결 전략",
                placeholder: "문제를 어떤 순서와 방법으로 접근할 계획인가요?",
                required: true,
                order: 2
              }
            ]
          },
          {
            title: "수학적 탐구 과정",
            description: "계획에 따라 실제로 수학적 탐구를 수행합니다.",
            order: 3,
            components: [
              {
                type: "TEXTAREA",
                label: "계산 과정 및 풀이",
                placeholder: "단계별 계산 과정을 상세히 기록해주세요. 수식 입력 버튼을 활용하세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "데이터 수집 및 분석",
                placeholder: "필요한 경우 데이터를 수집하고 분석한 내용을 정리해주세요. 표나 그래프를 포함할 수 있습니다.",
                required: false,
                order: 2
              }
            ]
          },
          {
            title: "패턴 발견 및 일반화",
            description: "탐구 과정에서 발견한 수학적 패턴을 분석하고 일반화합니다.",
            order: 4,
            components: [
              {
                type: "TEXTAREA",
                label: "발견한 패턴",
                placeholder: "탐구 과정에서 어떤 수학적 패턴이나 규칙을 발견했나요?",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "일반화 시도",
                placeholder: "발견한 패턴을 다른 상황에도 적용할 수 있는지 시도해보세요.",
                required: true,
                order: 2
              }
            ]
          },
          {
            title: "수학적 의사소통",
            description: "탐구 결과를 논리적으로 정리하고 수학적 언어로 표현합니다.",
            order: 5,
            components: [
              {
                type: "TEXTAREA",
                label: "결론",
                placeholder: "탐구를 통해 얻은 수학적 결론을 명확하게 정리해주세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "실생활 연결",
                placeholder: "이 수학적 발견이 실생활에서 어떻게 활용될 수 있는지 생각해보세요.",
                required: true,
                order: 2
              },
              {
                type: "TEXTAREA",
                label: "추가 탐구 과제",
                placeholder: "이 탐구를 바탕으로 더 깊이 있게 연구해보고 싶은 주제가 있다면 적어주세요.",
                required: false,
                order: 3
              }
            ]
          }
        ]
      }
    ];

    for (const templateData of templates) {
      const template = await prisma.template.create({
        data: {
          title: templateData.title,
          description: templateData.description,
          teacherId: teacherUser.id,
          steps: {
            create: templateData.steps.map(step => ({
              title: step.title,
              description: step.description,
              order: step.order,
              components: {
                create: step.components.map(component => ({
                  type: component.type as any,
                  label: component.label,
                  placeholder: component.placeholder,
                  required: component.required,
                  order: component.order
                }))
              }
            }))
          }
        }
      });

      console.log(`템플릿 "${template.title}" 생성 완료`);
    }

    // 6. 클래스 활동 생성
    const createdTemplates = await prisma.template.findMany({
      where: { teacherId: teacherUser.id }
    });

    for (const template of createdTemplates) {
      await prisma.classActivity.create({
        data: {
          title: `${template.title.replace(' 템플릿', '')} 활동`,
          description: `${template.description} 학생들이 이 템플릿을 사용하여 탐구 활동을 진행합니다.`,
          templateId: template.id,
          classId: demoClass.id,
          teacherId: teacherUser.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1주일 후
        }
      });
    }

    console.log("클래스 활동 생성 완료");

    // 7. 샘플 프로젝트 생성 (일부 학생들)
    const sampleStudents = studentUsers.slice(0, 5);
    
    for (const student of sampleStudents) {
      const template = createdTemplates[Math.floor(Math.random() * createdTemplates.length)];
      
      const project = await prisma.project.create({
        data: {
          title: `${student.name}의 ${template.title.replace(' 템플릿', '')}`,
          templateId: template.id,
          studentId: student.id,
          classId: demoClass.id,
          status: Math.random() > 0.5 ? "SUBMITTED" : "DRAFT"
        }
      });

      // 일부 입력 데이터 생성
      const steps = await prisma.templateStep.findMany({
        where: { templateId: template.id },
        include: { components: true }
      });

      for (const step of steps.slice(0, 2)) { // 처음 2단계만
        for (const component of step.components.slice(0, 1)) { // 각 단계의 첫 번째 컴포넌트만
          await prisma.projectInput.create({
            data: {
              projectId: project.id,
              stepId: step.id,
              componentId: component.id,
              value: `${student.name}이 작성한 ${component.label} 내용입니다. 이것은 데모 데이터입니다.`
            }
          });
        }
      }

      console.log(`${student.name}의 샘플 프로젝트 생성 완료`);
    }

    console.log("\n=== 연구대회용 데모 데이터 생성 완료 ===");
    console.log("\n📋 생성된 계정 정보:");
    console.log("\n👨‍🏫 교사 계정:");
    teachers.forEach(teacher => {
      console.log(`   - 이름: ${teacher.name}, 이메일: ${teacher.email}, 비밀번호: demo123!`);
    });
    
    console.log("\n👩‍🎓 학생 계정:");
    students.forEach(student => {
      console.log(`   - 이름: ${student.name}, 이메일: ${student.email}, 비밀번호: demo123!`);
    });

    console.log(`\n🏫 클래스 정보:`);
    console.log(`   - 클래스명: ${demoClass.name}`);
    console.log(`   - 클래스코드: ${demoClass.classCode}`);
    console.log(`   - 담당교사: 김수현`);

    console.log(`\n📝 생성된 템플릿:`);
    templates.forEach(template => {
      console.log(`   - ${template.title}`);
    });

  } catch (error) {
    console.error("데모 데이터 생성 중 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDemoData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
