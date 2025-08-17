import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { prisma } from "@/lib/prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Service role key로 Supabase 클라이언트 생성
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 관리자 계정 정보
    const adminEmail = 'admin@exploration-forest.com';
    const adminPassword = 'admin123!@#';

    console.log('관리자 계정 설정 시작...');

    // 1. Supabase Auth에 관리자 계정 생성
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      user_metadata: {
        name: '관리자',
        role: 'ADMIN'
      },
      email_confirm: true // 이메일 확인 생략
    });

    let supabaseResult = '';
    if (adminError) {
      if (adminError.message.includes('User already registered') || adminError.message.includes('already been registered')) {
        supabaseResult = '이미 존재하는 계정';
        console.log('관리자 계정이 이미 존재합니다.');
      } else {
        console.error('Supabase 관리자 계정 생성 오류:', adminError);
        supabaseResult = `오류: ${adminError.message}`;
      }
    } else if (adminUser.user) {
      console.log('Supabase 관리자 계정 생성 완료:', adminEmail);
      supabaseResult = '새로 생성됨';
    }

    // 2. Supabase에서 기존 사용자 확인 (다른 방법으로)
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(user => user.email === adminEmail);
    
    let adminUserId = '';
    if (existingAdmin) {
      adminUserId = existingAdmin.id;
      console.log('기존 관리자 계정 발견:', adminEmail, 'ID:', adminUserId);
    } else if (adminUser?.user) {
      adminUserId = adminUser.user.id;
    }

    // 3. Prisma 데이터베이스에 관리자 계정 동기화
    let prismaResult = '';
    if (adminUserId) {
      try {
        const dbUser = await prisma.user.upsert({
          where: { email: adminEmail },
          update: {
            role: 'ADMIN',
            name: '관리자'
          },
          create: {
            id: adminUserId,
            email: adminEmail,
            name: '관리자',
            password: '', // Supabase Auth 사용
            role: 'ADMIN'
          }
        });
        
        console.log('Prisma 데이터베이스 동기화 완료:', dbUser.email);
        prismaResult = '동기화 완료';
      } catch (prismaError) {
        console.error('Prisma 데이터베이스 동기화 오류:', prismaError);
        prismaResult = `오류: ${prismaError}`;
      }
    }

    // 4. 기본 교사 계정도 생성
    const teacherEmail = 'teacher@exploration-forest.com';
    const teacherPassword = 'teacher123!@#';

    const { data: teacherUser, error: teacherError } = await supabaseAdmin.auth.admin.createUser({
      email: teacherEmail,
      password: teacherPassword,
      user_metadata: {
        name: '기본 교사',
        role: 'TEACHER'
      },
      email_confirm: true
    });

    let teacherResult = '';
    if (teacherError) {
      if (teacherError.message.includes('User already registered') || teacherError.message.includes('already been registered')) {
        teacherResult = '이미 존재하는 계정';
      } else {
        teacherResult = `오류: ${teacherError.message}`;
      }
    } else if (teacherUser.user) {
      teacherResult = '새로 생성됨';
      
      // 교사 계정도 DB에 동기화
      await prisma.user.upsert({
        where: { email: teacherEmail },
        update: {
          role: 'TEACHER',
          name: '기본 교사'
        },
        create: {
          id: teacherUser.user.id,
          email: teacherEmail,
          name: '기본 교사',
          password: '',
          role: 'TEACHER'
        }
      });
    }

    return NextResponse.json({
      message: "관리자 계정 설정 완료",
      results: {
        admin: {
          email: adminEmail,
          password: adminPassword,
          supabase: supabaseResult,
          database: prismaResult,
          userId: adminUserId
        },
        teacher: {
          email: teacherEmail,
          password: teacherPassword,
          result: teacherResult
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error("관리자 설정 오류:", error);
    return NextResponse.json(
      { 
        error: "관리자 설정 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 관리자 계정 상태 확인
    const adminEmail = 'admin@exploration-forest.com';
    
    // 1. Prisma에서 관리자 계정 확인
    const dbAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // 2. Supabase에서 관리자 계정 확인
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    const supabaseAdminUser = users?.users?.find(user => user.email === adminEmail);

    return NextResponse.json({
      database: dbAdmin || null,
      supabase: supabaseAdminUser ? {
        id: supabaseAdminUser.id,
        email: supabaseAdminUser.email,
        created_at: supabaseAdminUser.created_at,
        user_metadata: supabaseAdminUser.user_metadata
      } : null,
      credentials: {
        email: adminEmail,
        password: 'admin123!@#'
      }
    }, { status: 200 });

  } catch (error) {
    console.error("관리자 상태 확인 오류:", error);
    return NextResponse.json(
      { 
        error: "관리자 상태 확인 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
