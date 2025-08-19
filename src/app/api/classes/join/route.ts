import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthWithDemo } from "@/lib/auth";
import { z } from "zod";

const joinClassSchema = z.object({
  classCode: z.string().min(5, "참여 코드는 5자리 이상이어야 합니다.").max(6),
});

export async function POST(request: NextRequest) {
  try {
    // 데모 계정 지원 인증 및 권한 확인
    const user = await requireAuthWithDemo(request, ["STUDENT"]);

    if (!user) {
      return NextResponse.json(
        { error: "학생 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = joinClassSchema.parse(body);

    // 클래스 코드 유효성 확인
    const targetClass = await prisma.class.findUnique({
      where: { classCode: validatedData.classCode.toUpperCase() },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!targetClass) {
      return NextResponse.json(
        { error: "유효하지 않은 참여 코드입니다." },
        { status: 404 }
      );
    }

    // 이미 참여 여부 확인
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: user.id,
          classId: targetClass.id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "이미 참여하고 있는 클래스입니다." },
        { status: 400 }
      );
    }

    // 클래스 등록
    const enrollment = await prisma.classEnrollment.create({
      data: {
        studentId: user.id,
        classId: targetClass.id,
      },
    });

    return NextResponse.json(
      { 
        message: "클래스에 성공적으로 참여했습니다.",
        class: {
          ...targetClass,
          enrollment,
        }
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

    console.error("Join class error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
