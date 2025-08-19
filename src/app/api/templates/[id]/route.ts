import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAuthWithDemo } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    
    // 데모 계정을 포함한 인증
    const user = await requireAuthWithDemo(request);

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 템플릿 조회
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        steps: {
          include: {
            components: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인
    if (user.role === "TEACHER") {
      // 교사는 자신의 템플릿 또는 기본 템플릿만 조회 가능
      if (!template.isDefault && template.teacherId !== user.id) {
        return NextResponse.json(
          { error: "템플릿에 접근할 권한이 없습니다." },
          { status: 403 }
        );
      }
    } else if (user.role === "STUDENT") {
      // 학생은 기본 템플릿 또는 클래스 활동으로 공유된 템플릿만 접근 가능
      if (!template.isDefault) {
        // 교사 템플릿인 경우, 학생이 참여한 클래스에서 해당 템플릿이 활동으로 공유되었는지 확인
        const hasAccess = await prisma.classActivity.findFirst({
          where: {
            templateId: templateId,
            class: {
              enrollments: {
                some: {
                  studentId: user.id
                }
              }
            }
          }
        });

        if (!hasAccess) {
          return NextResponse.json(
            { error: "템플릿에 접근할 권한이 없습니다." },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({ template }, { status: 200 });
  } catch (error) {
    console.error("Get template error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    
    // Supabase Auth를 통한 인증 및 권한 확인
    const user = await requireAuth(["TEACHER"]);

    if (!user) {
      return NextResponse.json(
        { error: "교사 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 템플릿 조회 및 소유권 확인
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (template.teacherId !== user.id) {
      return NextResponse.json(
        { error: "템플릿을 수정할 권한이 없습니다." },
        { status: 403 }
      );
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: "기본 템플릿은 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description } = body;

    // 템플릿 업데이트
    const updatedTemplate = await prisma.template.update({
      where: { id: templateId },
      data: {
        title: title || template.title,
        description: description !== undefined ? description : template.description,
        updatedAt: new Date(),
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        steps: {
          include: {
            components: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        message: "템플릿이 수정되었습니다.",
        template: updatedTemplate 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    
    // Supabase Auth를 통한 인증 및 권한 확인
    const user = await requireAuth(["TEACHER"]);

    if (!user) {
      return NextResponse.json(
        { error: "교사 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 템플릿 조회 및 소유권 확인
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (template.teacherId !== user.id) {
      return NextResponse.json(
        { error: "템플릿을 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: "기본 템플릿은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 사용 중인 프로젝트가 있는지 확인
    if (template._count.projects > 0) {
      return NextResponse.json(
        { error: "사용 중인 프로젝트가 있어 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 템플릿 삭제 (연관된 steps와 components도 CASCADE로 삭제됨)
    await prisma.template.delete({
      where: { id: templateId },
    });

    return NextResponse.json(
      { message: "템플릿이 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
