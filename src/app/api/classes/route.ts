import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Supabase Auth를 통한 인증
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    let classes = [];

    if (user.role === "TEACHER") {
      // 교사가 개설한 클래스 목록
      classes = await prisma.class.findMany({
        where: { teacherId: user.id },
        include: {
          _count: {
            select: {
              enrollments: true,
              projects: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (user.role === "STUDENT") {
      // 학생이 참여한 클래스 목록
      const enrollments = await prisma.classEnrollment.findMany({
        where: { studentId: user.id },
        include: {
          class: {
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  enrollments: true,
                  projects: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      classes = enrollments.map(enrollment => ({
        ...enrollment.class,
        enrollmentDate: enrollment.createdAt,
      }));
    }

    return NextResponse.json({ classes }, { status: 200 });
  } catch (error) {
    console.error("Get classes error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: "서버 오류가 발생했습니다.", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
