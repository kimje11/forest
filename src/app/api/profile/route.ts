import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthWithDemo } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// 프로필 수정 스키마
const updateProfileSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").max(50, "이름은 50자 이하여야 합니다."),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(4, "비밀번호는 최소 4자리여야 합니다.").optional(),
});

// GET: 현재 사용자 프로필 조회
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithDemo(request);

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    console.log("Profile GET - User:", user);

    // 사용자 정보 조회 (비밀번호 제외)
    let profile = null;
    try {
      profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (prismaError) {
      console.error("Prisma error in GET:", prismaError);
      // Prisma 연결 실패 시 데모 계정으로 처리
    }

    // 데모 계정의 경우 쿠키에서 정보 가져오기
    if (!profile || user.email?.includes("@demo.com")) {
      return NextResponse.json({ 
        profile: {
          id: user.id,
          email: user.email,
          name: user.name,
  
          role: user.role,
          createdAt: new Date().toISOString(),
        }
      });
    }

    if (!profile) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 프로필 수정
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuthWithDemo(request);

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    console.log("Profile PUT - User:", user);

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "입력 데이터가 올바르지 않습니다.", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, currentPassword, newPassword } = validation.data;

    // 현재 사용자 정보 조회
    let currentUser = null;
    try {
      currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          password: true,
        },
      });
    } catch (prismaError) {
      console.error("Prisma error in PUT:", prismaError);
      // Prisma 연결 실패 시 데모 계정으로 처리
    }

    // 데모 계정의 경우 다른 처리
    if (!currentUser || user.email?.includes("@demo.com")) {
      // 데모 계정은 쿠키에 변경사항 저장
      const updatedDemoUser = {
        ...user,
        name: name,
        updatedAt: new Date().toISOString(),
      };

      // 새 비밀번호가 있으면 현재 비밀번호 확인 후 해시화해서 저장
      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "비밀번호를 변경하려면 현재 비밀번호를 입력해야 합니다." },
            { status: 400 }
          );
        }

        // 데모 계정의 현재 비밀번호 확인
        if (user.password) {
          const isValidPassword = await bcrypt.compare(currentPassword, user.password);
          if (!isValidPassword) {
            return NextResponse.json(
              { error: "현재 비밀번호가 일치하지 않습니다." },
              { status: 400 }
            );
          }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        updatedDemoUser.password = hashedPassword;
      }

      const response = NextResponse.json({ 
        message: "프로필이 성공적으로 업데이트되었습니다.",
        profile: {
          id: updatedDemoUser.id,
          email: updatedDemoUser.email,
          name: updatedDemoUser.name,

          role: updatedDemoUser.role,
          updatedAt: updatedDemoUser.updatedAt,
        }
      });

      // 업데이트된 사용자 정보를 쿠키에 저장
      response.cookies.set('demoUser', JSON.stringify(updatedDemoUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7일
      });

      return response;
    }

    if (!currentUser) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 비밀번호 변경 시 현재 비밀번호 확인
    let hashedNewPassword;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "새 비밀번호를 설정하려면 현재 비밀번호를 입력해주세요." },
          { status: 400 }
        );
      }

      // Supabase Auth 계정의 경우 Supabase를 통해 비밀번호 변경
      if (!user.email.includes("@demo.com")) {
        try {
          const supabase = await createServerSupabaseClient();
          
          // Supabase Auth를 통해 비밀번호 변경
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          });

          if (error) {
            console.error("Supabase password update error:", error);
            return NextResponse.json(
              { error: "비밀번호 변경 중 오류가 발생했습니다." },
              { status: 500 }
            );
          }

          // Supabase Auth에서 성공적으로 비밀번호가 변경되었으므로
          // Prisma 데이터베이스의 비밀번호 필드는 빈 문자열로 유지
          hashedNewPassword = "";
        } catch (supabaseError) {
          console.error("Supabase error in password update:", supabaseError);
          return NextResponse.json(
            { error: "비밀번호 변경 중 오류가 발생했습니다." },
            { status: 500 }
          );
        }
      } else {
        // 데모 계정의 경우 기존 로직 사용
        if (user.password) {
          const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
          if (!isCurrentPasswordValid) {
            return NextResponse.json(
              { error: "현재 비밀번호가 올바르지 않습니다." },
              { status: 400 }
            );
          }
        }

        // 새 비밀번호 해싱
        hashedNewPassword = await bcrypt.hash(newPassword, 12);
      }
    }

    // 프로필 업데이트
    const updateData: any = {
      name,
    };

    if (hashedNewPassword) {
      updateData.password = hashedNewPassword;
    }

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,

        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ 
      message: "프로필이 성공적으로 업데이트되었습니다.",
      profile: updatedProfile 
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
