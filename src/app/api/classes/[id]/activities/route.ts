import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAuthWithDemo } from "@/lib/auth";
import { z } from "zod";

const createActivitySchema = z.object({
  title: z.string().min(1, "활동 제목을 입력해주세요."),
  description: z.string().optional(),
  templateId: z.string().min(1, "템플릿을 선택해주세요."),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : null),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    
    // 데모 계정을 포함한 인증
    const user = await requireAuthWithDemo(request);

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 학생 권한 확인
    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "학생 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 클래스 조회 및 참여 확인
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        enrollments: {
          where: { studentId: user.id },
          select: { id: true },
        },
      },
    });

    if (!classInfo) {
      return NextResponse.json(
        { error: "클래스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 클래스 참여 확인
    if (classInfo.enrollments.length === 0) {
      return NextResponse.json(
        { error: "해당 클래스에 참여하지 않았습니다." },
        { status: 403 }
      );
    }

    // 해당 클래스에 할당된 활동들 조회
    console.log("Fetching activities for classId:", classId);
    const classActivities = await prisma.classActivity.findMany({
      where: { 
        classId: classId,
        isActive: true 
      },
      include: {
        template: {
          include: {
            steps: {
              include: {
                components: {
                  orderBy: { order: "asc" },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("Found activities:", classActivities.length);
    console.log("Activities:", classActivities.map(a => ({ id: a.id, title: a.title, isActive: a.isActive })));

    // 클래스 활동을 활동 형태로 변환
    const activities = classActivities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      template: {
        id: activity.template.id,
        title: activity.template.title,
        description: activity.template.description,
        steps: activity.template.steps,
      },
      status: activity.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: activity.createdAt,
      dueDate: activity.dueDate,
      isTeacherTemplate: true, // 클래스 활동은 모두 교사가 할당한 것
    }));

    return NextResponse.json({
      class: {
        id: classInfo.id,
        name: classInfo.name,
        description: classInfo.description,
        teacher: classInfo.teacher,
        activities,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Get class activities error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    
    // 데모 계정 지원 인증 및 권한 확인
    const user = await requireAuthWithDemo(request, ["TEACHER"]);

    if (!user) {
      return NextResponse.json(
        { error: "교사 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 클래스 소유권 확인
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classInfo) {
      return NextResponse.json(
        { error: "클래스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (classInfo.teacherId !== user.id) {
      return NextResponse.json(
        { error: "해당 클래스의 담당 교사가 아닙니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createActivitySchema.parse(body);

    // 템플릿 확인
    const template = await prisma.template.findUnique({
      where: { id: validatedData.templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 교사 템플릿 또는 기본 템플릿만 사용 가능
    if (!template.isDefault && template.teacherId !== user.id) {
      return NextResponse.json(
        { error: "해당 템플릿을 사용할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 클래스 활동 생성
    const classActivity = await prisma.classActivity.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        classId: classId,
        templateId: validatedData.templateId,
        teacherId: user.id,
        dueDate: validatedData.dueDate,
      },
      include: {
        template: {
          include: {
            steps: {
              include: {
                components: {
                  orderBy: { order: "asc" },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        message: "클래스 활동이 생성되었습니다.",
        activity: classActivity 
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Create class activity error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}