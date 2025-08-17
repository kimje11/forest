import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["TEACHER", "ADMIN"]);
    
    if (!user) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 기본 통계
    const userCount = await prisma.user.count();
    const teacherCount = await prisma.user.count({ where: { role: 'TEACHER' } });
    const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    const classCount = await prisma.class.count();
    const enrollmentCount = await prisma.classEnrollment.count();
    const projectCount = await prisma.project.count();
    const templateCount = await prisma.template.count();

    // 클래스별 상세 정보
    const classes = await prisma.class.findMany({
      include: {
        teacher: { select: { name: true } },
        _count: {
          select: {
            enrollments: true,
            projects: true,
          },
        },
      },
    });

    // 등록 정보
    const enrollments = await prisma.classEnrollment.findMany({
      include: {
        student: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    // 프로젝트 정보
    const projects = await prisma.project.findMany({
      include: {
        student: { select: { name: true } },
        class: { select: { name: true } },
        template: { select: { title: true } },
      },
    });

    // 템플릿 정보
    const templates = await prisma.template.findMany({
      include: {
        teacher: { select: { name: true } },
      },
    });

    return NextResponse.json({
      summary: {
        userCount,
        teacherCount,
        studentCount,
        classCount,
        enrollmentCount,
        projectCount,
        templateCount,
      },
      classes,
      enrollments,
      projects,
      templates,
    });

  } catch (error) {
    console.error("Debug data error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
