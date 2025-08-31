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
      const demoStudentsData = {
        'demo-class-physics-1': [
          {
            id: 'demo-student-1',
            name: '학생1',
            email: 'student1@demo.com',
            enrollmentDate: new Date().toISOString()
          },
          {
            id: 'demo-student-2',
            name: '학생2',
            email: 'student2@demo.com',
            enrollmentDate: new Date().toISOString()
          }
        ],
        'demo-class-chemistry-1': [
          {
            id: 'demo-student-3',
            name: '학생3',
            email: 'student3@demo.com',
            enrollmentDate: new Date().toISOString()
          },
          {
            id: 'demo-student-4',
            name: '학생4',
            email: 'student4@demo.com',
            enrollmentDate: new Date().toISOString()
          }
        ],
        'demo-class-math-1': [
          {
            id: 'demo-student-5',
            name: '학생5',
            email: 'student5@demo.com',
            enrollmentDate: new Date().toISOString()
          },
          {
            id: 'demo-student-6',
            name: '학생6',
            email: 'student6@demo.com',
            enrollmentDate: new Date().toISOString()
          }
        ]
      };

      const students = demoStudentsData[classId as keyof typeof demoStudentsData] || [];
      
      return NextResponse.json({ students }, { status: 200 });
    }

    // 실제 데이터베이스에서 학생 목록 조회
    const enrollments = await prisma.classEnrollment.findMany({
      where: { 
        classId: classId,
        class: {
          teacherId: user.id // 교사 본인의 클래스만 조회 가능
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const students = enrollments.map(enrollment => ({
      id: enrollment.student.id,
      name: enrollment.student.name,
      email: enrollment.student.email,
      enrollmentDate: enrollment.createdAt,
    }));

    return NextResponse.json({ students }, { status: 200 });
  } catch (error) {
    console.error("Get class students error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
