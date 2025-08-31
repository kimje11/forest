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

    // 데모 계정도 실제 데이터베이스 사용
    if (false) { // 더 이상 하드코딩된 데이터를 사용하지 않음
      const demoTemplates = [
        {
          id: 'demo-template-1',
          title: '자유 탐구 템플릿',
          description: '학생들이 자유롭게 탐구할 수 있는 기본 템플릿입니다.',
          isDefault: true,
          teacher: {
            id: 'demo-teacher-system',
            name: '시스템'
          },
          steps: [
            {
              id: 'demo-step-1',
              title: '탐구 주제 선정',
              description: '관심 있는 탐구 주제를 선정해보세요.',
              order: 1,
              isRequired: true,
              components: [
                {
                  id: 'demo-comp-1',
                  type: 'TEXT',
                  label: '탐구 주제',
                  placeholder: '탐구하고 싶은 주제를 입력하세요',
                  required: true,
                  order: 1,
                  options: null
                }
              ]
            },
            {
              id: 'demo-step-2',
              title: '탐구 계획 수립',
              description: '어떻게 탐구할지 계획을 세워보세요.',
              order: 2,
              isRequired: true,
              components: [
                {
                  id: 'demo-comp-2',
                  type: 'TEXTAREA',
                  label: '탐구 계획',
                  placeholder: '탐구 방법과 절차를 상세히 작성하세요',
                  required: true,
                  order: 1,
                  options: null
                }
              ]
            }
          ],
          _count: {
            projects: 5
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // 교사인 경우 추가 템플릿 제공
      if (user.role === "TEACHER") {
        const subjectTemplates = {
          'demo-teacher-physics': [
            {
              id: 'demo-physics-template',
              title: '물리 실험 보고서',
              description: '물리 실험 결과를 정리하는 템플릿입니다.',
              isDefault: false,
              teacher: {
                id: user.id,
                name: user.name
              },
              steps: [
                {
                  id: 'physics-step-1',
                  title: '실험 목적',
                  description: '실험의 목적을 명확히 하세요.',
                  order: 1,
                  isRequired: true,
                  components: [
                    {
                      id: 'physics-comp-1',
                      type: 'TEXTAREA',
                      label: '실험 목적',
                      placeholder: '이 실험을 통해 알아보고자 하는 것을 작성하세요',
                      required: true,
                      order: 1,
                      options: null
                    }
                  ]
                }
              ],
              _count: { projects: 3 },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          'demo-teacher-chemistry': [
            {
              id: 'demo-chemistry-template',
              title: '화학 실험 보고서',
              description: '화학 실험 결과를 정리하는 템플릿입니다.',
              isDefault: false,
              teacher: {
                id: user.id,
                name: user.name
              },
              steps: [
                {
                  id: 'chemistry-step-1',
                  title: '화학 반응식',
                  description: '실험에서 일어난 화학 반응을 정리하세요.',
                  order: 1,
                  isRequired: true,
                  components: [
                    {
                      id: 'chemistry-comp-1',
                      type: 'TEXTAREA',
                      label: '화학 반응식',
                      placeholder: '화학 반응식을 작성하세요',
                      required: true,
                      order: 1,
                      options: null
                    }
                  ]
                }
              ],
              _count: { projects: 4 },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          'demo-teacher-math': [
            {
              id: 'demo-math-template',
              title: '수학 탐구 보고서',
              description: '수학적 탐구 과정을 정리하는 템플릿입니다.',
              isDefault: false,
              teacher: {
                id: user.id,
                name: user.name
              },
              steps: [
                {
                  id: 'math-step-1',
                  title: '탐구 문제',
                  description: '수학적으로 탐구할 문제를 정의하세요.',
                  order: 1,
                  isRequired: true,
                  components: [
                    {
                      id: 'math-comp-1',
                      type: 'TEXTAREA',
                      label: '탐구 문제',
                      placeholder: '수학적 탐구 문제를 작성하세요',
                      required: true,
                      order: 1,
                      options: null
                    }
                  ]
                }
              ],
              _count: { projects: 2 },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        };

        if (subjectTemplates[user.id as keyof typeof subjectTemplates]) {
          demoTemplates.push(...subjectTemplates[user.id as keyof typeof subjectTemplates]);
        }
      }

      return NextResponse.json({ templates: demoTemplates }, { status: 200 });
    }

    // 실제 데이터베이스 사용 (정상적인 환경에서)
    let templates: any[] = [];

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
    // 데이터베이스 연결 실패 시 빈 배열 반환 (에러 대신)
    console.log("Database connection failed, returning empty templates array");
    return NextResponse.json({ templates: [] }, { status: 200 });
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
