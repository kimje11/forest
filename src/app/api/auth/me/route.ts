import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 먼저 일반 인증 확인
    let user = await getCurrentUser();

    // 데모 계정 확인
    if (!user) {
      const demoUserCookie = request.cookies.get('demoUser')?.value;
      if (demoUserCookie) {
        try {
          const demoUser = JSON.parse(demoUserCookie);
          // 데모 사용자 정보 반환
          user = demoUser;
        } catch (e) {
          // 쿠키 파싱 실패 시 무시
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

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
