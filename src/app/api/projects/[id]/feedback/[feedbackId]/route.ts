import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    const { id: projectId, feedbackId } = await params;
    
    // Supabase Auth를 통한 인증 및 권한 확인
    const user = await requireAuth(["TEACHER"]);

    if (!user) {
      return NextResponse.json(
        { error: "교사 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 피드백 조회 및 권한 확인
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        project: {
          include: {
            class: {
              select: {
                teacherId: true,
              },
            },
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "피드백을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (feedback.project.id !== projectId) {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    // 권한 확인: 피드백을 작성한 교사이거나 해당 클래스의 담당 교사인지 확인
    if (feedback.teacherId !== user.id && feedback.project.class?.teacherId !== user.id) {
      return NextResponse.json(
        { error: "이 피드백을 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 피드백 삭제
    await prisma.feedback.delete({
      where: { id: feedbackId },
    });

    return NextResponse.json(
      { message: "피드백이 성공적으로 삭제되었습니다." },
      { status: 200 }
    );

  } catch (error) {
    console.error("Delete feedback error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
