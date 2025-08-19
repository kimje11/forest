import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthWithDemo } from "@/lib/auth";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "IN_PROGRESS", "COMPLETED", "SUBMITTED"]),
});

export async function PUT(
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
    const validatedData = updateStatusSchema.parse(body);

    // 프로젝트 상태 업데이트
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: validatedData.status,
        updatedAt: new Date(),
      },
      include: {
        template: {
          select: {
            id: true,
            title: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            teacher: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 완료 상태로 변경 시 활동 로그 생성 (선택적)
    if (validatedData.status === "COMPLETED") {
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "PROJECT_COMPLETED",
            resource: "Project",
            resourceId: projectId,
            details: `프로젝트 "${updatedProject.title || '제목 없음'}"가 완료되었습니다.`,
          },
        });
      } catch (logError) {
        console.error("Failed to create audit log:", logError);
        // 로그 생성 실패해도 프로젝트 상태 업데이트는 성공으로 처리
      }
    }

    return NextResponse.json(
      { 
        message: "프로젝트 상태가 업데이트되었습니다.",
        project: updatedProject 
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

    console.error("Update project status error:", error);
    return NextResponse.json(
      { 
        error: "서버 오류가 발생했습니다.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
