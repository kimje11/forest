import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const updateInputSchema = z.object({
  stepId: z.string(),
  componentId: z.string(),
  value: z.string().optional(),
  fileUrl: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // Supabase Auth를 통한 인증
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 프로젝트 소유권 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (project.studentId !== user.id) {
      return NextResponse.json(
        { error: "프로젝트에 접근할 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateInputSchema.parse(body);

    // 입력 데이터 업데이트 또는 생성 (upsert)
    const input = await prisma.projectInput.upsert({
      where: {
        projectId_stepId_componentId: {
          projectId,
          stepId: validatedData.stepId,
          componentId: validatedData.componentId,
        },
      },
      update: {
        value: validatedData.value,
        fileUrl: validatedData.fileUrl,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        stepId: validatedData.stepId,
        componentId: validatedData.componentId,
        value: validatedData.value,
        fileUrl: validatedData.fileUrl,
      },
    });

    // 변경 이력 저장
    await prisma.inputHistory.create({
      data: {
        projectId,
        stepId: validatedData.stepId,
        componentId: validatedData.componentId,
        value: validatedData.value,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { 
        message: "입력이 저장되었습니다.",
        input 
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Update input error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
