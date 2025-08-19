import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';

// .env.local 파일 로드
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function createSubjectBasedDemoData() {
  console.log("교과별 데모 데이터를 생성합니다...");

  try {
    const hashedPassword = await bcrypt.hash("123", 10);

    // 기존 데모 계정들 정리
    await prisma.projectInput.deleteMany({
      where: {
        project: {
          student: {
            email: { endsWith: '@demo.com' }
          }
        }
      }
    });

    await prisma.project.deleteMany({
      where: {
        student: {
          email: { endsWith: '@demo.com' }
        }
      }
    });

    await prisma.classActivity.deleteMany({
      where: {
        teacher: {
          email: { endsWith: '@demo.com' }
        }
      }
    });

    await prisma.templateComponent.deleteMany({
      where: {
        step: {
          template: {
            teacher: {
              email: { endsWith: '@demo.com' }
            }
          }
        }
      }
    });

    await prisma.templateStep.deleteMany({
      where: {
        template: {
          teacher: {
            email: { endsWith: '@demo.com' }
          }
        }
      }
    });

    await prisma.template.deleteMany({
      where: {
        teacher: {
          email: { endsWith: '@demo.com' }
        }
      }
    });

    await prisma.classEnrollment.deleteMany({
      where: {
        student: {
          email: { endsWith: '@demo.com' }
        }
      }
    });

    await prisma.class.deleteMany({
      where: {
        teacher: {
          email: { endsWith: '@demo.com' }
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: { endsWith: '@demo.com' }
      }
    });

    // 교과별 교사 계정 생성
    const teachers = [
      { name: "김물리", email: "physics@demo.com", role: "TEACHER", subject: "물리" },
      { name: "이화학", email: "chemistry@demo.com", role: "TEACHER", subject: "화학" },
      { name: "박수학", email: "math@demo.com", role: "TEACHER", subject: "수학" }
    ];

    const teacherIds = {};
    for (const teacher of teachers) {
      const teacherId = randomUUID();
      await prisma.user.create({
        data: {
          id: teacherId,
          name: teacher.name,
          email: teacher.email,
          password: hashedPassword,
          role: teacher.role as any
        }
      });
      teacherIds[teacher.subject] = teacherId;
      console.log(`${teacher.name} (${teacher.email}) 계정 생성 완료`);
    }

    // 학생 계정 생성
    const students = [
      { name: "학생1", email: "student1@demo.com" },
      { name: "학생2", email: "student2@demo.com" },
      { name: "학생3", email: "student3@demo.com" },
      { name: "학생4", email: "student4@demo.com" },
      { name: "학생5", email: "student5@demo.com" },
      { name: "학생6", email: "student6@demo.com" }
    ];

    const studentIds = [];
    for (const student of students) {
      const studentId = randomUUID();
      await prisma.user.create({
        data: {
          id: studentId,
          name: student.name,
          email: student.email,
          password: hashedPassword,
          role: "STUDENT"
        }
      });
      studentIds.push(studentId);
      console.log(`${student.name} (${student.email}) 계정 생성 완료`);
    }

    // 교과별 클래스 생성
    const classes = [
      { 
        name: "물리1 클래스", 
        description: "고등학교 물리1 탐구활동 클래스", 
        teacherId: teacherIds["물리"], 
        classCode: "PHY01",
        subject: "물리"
      },
      { 
        name: "화학1 클래스", 
        description: "고등학교 화학1 탐구활동 클래스", 
        teacherId: teacherIds["화학"], 
        classCode: "CHE01",
        subject: "화학"
      },
      { 
        name: "수학 클래스", 
        description: "고등학교 수학 탐구활동 클래스", 
        teacherId: teacherIds["수학"], 
        classCode: "MAT01",
        subject: "수학"
      }
    ];

    const classIds = {};
    for (const classData of classes) {
      const classId = randomUUID();
      const createdClass = await prisma.class.create({
        data: {
          id: classId,
          name: classData.name,
          description: classData.description,
          teacherId: classData.teacherId,
          classCode: classData.classCode
        }
      });
      classIds[classData.subject] = classId;

      // 각 클래스에 학생 2명씩 등록
      const assignedStudents = studentIds.slice(
        Object.keys(classIds).length * 2 - 2, 
        Object.keys(classIds).length * 2
      );

      for (const studentId of assignedStudents) {
        await prisma.classEnrollment.create({
          data: {
            studentId: studentId,
            classId: classId
          }
        });
      }

      console.log(`${classData.name} 생성 및 학생 배정 완료`);
    }

    // 교과별 실제적인 템플릿 생성
    const templates = [
      {
        subject: "물리",
        title: "등가속도 운동 탐구",
        description: "물체의 등가속도 운동을 실험을 통해 탐구하고 운동 법칙을 이해한다.",
        teacherId: teacherIds["물리"],
        steps: [
          {
            title: "실험 설계",
            description: "등가속도 운동 실험을 설계합니다.",
            order: 1,
            components: [
              {
                type: "TEXT",
                label: "실험 주제",
                placeholder: "탐구할 물리 현상을 간단히 적어주세요",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "실험 가설",
                placeholder: "실험 결과에 대한 가설을 세워보세요. 수식이나 그래프를 포함할 수 있습니다.",
                required: true,
                order: 2
              },
              {
                type: "TEXTAREA",
                label: "실험 준비물 및 방법",
                placeholder: "필요한 실험 기구와 실험 절차를 구체적으로 작성해주세요. 표를 사용하여 정리할 수 있습니다.",
                required: true,
                order: 3
              }
            ]
          },
          {
            title: "실험 수행 및 데이터 수집",
            description: "실험을 수행하고 데이터를 기록합니다.",
            order: 2,
            components: [
              {
                type: "TEXTAREA",
                label: "실험 데이터",
                placeholder: "측정한 데이터를 표로 정리해주세요. 시간, 거리, 속도 등의 값을 기록하세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "실험 과정 관찰 및 기록",
                placeholder: "실험 중 관찰한 현상이나 특이사항을 기록해주세요. 이미지나 그래프를 첨부할 수 있습니다.",
                required: true,
                order: 2
              }
            ]
          },
          {
            title: "데이터 분석 및 결론",
            description: "수집한 데이터를 분석하고 결론을 도출합니다.",
            order: 3,
            components: [
              {
                type: "TEXTAREA",
                label: "데이터 분석",
                placeholder: "그래프를 그리고 수식을 도출해보세요. v = at, s = ½at² 등의 공식을 확인해보세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "결론 및 고찰",
                placeholder: "실험 결과를 바탕으로 등가속도 운동의 특성을 설명하고, 오차 원인과 개선 방법을 제시해주세요.",
                required: true,
                order: 2
              }
            ]
          }
        ]
      },
      {
        subject: "화학",
        title: "산-염기 중화반응 탐구",
        description: "산과 염기의 중화반응을 통해 pH 변화와 중화점을 찾는 실험을 수행한다.",
        teacherId: teacherIds["화학"],
        steps: [
          {
            title: "실험 계획",
            description: "중화반응 실험을 계획합니다.",
            order: 1,
            components: [
              {
                type: "TEXT",
                label: "실험 목표",
                placeholder: "이 실험을 통해 알아보고자 하는 것을 명확히 적어주세요",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "실험 원리",
                placeholder: "산-염기 중화반응의 원리를 화학 반응식과 함께 설명해주세요. H⁺ + OH⁻ → H₂O",
                required: true,
                order: 2
              },
              {
                type: "TEXTAREA",
                label: "실험 재료 및 기구",
                placeholder: "사용할 시약(HCl, NaOH 등)과 실험 기구(뷰렛, 피펫, pH 지시약 등)를 나열해주세요.",
                required: true,
                order: 3
              }
            ]
          },
          {
            title: "실험 실시",
            description: "적정 실험을 수행합니다.",
            order: 2,
            components: [
              {
                type: "TEXTAREA",
                label: "적정 데이터",
                placeholder: "NaOH 부피에 따른 pH 변화를 표로 기록해주세요. 적정곡선을 그릴 데이터를 수집하세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "실험 관찰 사항",
                placeholder: "지시약의 색 변화, 중화점에서의 현상 등을 관찰하고 기록해주세요.",
                required: true,
                order: 2
              }
            ]
          },
          {
            title: "결과 분석",
            description: "실험 결과를 분석하고 중화점을 구합니다.",
            order: 3,
            components: [
              {
                type: "TEXTAREA",
                label: "적정곡선 그래프",
                placeholder: "pH vs NaOH 부피 그래프를 그리고 중화점을 표시해주세요. 그래프의 특징을 설명하세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "농도 계산 및 결론",
                placeholder: "중화점에서의 농도를 계산하고(M₁V₁ = M₂V₂), 실험 오차와 개선점을 논의해주세요.",
                required: true,
                order: 2
              }
            ]
          }
        ]
      },
      {
        subject: "수학",
        title: "함수의 극값과 최적화 문제",
        description: "실생활 문제를 함수로 모델링하고 미분을 이용하여 최댓값과 최솟값을 구한다.",
        teacherId: teacherIds["수학"],
        steps: [
          {
            title: "문제 상황 설정",
            description: "최적화가 필요한 실생활 문제를 설정합니다.",
            order: 1,
            components: [
              {
                type: "TEXT",
                label: "탐구 주제",
                placeholder: "최댓값/최솟값을 구해야 하는 실생활 문제를 선택해주세요",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "문제 상황 분석",
                placeholder: "선택한 문제의 조건과 제약사항을 정리해주세요. 예: 울타리 문제, 상자 부피 최대화 등",
                required: true,
                order: 2
              },
              {
                type: "TEXTAREA",
                label: "변수 설정",
                placeholder: "문제에서 변화하는 변수를 정의하고, 구하고자 하는 목표 함수를 설정해주세요.",
                required: true,
                order: 3
              }
            ]
          },
          {
            title: "함수 모델링",
            description: "문제를 수학적 함수로 표현합니다.",
            order: 2,
            components: [
              {
                type: "TEXTAREA",
                label: "함수식 도출",
                placeholder: "문제 상황을 나타내는 함수 f(x)를 구해보세요. 제곱함수, 3차함수 등의 형태로 나타내세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "정의역 결정",
                placeholder: "함수의 정의역을 실제 문제의 제약조건에 맞게 설정해주세요. 예: 0 < x < 10",
                required: true,
                order: 2
              }
            ]
          },
          {
            title: "극값 계산 및 해석",
            description: "미분을 이용하여 극값을 구하고 해석합니다.",
            order: 3,
            components: [
              {
                type: "TEXTAREA",
                label: "도함수 계산",
                placeholder: "f'(x)를 구하고, f'(x) = 0인 점을 찾아보세요. 계산 과정을 자세히 보여주세요.",
                required: true,
                order: 1
              },
              {
                type: "TEXTAREA",
                label: "극값 판정 및 결론",
                placeholder: "이계도함수나 함수값 비교를 통해 최댓값/최솟값을 판정하고, 실생활 문제의 답을 구해주세요.",
                required: true,
                order: 2
              }
            ]
          }
        ]
      }
    ];

    const templateIds = {};
    for (const template of templates) {
      const templateId = randomUUID();
      const createdTemplate = await prisma.template.create({
        data: {
          id: templateId,
          title: template.title,
          description: template.description,
          teacherId: template.teacherId
        }
      });
      templateIds[template.subject] = templateId;

      // 템플릿 단계 생성
      for (const step of template.steps) {
        const stepId = randomUUID();
        const createdStep = await prisma.templateStep.create({
          data: {
            id: stepId,
            title: step.title,
            description: step.description,
            order: step.order,
            templateId: templateId
          }
        });

        // 단계별 컴포넌트 생성
        for (const component of step.components) {
          await prisma.templateComponent.create({
            data: {
              id: randomUUID(),
              type: component.type as any,
              label: component.label,
              placeholder: component.placeholder,
              required: component.required,
              order: component.order,
              stepId: stepId
            }
          });
        }
      }

      console.log(`${template.subject} 템플릿 "${template.title}" 생성 완료`);
    }

    // 교과별 클래스 활동 생성
    const subjects = ["물리", "화학", "수학"];
    for (const subject of subjects) {
      await prisma.classActivity.create({
        data: {
          id: randomUUID(),
          title: `${subject} 탐구 활동`,
          description: `${subject} 교과의 실험 및 탐구 활동입니다.`,
          templateId: templateIds[subject],
          classId: classIds[subject],
          teacherId: teacherIds[subject],
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2주 후
        }
      });
      console.log(`${subject} 클래스 활동 생성 완료`);
    }

    // 학생별 프로젝트 생성 (다양한 상태로)
    const projectStatuses = ["DRAFT", "SUBMITTED"];
    let studentIndex = 0;

    for (const subject of subjects) {
      const classStudents = studentIds.slice(studentIndex, studentIndex + 2);
      
      for (let i = 0; i < classStudents.length; i++) {
        const studentId = classStudents[i];
        const status = i === 0 ? "SUBMITTED" : "DRAFT"; // 첫 번째 학생은 완료, 두 번째는 진행중
        
        const project = await prisma.project.create({
          data: {
            id: randomUUID(),
            title: `${subject} 탐구 프로젝트`,
            templateId: templateIds[subject],
            studentId: studentId,
            classId: classIds[subject],
            status: status as any
          }
        });

        // 완료된 프로젝트에는 샘플 데이터 추가
        if (status === "SUBMITTED") {
          const steps = await prisma.templateStep.findMany({
            where: { templateId: templateIds[subject] },
            include: { components: true }
          });

          for (const step of steps) {
            for (const component of step.components) {
              let sampleValue = "";
              
              // 교과별 샘플 데이터
              if (subject === "물리") {
                if (component.label === "실험 주제") {
                  sampleValue = "자유낙하 운동에서의 중력가속도 측정";
                } else if (component.label === "실험 가설") {
                  sampleValue = "자유낙하하는 물체의 운동은 등가속도 운동이며, 중력가속도 g = 9.8 m/s²이다.";
                } else if (component.label.includes("데이터")) {
                  sampleValue = `<table class="table-editor-inserted">
<tr><th>시간(s)</th><th>낙하거리(m)</th><th>속도(m/s)</th></tr>
<tr><td>0.1</td><td>0.049</td><td>0.98</td></tr>
<tr><td>0.2</td><td>0.196</td><td>1.96</td></tr>
<tr><td>0.3</td><td>0.441</td><td>2.94</td></tr>
</table>`;
                } else {
                  sampleValue = `물리 실험을 통해 얻은 결과입니다. 측정값이 이론값과 잘 일치함을 확인할 수 있었습니다.`;
                }
              } else if (subject === "화학") {
                if (component.label === "실험 목표") {
                  sampleValue = "0.1M HCl과 0.1M NaOH의 중화반응에서 중화점 확인";
                } else if (component.label === "실험 원리") {
                  sampleValue = "HCl + NaOH → NaCl + H₂O\n강산과 강염기의 중화반응으로 pH = 7에서 중화점이 형성됩니다.";
                } else if (component.label.includes("데이터")) {
                  sampleValue = `<table class="table-editor-inserted">
<tr><th>NaOH 부피(mL)</th><th>pH</th><th>지시약 색</th></tr>
<tr><td>0</td><td>1.0</td><td>빨강</td></tr>
<tr><td>10</td><td>1.8</td><td>빨강</td></tr>
<tr><td>20</td><td>7.0</td><td>노랑</td></tr>
<tr><td>25</td><td>11.5</td><td>파랑</td></tr>
</table>`;
                } else {
                  sampleValue = `중화반응 실험을 통해 pH 변화를 관찰하고 중화점을 확인할 수 있었습니다.`;
                }
              } else { // 수학
                if (component.label === "탐구 주제") {
                  sampleValue = "직사각형 모양의 울타리 면적 최대화 문제";
                } else if (component.label === "문제 상황 분석") {
                  sampleValue = "120m의 울타리로 직사각형 모양의 정원을 만들 때, 면적이 최대가 되는 경우를 찾는다.";
                } else if (component.label.includes("함수")) {
                  sampleValue = "둘레: 2x + 2y = 120\n면적: S(x) = x(60-x) = 60x - x²";
                } else if (component.label.includes("도함수")) {
                  sampleValue = "S'(x) = 60 - 2x = 0\n∴ x = 30, y = 30\n최대면적: 900m²";
                } else {
                  sampleValue = `미분을 이용한 최적화 문제 해결 과정입니다.`;
                }
              }

              if (sampleValue) {
                await prisma.projectInput.create({
                  data: {
                    id: randomUUID(),
                    projectId: project.id,
                    stepId: step.id,
                    componentId: component.id,
                    value: sampleValue
                  }
                });
              }
            }
          }
        }

        const studentName = students[studentIndex + i].name;
        console.log(`${studentName}의 ${subject} 프로젝트 생성 완료 (상태: ${status === "SUBMITTED" ? "완료" : "진행중"})`);
      }
      
      studentIndex += 2;
    }

    console.log("\n=== 교과별 데모 데이터 생성 완료 ===");
    console.log("\n📋 생성된 계정 정보:");
    
    console.log("\n👨‍🏫 교사 계정 (교과별):");
    console.log("- 김물리 (물리): physics@demo.com / 123");
    console.log("- 이화학 (화학): chemistry@demo.com / 123");
    console.log("- 박수학 (수학): math@demo.com / 123");
    
    console.log("\n👩‍🎓 학생 계정:");
    for (let i = 0; i < students.length; i++) {
      const subject = i < 2 ? "물리" : i < 4 ? "화학" : "수학";
      console.log(`- ${students[i].name}: ${students[i].email} / 123 (${subject} 클래스)`);
    }

    console.log("\n🏫 클래스 정보:");
    console.log("- 물리1 클래스 (PHY01) - 학생1, 학생2");
    console.log("- 화학1 클래스 (CHE01) - 학생3, 학생4");
    console.log("- 수학 클래스 (MAT01) - 학생5, 학생6");

    console.log("\n📝 생성된 템플릿:");
    console.log("- 물리: 등가속도 운동 탐구 (3단계)");
    console.log("- 화학: 산-염기 중화반응 탐구 (3단계)");
    console.log("- 수학: 함수의 극값과 최적화 문제 (3단계)");

    console.log("\n📊 프로젝트 상태:");
    console.log("- 학생1 (물리): 완료 ✅");
    console.log("- 학생2 (물리): 진행중 🟡");
    console.log("- 학생3 (화학): 완료 ✅");
    console.log("- 학생4 (화학): 진행중 🟡");
    console.log("- 학생5 (수학): 완료 ✅");
    console.log("- 학생6 (수학): 진행중 🟡");

  } catch (error) {
    console.error("교과별 데모 데이터 생성 중 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSubjectBasedDemoData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
