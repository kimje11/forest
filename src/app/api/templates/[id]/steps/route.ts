import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthWithDemo } from "@/lib/auth";
import { z } from "zod";

const componentSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  label: z.string(),
  placeholder: z.string().nullable().optional(),
  required: z.boolean(),
  order: z.number(),
  options: z.string().nullable().optional(),
});

const stepSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  order: z.number(),
  isRequired: z.boolean(),
  components: z.array(componentSchema),
});

const updateStepsSchema = z.object({
  steps: z.array(stepSchema),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    
    // 데모 계정 지원 인증 및 권한 확인
    const user = await requireAuthWithDemo(request, ["TEACHER"]);

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
    const validatedData = updateStepsSchema.parse(body);

    // 트랜잭션으로 단계들 업데이트
    const updatedTemplate = await prisma.$transaction(async (tx) => {
      // 기존 단계와 컴포넌트들 삭제
      await tx.templateComponent.deleteMany({
        where: {
          step: {
            templateId: templateId,
          },
        },
      });
      
      await tx.templateStep.deleteMany({
        where: { templateId: templateId },
      });

      // 새로운 단계들 생성
      for (const stepData of validatedData.steps) {
        const newStep = await tx.templateStep.create({
          data: {
            templateId: templateId,
            title: stepData.title,
            description: stepData.description,
            order: stepData.order,
            isRequired: stepData.isRequired,
          },
        });

        // 단계의 컴포넌트들 생성
        for (const componentData of stepData.components) {
          await tx.templateComponent.create({
            data: {
              stepId: newStep.id,
              type: componentData.type,
              label: componentData.label,
              placeholder: componentData.placeholder || null,
              required: componentData.required,
              order: componentData.order,
              options: componentData.options || null,
            },
          });
        }
      }

      // 업데이트된 템플릿 전체 조회
      return await tx.template.findUnique({
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
    });

    return NextResponse.json(
      { 
        message: "템플릿 단계가 업데이트되었습니다.",
        template: updatedTemplate 
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Update template steps error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
