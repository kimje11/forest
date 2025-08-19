import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAuthWithDemo } from "@/lib/auth";
import { z } from "zod";

const createTemplateSchema = z.object({
  title: z.string().min(1, "템플릿 제목을 입력해주세요."),
  description: z.string().nullable().optional(),
  steps: z.array(z.object({
    title: z.string().min(1, "단계 제목을 입력해주세요."),
    description: z.string().nullable().optional(),
    order: z.number(),
    isRequired: z.boolean().optional().default(false),
    components: z.array(z.object({
      type: z.enum(["TEXT", "TEXTAREA", "FILE_UPLOAD", "MULTIPLE_CHOICE", "CHECKBOX", "AI_TOPIC_HELPER"]),
      label: z.string().min(1, "컴포넌트 라벨을 입력해주세요."),
      placeholder: z.string().nullable().optional(),
      required: z.boolean().optional().default(false),
      order: z.number(),
      options: z.string().nullable().optional(), // JSON 형태로 저장될 선택지들
    })),
  })),
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

    let templates = [];

    if (user.role === "TEACHER") {
      // 교사가 생성한 템플릿 + 기본 템플릿
      templates = await prisma.template.findMany({
        where: {
          OR: [
            { teacherId: user.id },
            { isDefault: true }
          ]
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
        orderBy: [
          { isDefault: "desc" }, // 기본 템플릿 먼저
          { createdAt: "desc" },
        ],
      });
    } else {
      // 학생은 기본 템플릿만 조회 가능 (자유탐구용)
      templates = await prisma.template.findMany({
        where: {
          isDefault: true
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
        orderBy: [
          { createdAt: "desc" },
        ],
      });
    }

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Supabase Auth를 통한 인증 및 권한 확인
    const user = await requireAuthWithDemo(request, ["TEACHER"]);

    if (!user) {
      return NextResponse.json(
        { error: "교사 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // 트랜잭션으로 템플릿과 단계들을 한번에 생성
    const template = await prisma.$transaction(async (tx) => {
      // 템플릿 생성
      const newTemplate = await tx.template.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          teacherId: user.id,
        },
      });

      // 단계들 생성
      for (const stepData of validatedData.steps) {
        const step = await tx.templateStep.create({
          data: {
            templateId: newTemplate.id,
            title: stepData.title,
            description: stepData.description,
            order: stepData.order,
            isRequired: stepData.isRequired,
          },
        });

        // 컴포넌트들 생성
        for (const componentData of stepData.components) {
          await tx.templateComponent.create({
            data: {
              stepId: step.id,
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

      return newTemplate;
    });

    // 생성된 템플릿을 관계 데이터와 함께 반환
    const fullTemplate = await prisma.template.findUnique({
      where: { id: template.id },
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
        message: "템플릿이 성공적으로 생성되었습니다.",
        template: fullTemplate
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

    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
