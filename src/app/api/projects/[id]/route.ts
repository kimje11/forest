import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAuthWithDemo } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // 데모 계정을 포함한 인증
    const user = await requireAuthWithDemo(request);

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 프로젝트 조회
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        inputs: {
          include: {
            step: true,
            component: true,
          },
        },
        feedbacks: {
          include: {
            teacher: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
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
    if (user.role === "STUDENT") {
      if (project.studentId !== user.id) {
        return NextResponse.json(
          { error: "프로젝트에 접근할 권한이 없습니다." },
          { status: 403 }
        );
      }
    } else if (user.role === "TEACHER") {
      // 교사는 자신의 클래스 프로젝트만 조회 가능
      if (project.class) {
        const teacherClass = await prisma.class.findFirst({
          where: {
            id: project.classId!,
            teacherId: user.id,
          },
        });

        if (!teacherClass) {
          return NextResponse.json(
            { error: "프로젝트에 접근할 권한이 없습니다." },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "프로젝트에 접근할 권한이 없습니다." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
