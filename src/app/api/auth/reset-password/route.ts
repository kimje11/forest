import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from '@supabase/ssr';
import crypto from "crypto";

const resetPasswordSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "입력 데이터가 올바르지 않습니다.", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // 데모 계정인지 확인
    if (email.includes("@demo.com")) {
      // 데모 계정의 경우 간단한 토큰 생성
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15분 후 만료

      // 토큰을 임시 저장 (실제로는 데이터베이스나 Redis 사용)
      // 여기서는 간단히 응답에 포함
      return NextResponse.json({
        message: "데모 계정의 비밀번호 재설정 링크입니다.",
        resetUrl: `/auth/reset-password/confirm?token=${resetToken}&email=${encodeURIComponent(email)}`,
        isDemoAccount: true,
      });
    }

    // Supabase 서버 클라이언트로 비밀번호 재설정 이메일 발송
    try {
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
      
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      
      console.log("Attempting to send password reset email to:", email);
      console.log("Redirect URL:", `${siteUrl}/auth/reset-password/confirm`);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/reset-password/confirm`,
      });

      if (error) {
        console.error("Supabase password reset error:", error);
        
        // 보안상 사용자가 존재하지 않아도 성공 메시지 반환 (실제로는 이메일이 발송되지 않음)
        return NextResponse.json({
          message: "비밀번호 재설정 링크가 이메일로 발송되었습니다. 이메일을 확인해주세요.",
        });
      }

      console.log("Password reset email sent successfully");
      
      return NextResponse.json({
        message: "비밀번호 재설정 링크가 이메일로 발송되었습니다. 이메일을 확인해주세요.",
      });

    } catch (supabaseError) {
      console.error("Supabase connection error:", supabaseError);
      
      return NextResponse.json({
        error: "이메일 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
