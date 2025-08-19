import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthWithDemo } from "@/lib/auth";
import { z } from "zod";

const createFeedbackSchema = z.object({
  stepId: z.string().nullable().optional(),
  content: z.string().min(1, "피드백 내용을 입력해주세요."),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // 데모 계정 지원 인증 및 권한 확인
    const user = await requireAuthWithDemo(request, ["TEACHER"]);

    if (!user) {
      return NextResponse.json(
        { error: "교사 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createFeedbackSchema.parse(body);

    // 프로젝트 조회 및 권한 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        class: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (project.class?.teacherId !== user.id) {
      return NextResponse.json(
        { error: "이 프로젝트에 피드백을 작성할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 피드백 생성
    const feedback = await prisma.feedback.create({
      data: {
        projectId,
        stepId: validatedData.stepId,
        teacherId: user.id,
        content: validatedData.content,
      },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        message: "피드백이 성공적으로 작성되었습니다.",
        feedback 
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

    console.error("Create feedback error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // 데모 계정 지원 인증
    const user = await requireAuthWithDemo(request);

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 프로젝트 조회 및 권한 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        class: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인
    if (user.role === "STUDENT" && project.studentId !== user.id) {
      return NextResponse.json(
        { error: "프로젝트에 접근할 권한이 없습니다." },
        { status: 403 }
      );
    }

    if (user.role === "TEACHER" && project.class?.teacherId !== user.id) {
      return NextResponse.json(
        { error: "프로젝트에 접근할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 피드백 목록 조회
    const feedbacks = await prisma.feedback.findMany({
      where: { projectId },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ feedbacks }, { status: 200 });

  } catch (error) {
    console.error("Get feedbacks error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
