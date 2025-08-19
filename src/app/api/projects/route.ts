import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAuthWithDemo } from "@/lib/auth";
import { z } from "zod";

const createProjectSchema = z.object({
  templateId: z.string().min(1, "템플릿을 선택해주세요."),
  classId: z.string().optional().nullable(),
  title: z.string().optional(),
});

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

    // URL 파라미터에서 classId 가져오기
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    let projects = [];

    if (user.role === "STUDENT") {
      // 학생의 프로젝트 목록
      const whereClause: any = { studentId: user.id };
      
      // classId가 제공된 경우 필터링
      if (classId) {
        whereClause.classId = classId;
      }

      projects = await prisma.project.findMany({
        where: whereClause,
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
        orderBy: { updatedAt: "desc" },
      });
    } else if (user.role === "TEACHER") {
      // 교사가 볼 수 있는 프로젝트들 (자신의 클래스)
      const teacherClasses = await prisma.class.findMany({
        where: { teacherId: user.id },
        select: { id: true },
      });

      const classIds = teacherClasses.map(c => c.id);

      projects = await prisma.project.findMany({
        where: { 
          classId: { in: classIds }
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
        orderBy: { updatedAt: "desc" },
      });
    }

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error("Get projects error:", error);
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

export async function POST(request: NextRequest) {
  try {
    // 데모 계정을 포함한 인증 및 권한 확인
    const user = await requireAuthWithDemo(request, ["STUDENT"]);

    if (!user) {
      return NextResponse.json(
        { error: "학생 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("Project creation request body:", body);
    const validatedData = createProjectSchema.parse(body);
    console.log("Validated data:", validatedData);

    // 템플릿 확인
    const template = await prisma.template.findUnique({
      where: { id: validatedData.templateId },
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
    });

    if (!template) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 클래스 확인 및 자동 할당
    let finalClassId = validatedData.classId;
    
    if (!finalClassId) {
      // classId가 없으면 학생의 첫 번째 클래스를 자동 할당
      const firstEnrollment = await prisma.classEnrollment.findFirst({
        where: { studentId: user.id },
        include: { class: true }
      });
      
      if (!firstEnrollment) {
        return NextResponse.json(
          { error: "참여중인 클래스가 없습니다. 먼저 클래스에 참여해주세요." },
          { status: 400 }
        );
      }
      
      finalClassId = firstEnrollment.classId;
    } else {
      // classId가 제공된 경우 권한 확인
      const enrollment = await prisma.classEnrollment.findUnique({
        where: {
          studentId_classId: {
            studentId: user.id,
            classId: finalClassId,
          },
        },
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: "해당 클래스에 참여하지 않았습니다." },
          { status: 403 }
        );
      }
    }

    // 프로젝트 생성
    const project = await prisma.project.create({
      data: {
        title: validatedData.title || `${template.title} - ${user.name}`,
        studentId: user.id,
        classId: finalClassId,
        templateId: template.id,
        status: "DRAFT",
      },
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
      },
    });

    return NextResponse.json(
      { 
        message: "탐구 프로젝트가 생성되었습니다.",
        project 
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
