import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const envStatus = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      database_url: !!process.env.DATABASE_URL,
      supabase_url_value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 50) + '...' : 'undefined',
      supabase_anon_key_value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 50) + '...' : 'undefined'
    };

    return NextResponse.json({
      message: "환경변수 상태 확인",
      env_status: envStatus,
      all_env_keys: Object.keys(process.env).filter(key => 
        key.includes('SUPABASE') || key.includes('DATABASE')
      )
    }, { status: 200 });

  } catch (error) {
    console.error("환경변수 확인 오류:", error);
    return NextResponse.json(
      { 
        error: "환경변수 확인 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
