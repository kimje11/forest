import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
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

    // 원본 템플릿 조회
    const originalTemplate = await prisma.template.findUnique({
      where: { id: templateId },
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

    if (!originalTemplate) {
      return NextResponse.json(
        { error: "복제할 템플릿을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 (기본 템플릿이거나 자신의 템플릿만 복제 가능)
    if (!originalTemplate.isDefault && originalTemplate.teacherId !== user.id) {
      return NextResponse.json(
        { error: "템플릿을 복제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 트랜잭션으로 템플릿 복제
    const duplicatedTemplate = await prisma.$transaction(async (tx) => {
      // 새 템플릿 생성
      const newTemplate = await tx.template.create({
        data: {
          title: `${originalTemplate.title} (복사본)`,
          description: originalTemplate.description,
          teacherId: user.id,
          isDefault: false,
        },
      });

      // 단계들 복제
      for (const step of originalTemplate.steps) {
        const newStep = await tx.templateStep.create({
          data: {
            templateId: newTemplate.id,
            title: step.title,
            description: step.description,
            order: step.order,
            isRequired: step.isRequired,
          },
        });

        // 컴포넌트들 복제
        for (const component of step.components) {
          await tx.templateComponent.create({
            data: {
              stepId: newStep.id,
              type: component.type,
              label: component.label,
              placeholder: component.placeholder,
              required: component.required,
              order: component.order,
              options: component.options,
            },
          });
        }
      }

      // 복제된 템플릿 전체 조회해서 반환
      return await tx.template.findUnique({
        where: { id: newTemplate.id },
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
    });

    return NextResponse.json(
      { 
        message: "템플릿이 복제되었습니다.",
        template: duplicatedTemplate 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Duplicate template error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
