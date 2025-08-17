import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, name, role } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "이메일, 이름, 역할이 모두 필요합니다." },
        { status: 400 }
      );
    }

    // Supabase에서 사용자 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 현재 로그인한 사용자 확인 (클라이언트에서 호출되므로)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    if (user.email !== email) {
      return NextResponse.json(
        { error: "이메일이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 데이터베이스에 사용자 생성 또는 업데이트
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role
      },
      create: {
        id: user.id,
        email,
        name,
        password: '', // Supabase Auth 사용
        role
      }
    });

    console.log('사용자 동기화 완료:', dbUser.email, dbUser.role);

    return NextResponse.json({
      message: "사용자 정보가 동기화되었습니다.",
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role
      }
    }, { status: 200 });

  } catch (error) {
    console.error("사용자 동기화 오류:", error);
    return NextResponse.json(
      { 
        error: "사용자 동기화 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
