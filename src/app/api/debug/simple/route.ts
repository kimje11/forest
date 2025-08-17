import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // 간단한 카운트만 확인
    const stats = {
      users: await prisma.user.count(),
      teachers: await prisma.user.count({ where: { role: 'TEACHER' } }),
      students: await prisma.user.count({ where: { role: 'STUDENT' } }),
      classes: await prisma.class.count(),
      enrollments: await prisma.classEnrollment.count(),
      projects: await prisma.project.count(),
      templates: await prisma.template.count(),
    };

    // 최근 프로젝트 몇 개만 확인
    const recentProjects = await prisma.project.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { name: true } },
        class: { select: { name: true } },
        template: { select: { title: true } },
      },
    });

    return NextResponse.json({
      stats,
      recentProjects,
      message: "데이터베이스 연결 성공"
    });

  } catch (error) {
    console.error("Simple debug error:", error);
    return NextResponse.json(
      { error: "데이터베이스 연결 실패", details: error },
      { status: 500 }
    );
  }
}
