import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // 클라이언트 연결 테스트
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Supabase URL:', supabaseUrl);
    console.log('Anon Key exists:', !!supabaseAnonKey);
    console.log('Service Key exists:', !!supabaseServiceKey);

    // 클라이언트 연결 테스트
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 연결 상태 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // 사용자 목록 가져오기 (Service Key가 있는 경우)
    let adminUsers = null;
    let adminUserError = null;
    
    if (supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      try {
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) {
          adminUserError = error.message;
        } else {
          adminUsers = users?.users?.filter(user => 
            user.email === 'admin@exploration-forest.com'
          ).map(user => ({
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata
          }));
        }
      } catch (err) {
        adminUserError = err instanceof Error ? err.message : String(err);
      }
    }

    // 로그인 테스트
    let loginTest = null;
    let loginError = null;
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@exploration-forest.com',
        password: 'admin123!@#'
      });
      
      if (error) {
        loginError = {
          message: error.message,
          status: error.status,
          name: error.name
        };
      } else {
        loginTest = {
          user_id: data.user?.id,
          email: data.user?.email,
          user_metadata: data.user?.user_metadata,
          app_metadata: data.user?.app_metadata
        };
        
        // 로그인 후 즉시 로그아웃 (테스트이므로)
        await supabase.auth.signOut();
      }
    } catch (err) {
      loginError = err instanceof Error ? err.message : String(err);
    }

    return NextResponse.json({
      message: "Supabase 연결 테스트 결과",
      connection: {
        url_configured: !!supabaseUrl,
        anon_key_configured: !!supabaseAnonKey,
        service_key_configured: !!supabaseServiceKey,
        session_error: sessionError?.message || null
      },
      admin_users: adminUsers,
      admin_user_error: adminUserError,
      login_test: loginTest,
      login_error: loginError
    }, { status: 200 });

  } catch (error) {
    console.error("Supabase 테스트 오류:", error);
    return NextResponse.json(
      { 
        error: "Supabase 테스트 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
