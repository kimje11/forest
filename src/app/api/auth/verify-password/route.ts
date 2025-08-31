import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithDemo } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

    // 일반 계정의 경우 Supabase Auth를 통해 비밀번호 확인
    try {
      const supabase = await createServerSupabaseClient();
      
      // Supabase Auth를 통해 비밀번호 확인
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (error) {
        console.error("Supabase password verification error:", error);
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않습니다." },
          { status: 401 }
        );
      }

      if (!data.user) {
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않습니다." },
          { status: 401 }
        );
      }

      return NextResponse.json({ success: true });

    } catch (supabaseError) {
      console.error("Supabase error in password verification:", supabaseError);
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

