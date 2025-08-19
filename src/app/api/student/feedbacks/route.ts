import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAuthWithDemo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 데모 계정을 포함한 인증 및 학생 권한 확인
    const user = await requireAuthWithDemo(request, ["STUDENT"]);

    if (!user) {
      return NextResponse.json(
        { error: "학생 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 학생의 모든 프로젝트에 대한 피드백 조회
    const feedbacks = await prisma.feedback.findMany({
      where: {
        project: {
          studentId: user.id,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        teacher: {
          select: {
            name: true,
          },
        },
        step: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ feedbacks }, { status: 200 });

  } catch (error) {
    console.error("Get student feedbacks error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
