import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Supabase Auth를 통한 인증 및 권한 확인
    const user = await requireAuth(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 시스템 통계 조회
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalClasses,
      totalTemplates,
      totalProjects,
      activeProjects,
      completedProjects,
      recentSignups
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.class.count(),
      prisma.template.count(),
      prisma.project.count(),
      prisma.project.count({ 
        where: { 
          status: { in: ["IN_PROGRESS", "DRAFT"] } 
        } 
      }),
      prisma.project.count({ where: { status: "COMPLETED" } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 최근 7일
          }
        }
      })
    ]);

    const stats = {
      totalUsers,
      totalTeachers,
      totalStudents,
      totalClasses,
      totalTemplates,
      totalProjects,
      activeProjects,
      completedProjects,
      recentSignups,
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("Get admin stats error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
