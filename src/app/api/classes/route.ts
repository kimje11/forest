import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAuthWithDemo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 데모 계정을 포함한 인증
    const user = await requireAuthWithDemo(request);

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
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // 각 클래스별로 해당 학생의 프로젝트 개수를 별도로 계산
      const classesWithProjectCount = await Promise.all(
        enrollments.map(async (enrollment) => {
          const projectCount = await prisma.project.count({
            where: {
              studentId: user.id,
              classId: enrollment.class.id,
            },
          });

          return {
            ...enrollment.class,
            enrollmentDate: enrollment.createdAt,
            _count: {
              ...enrollment.class._count,
              projects: projectCount,
            },
          };
        })
      );

      classes = classesWithProjectCount;
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
