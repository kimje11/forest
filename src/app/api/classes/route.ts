import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAuthWithDemo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Classes API called");
    
    // 데모 계정을 포함한 인증
    const user = await requireAuthWithDemo(request);

    if (!user) {
      console.log("No user found in classes API");
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }
    
    console.log("User authenticated:", user.email, user.role);

    // 데모 계정도 실제 데이터베이스 사용
    if (false) { // 더 이상 하드코딩된 데이터를 사용하지 않음
      let classes = [];

      if (user.role === "TEACHER") {
        // 교사별 클래스 데이터
        const teacherClasses = {
          'demo-teacher-physics': [
            {
              id: 'demo-class-physics-1',
              name: '물리학 실험반',
              description: '고등학교 물리 실험 수업',
              classCode: 'PHY001',
              teacherId: user.id,
              _count: {
                enrollments: 25,
                projects: 15
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          'demo-teacher-chemistry': [
            {
              id: 'demo-class-chemistry-1',
              name: '화학 탐구반',
              description: '고등학교 화학 탐구 수업',
              classCode: 'CHE001',
              teacherId: user.id,
              _count: {
                enrollments: 28,
                projects: 18
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          'demo-teacher-math': [
            {
              id: 'demo-class-math-1',
              name: '수학 탐구반',
              description: '고등학교 수학 탐구 수업',
              classCode: 'MAT001',
              teacherId: user.id,
              _count: {
                enrollments: 30,
                projects: 12
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        };

        classes = teacherClasses[user.id] || [];
      } else if (user.role === "STUDENT") {
        // 학생이 참여한 클래스 목록
        classes = [
          {
            id: 'demo-class-physics-1',
            name: '물리학 실험반',
            description: '고등학교 물리 실험 수업',
            classCode: 'PHY001',
            teacherId: 'demo-teacher-physics',
            teacher: {
              id: 'demo-teacher-physics',
              name: '김물리'
            },
            enrollmentDate: new Date().toISOString(),
            _count: {
              enrollments: 25,
              projects: 3 // 해당 학생의 프로젝트 수
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'demo-class-chemistry-1',
            name: '화학 탐구반',
            description: '고등학교 화학 탐구 수업',
            classCode: 'CHE001',
            teacherId: 'demo-teacher-chemistry',
            teacher: {
              id: 'demo-teacher-chemistry',
              name: '이화학'
            },
            enrollmentDate: new Date().toISOString(),
            _count: {
              enrollments: 28,
              projects: 2 // 해당 학생의 프로젝트 수
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }

      return NextResponse.json({ classes }, { status: 200 });
    }

    // 실제 데이터베이스 사용 (정상적인 환경에서)
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
