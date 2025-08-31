import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthWithDemo } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuthWithDemo(request, ["TEACHER"]);

    if (!user) {
      return NextResponse.json(
        { error: "교사 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const classId = params.id;

    // 데모 계정도 실제 데이터베이스 사용
    if (false) { // 더 이상 하드코딩된 데이터를 사용하지 않음
      const demoClassData = {
        'demo-class-physics-1': {
          id: 'demo-class-physics-1',
          name: '물리학 실험반',
          description: '고등학교 물리 실험 수업',
          classCode: 'PHY01',
          teacherId: 'demo-teacher-physics',
          _count: {
            enrollments: 2,
            projects: 2
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        'demo-class-chemistry-1': {
          id: 'demo-class-chemistry-1',
          name: '화학 탐구반',
          description: '고등학교 화학 탐구 수업',
          classCode: 'CHE01',
          teacherId: 'demo-teacher-chemistry',
          _count: {
            enrollments: 2,
            projects: 2
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        'demo-class-math-1': {
          id: 'demo-class-math-1',
          name: '수학 탐구반',
          description: '고등학교 수학 탐구 수업',
          classCode: 'MAT01',
          teacherId: 'demo-teacher-math',
          _count: {
            enrollments: 2,
            projects: 2
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      const classData = demoClassData[classId as keyof typeof demoClassData];
      
      if (!classData) {
        return NextResponse.json(
          { error: "클래스를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ class: classData }, { status: 200 });
    }

    // 실제 데이터베이스에서 클래스 정보 조회
    const classData = await prisma.class.findUnique({
      where: { 
        id: classId,
        teacherId: user.id // 교사 본인의 클래스만 조회 가능
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            projects: true,
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "클래스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ class: classData }, { status: 200 });
  } catch (error) {
    console.error("Get class details error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
