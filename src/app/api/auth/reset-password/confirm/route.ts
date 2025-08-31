import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { z } from "zod";

const confirmResetSchema = z.object({
  password: z.string().min(6, "비밀번호는 최소 6자리여야 합니다."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = confirmResetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "입력 데이터가 올바르지 않습니다.", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { password } = validation.data;
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => 
              request.cookies.set(name, value)
            );
          },
        },
      }
    );

    // 새 비밀번호로 업데이트
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      console.error("Password update error:", error);
      return NextResponse.json(
        { error: "비밀번호 변경에 실패했습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "비밀번호가 성공적으로 변경되었습니다.",
    });

  } catch (error) {
    console.error("Confirm reset password API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
