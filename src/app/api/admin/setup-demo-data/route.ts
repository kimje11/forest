import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    console.log("Setting up demo data...");
    
    // 데모 사용자들 생성
    const demoUsers = [
      {
        id: 'demo-teacher-math',
        email: 'math@demo.com',
        name: '김수학',
        password: '123',
        role: 'TEACHER' as const
      },
      {
        id: 'demo-teacher-chemistry',
        email: 'chemistry@demo.com',
        name: '이화학',
        password: '123',
        role: 'TEACHER' as const
      },
      {
        id: 'demo-teacher-physics',
        email: 'physics@demo.com',
        name: '박물리',
        password: '123',
        role: 'TEACHER' as const
      },
      {
        id: 'demo-student-1',
        email: 'student1@demo.com',
        name: '학생1',
        password: '123',
        role: 'STUDENT' as const
      },
      {
        id: 'demo-student-2',
        email: 'student2@demo.com',
        name: '학생2',
        password: '123',
        role: 'STUDENT' as const
      },
      {
        id: 'demo-student-3',
        email: 'student3@demo.com',
        name: '학생3',
        password: '123',
        role: 'STUDENT' as const
      },
      {
        id: 'demo-student-4',
        email: 'student4@demo.com',
        name: '학생4',
        password: '123',
        role: 'STUDENT' as const
      }
    ];

    // 사용자들 생성 (upsert 사용)
    for (const userData of demoUsers) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          password: userData.password,
          role: userData.role,
        }
      });
    }

    // 데모 클래스들 생성
    const demoClasses = [
      {
        id: 'demo-class-math-1',
        name: '수학 탐구반',
        description: '수학적 사고력을 기르는 탐구 수업',
        classCode: 'MATH01',
        teacherId: 'demo-teacher-math'
      },
      {
        id: 'demo-class-chemistry-1',
        name: '화학 실험반',
        description: '화학 실험을 통한 과학적 탐구',
        classCode: 'CHEM01',
        teacherId: 'demo-teacher-chemistry'
      },
      {
        id: 'demo-class-physics-1',
        name: '물리 실험반',
        description: '물리 원리를 실험으로 이해하기',
        classCode: 'PHYS01',
        teacherId: 'demo-teacher-physics'
      }
    ];

    for (const classData of demoClasses) {
      await prisma.class.upsert({
        where: { id: classData.id },
        update: {},
        create: classData
      });
    }

    // 학생들을 클래스에 등록
    const enrollments = [
      { studentId: 'demo-student-1', classId: 'demo-class-math-1' },
      { studentId: 'demo-student-2', classId: 'demo-class-math-1' },
      { studentId: 'demo-student-3', classId: 'demo-class-chemistry-1' },
      { studentId: 'demo-student-4', classId: 'demo-class-physics-1' }
    ];

    for (const enrollment of enrollments) {
      await prisma.classEnrollment.upsert({
        where: {
          studentId_classId: {
            studentId: enrollment.studentId,
            classId: enrollment.classId
          }
        },
        update: {},
        create: enrollment
      });
    }

    // 기본 템플릿 생성
    const defaultTemplate = await prisma.template.upsert({
      where: { id: 'demo-template-default' },
      update: {},
      create: {
        id: 'demo-template-default',
        title: '자유 탐구 템플릿',
        description: '학생들이 자유롭게 탐구할 수 있는 기본 템플릿입니다.',
        isDefault: true,
        teacherId: 'demo-teacher-math'
      }
    });

    // 템플릿 단계 생성
    const steps = [
      {
        id: 'demo-step-1',
        title: '탐구 주제 선정',
        description: '관심 있는 탐구 주제를 선정해보세요.',
        order: 1,
        isRequired: true,
        templateId: defaultTemplate.id
      },
      {
        id: 'demo-step-2',
        title: '탐구 계획 수립',
        description: '어떻게 탐구할지 계획을 세워보세요.',
        order: 2,
        isRequired: true,
        templateId: defaultTemplate.id
      }
    ];

    for (const stepData of steps) {
      await prisma.templateStep.upsert({
        where: { id: stepData.id },
        update: {},
        create: stepData
      });
    }

    // 템플릿 컴포넌트 생성
    const components = [
      {
        id: 'demo-comp-1',
        type: 'TEXT' as const,
        label: '탐구 주제',
        placeholder: '탐구하고 싶은 주제를 입력하세요',
        required: true,
        order: 1,
        stepId: 'demo-step-1'
      },
      {
        id: 'demo-comp-2',
        type: 'TEXTAREA' as const,
        label: '탐구 계획',
        placeholder: '탐구 방법과 절차를 상세히 작성하세요',
        required: true,
        order: 1,
        stepId: 'demo-step-2'
      }
    ];

    for (const componentData of components) {
      await prisma.templateComponent.upsert({
        where: { id: componentData.id },
        update: {},
        create: componentData
      });
    }

    console.log("Demo data setup completed successfully");
    
    return NextResponse.json({
      message: "데모 데이터가 성공적으로 생성되었습니다.",
      usersCreated: demoUsers.length,
      classesCreated: demoClasses.length,
      enrollmentsCreated: enrollments.length
    });

  } catch (error) {
    console.error("Demo data setup error:", error);
    return NextResponse.json(
      { error: "데모 데이터 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
