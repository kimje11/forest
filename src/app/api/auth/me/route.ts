import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Auth me API called");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("VERCEL:", process.env.VERCEL);
    
    // 먼저 일반 인증 확인
    let user = await getCurrentUser();
    console.log("Supabase user:", user ? user.email : "not found");

    // 데모 계정 확인
    if (!user) {
      const demoUserCookie = request.cookies.get('demoUser')?.value;
      console.log("Demo user cookie:", demoUserCookie ? "found" : "not found");
      
      if (demoUserCookie) {
        try {
          const demoUser = JSON.parse(demoUserCookie);
          console.log("Demo user parsed:", demoUser.email);
          // 데모 사용자 정보 반환
          user = demoUser;
        } catch (e) {
          console.error("Demo user parsing error:", e);
        }
      }
    }

    if (!user) {
      console.log("No valid user found");
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    console.log("Returning user:", user.email);
    return NextResponse.json(
      { user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
