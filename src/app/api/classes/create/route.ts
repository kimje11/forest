import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateClassCode } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const createClassSchema = z.object({
  name: z.string().min(1, "클래스명을 입력해주세요."),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Supabase Auth를 통한 인증 및 권한 확인
    const user = await requireAuth(["TEACHER"]);

    if (!user) {
      return NextResponse.json(
        { error: "교사 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createClassSchema.parse(body);

    // 고유한 클래스 코드 생성
    let classCode = generateClassCode();
    let isCodeUnique = false;
    let attempts = 0;

    while (!isCodeUnique && attempts < 10) {
      const existingClass = await prisma.class.findUnique({
        where: { classCode },
      });

      if (!existingClass) {
        isCodeUnique = true;
      } else {
        classCode = generateClassCode();
        attempts++;
      }
    }

    if (!isCodeUnique) {
      return NextResponse.json(
        { error: "클래스 코드 생성에 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 클래스 생성
    const newClass = await prisma.class.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        classCode,
        teacherId: user.id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        message: "클래스가 성공적으로 생성되었습니다.",
        class: newClass 
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

    console.error("Create class error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
