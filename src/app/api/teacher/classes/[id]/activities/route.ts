import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    
    // Supabase Auth를 통한 인증 및 권한 확인
    const user = await requireAuth(["TEACHER"]);

    if (!user) {
      return NextResponse.json(
        { error: "교사 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 클래스 소유권 확인
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        activities: {
          include: {
            template: {
              include: {
                steps: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!classInfo) {
      return NextResponse.json(
        { error: "클래스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (classInfo.teacherId !== user.id) {
      return NextResponse.json(
        { error: "해당 클래스의 담당 교사가 아닙니다." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      class: {
        id: classInfo.id,
        name: classInfo.name,
        description: classInfo.description,
        teacher: classInfo.teacher,
        activities: classInfo.activities,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Get teacher class activities error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
