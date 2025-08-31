import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithDemo } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const verifyPasswordSchema = z.object({
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithDemo(request);

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = verifyPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    // 데모 계정인 경우 쿠키에서 비밀번호 확인
    if (user.email?.includes("@demo.com")) {
      if (user.password) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return NextResponse.json(
            { error: "비밀번호가 일치하지 않습니다." },
            { status: 401 }
          );
        }
      } else {
        // 기본 데모 비밀번호 "123"과 비교
        if (password !== "123") {
          return NextResponse.json(
            { error: "비밀번호가 일치하지 않습니다." },
            { status: 401 }
          );
        }
      }
      
      return NextResponse.json({ success: true });
    }

    // 일반 계정의 경우 데이터베이스에서 비밀번호 확인
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          password: true,
        },
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: "사용자를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      const isValidPassword = await bcrypt.compare(password, currentUser.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않습니다." },
          { status: 401 }
        );
      }

      return NextResponse.json({ success: true });

    } catch (prismaError) {
      console.error("Prisma error in password verification:", prismaError);
      return NextResponse.json(
        { error: "서버 오류가 발생했습니다." },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Password verification error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

