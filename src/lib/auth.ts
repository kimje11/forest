import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return null;
    }

    // Supabase Auth 사용자와 Prisma User 모델 동기화
    let user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // 사용자가 Prisma 데이터베이스에 없으면 생성
    if (!user) {
      const userRole = authUser.user_metadata?.role || authUser.app_metadata?.role || 'STUDENT';
      
      user = await prisma.user.create({
        data: {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Unknown',
          password: '', // Supabase Auth를 사용하므로 비밀번호는 빈 문자열
          role: userRole,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    }

    if (user.status === "SUSPENDED") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

export async function requireAuth(allowedRoles?: string[]) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("인증이 필요합니다.");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("권한이 없습니다.");
  }

  return user;
}

// 데모 계정 지원을 위한 새로운 함수
export async function requireAuthWithDemo(request: any, allowedRoles?: string[]) {
  console.log("requireAuthWithDemo called");
  console.log("Environment:", process.env.NODE_ENV);
  console.log("VERCEL:", process.env.VERCEL);
  
  // 먼저 일반 인증 시도
  try {
    const user = await getCurrentUser();
    if (user) {
      console.log("Supabase user found:", user.email);
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        throw new Error("권한이 없습니다.");
      }
      return user;
    }
  } catch (error) {
    console.log("Supabase auth failed, checking demo account");
  }

  // 데모 계정 확인
  const demoUserCookie = request.cookies.get('demoUser')?.value;
  console.log("Demo user cookie:", demoUserCookie ? "found" : "not found");
  
  if (demoUserCookie) {
    try {
      const demoUser = JSON.parse(demoUserCookie);
      console.log("Demo user parsed:", demoUser.email);
      
      if (allowedRoles && !allowedRoles.includes(demoUser.role)) {
        console.log("Demo user role not allowed:", demoUser.role);
        throw new Error("권한이 없습니다.");
      }
      
      console.log("Returning demo user:", demoUser.email);
      return demoUser;
    } catch (e) {
      console.error("Demo user parsing error:", e);
    }
  }

  console.log("No valid authentication found");
  throw new Error("인증이 필요합니다.");
}

// Supabase Auth 사용자와 Prisma User 동기화
export async function syncUserWithSupabase(authUser: any) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (!existingUser) {
      const userRole = authUser.user_metadata?.role || 'STUDENT';
      
      await prisma.user.create({
        data: {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          password: '', // Supabase Auth 사용
          role: userRole,
        },
      });
    }
  } catch (error) {
    console.error("User sync error:", error);
  }
}