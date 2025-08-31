import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("Demo login API called");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log("VERCEL:", process.env.VERCEL);
    console.log("VERCEL_ENV:", process.env.VERCEL_ENV);
    
    // Vercel 환경에서 환경 변수 확인
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not set in Vercel environment");
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 누락되었습니다.' },
        { status: 500 }
      );
    }
    
    const { email, password } = await request.json();

    if (!email || !password) {
      console.log("Missing email or password");
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 데모 계정인지 확인 (demo.com 도메인)
    if (!email.endsWith('@demo.com')) {
      console.log("Not a demo account:", email);
      return NextResponse.json(
        { error: '데모 계정이 아닙니다.' },
        { status: 400 }
      );
    }

    console.log(`Demo login attempt: ${email}`);
    
    // 1. 먼저 Supabase Auth에서 사용자 확인
    const supabase = createClient();
    let supabaseUser = null;
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        console.log("Supabase Auth error:", authError.message);
        // Supabase Auth에서 실패하면 Prisma 데이터베이스로 진행
      } else if (authData.user) {
        supabaseUser = authData.user;
        console.log("Supabase Auth user found:", supabaseUser.email);
      }
    } catch (supabaseError) {
      console.log("Supabase Auth connection error:", supabaseError);
      // Supabase 연결 실패 시 Prisma 데이터베이스로 진행
    }
    
    // 2. Prisma 데이터베이스에서 사용자 확인
    let user = null;
    try {
      await prisma.$connect();
      console.log("Database connection successful");
      
      const dbUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (dbUser) {
        // Prisma 데이터베이스에 사용자가 있으면 비밀번호 검증
        const isValidPassword = await bcrypt.compare(password, dbUser.password);
        if (isValidPassword) {
          user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role
          };
          console.log(`Database user authenticated: ${user.name}`);
        }
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
    }
    
    // 3. Supabase Auth에만 사용자가 있는 경우 Prisma 데이터베이스에 동기화
    if (supabaseUser && !user) {
      console.log("Syncing Supabase user to Prisma database...");
      try {
        const demoUserData: Record<string, any> = {
          'teacher1@demo.com': {
            name: '교사1',
            role: 'TEACHER'
          },
          'teacher2@demo.com': {
            name: '교사2',
            role: 'TEACHER'
          },
          'student1@demo.com': {
            name: '학생1',
            role: 'STUDENT'
          },
          'student2@demo.com': {
            name: '학생2',
            role: 'STUDENT'
          },
          'student3@demo.com': {
            name: '학생3',
            role: 'STUDENT'
          },
          'student4@demo.com': {
            name: '학생4',
            role: 'STUDENT'
          },
          'student5@demo.com': {
            name: '학생5',
            role: 'STUDENT'
          },
          'student6@demo.com': {
            name: '학생6',
            role: 'STUDENT'
          }
        };
        
        const userData = demoUserData[email as keyof typeof demoUserData];
        if (userData) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const newUser = await prisma.user.create({
            data: {
              id: supabaseUser.id, // Supabase Auth의 ID 사용
              email: supabaseUser.email!,
              name: userData.name,
              password: hashedPassword,
              role: userData.role as any,
            }
          });
          
          user = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
          };
          
          console.log(`User synced to database: ${user.name}`);
        }
      } catch (syncError) {
        console.error("User sync error:", syncError);
        // 동기화 실패 시 Supabase 사용자 정보 사용
        const userData = {
          'teacher1@demo.com': { name: '교사1', role: 'TEACHER' },
          'teacher2@demo.com': { name: '교사2', role: 'TEACHER' },
          'student1@demo.com': { name: '학생1', role: 'STUDENT' },
          'student2@demo.com': { name: '학생2', role: 'STUDENT' },
          'student3@demo.com': { name: '학생3', role: 'STUDENT' },
          'student4@demo.com': { name: '학생4', role: 'STUDENT' },
          'student5@demo.com': { name: '학생5', role: 'STUDENT' },
          'student6@demo.com': { name: '학생6', role: 'STUDENT' }
        };
        
        const fallbackData = userData[email as keyof typeof userData];
        if (fallbackData) {
          user = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name: fallbackData.name,
            role: fallbackData.role
          };
          console.log(`Using fallback user data: ${user.name}`);
        }
      }
    }
    
    // 4. 둘 다 없는 경우 새로 생성
    if (!user && !supabaseUser) {
      console.log("Creating new demo user...");
      const demoUserData: Record<string, any> = {
        'teacher1@demo.com': {
          id: 'demo-teacher-1',
          email: 'teacher1@demo.com',
          name: '교사1',
          role: 'TEACHER',
          password: '123'
        },
        'teacher2@demo.com': {
          id: 'demo-teacher-2',
          email: 'teacher2@demo.com',
          name: '교사2',
          role: 'TEACHER',
          password: '123'
        },
        'student1@demo.com': {
          id: 'demo-student-1',
          email: 'student1@demo.com',
          name: '학생1',
          role: 'STUDENT',
          password: '123'
        },
        'student2@demo.com': {
          id: 'demo-student-2',
          email: 'student2@demo.com',
          name: '학생2',
          role: 'STUDENT',
          password: '123'
        },
        'student3@demo.com': {
          id: 'demo-student-3',
          email: 'student3@demo.com',
          name: '학생3',
          role: 'STUDENT',
          password: '123'
        },
        'student4@demo.com': {
          id: 'demo-student-4',
          email: 'student4@demo.com',
          name: '학생4',
          role: 'STUDENT',
          password: '123'
        },
        'student5@demo.com': {
          id: 'demo-student-5',
          email: 'student5@demo.com',
          name: '학생5',
          role: 'STUDENT',
          password: '123'
        },
        'student6@demo.com': {
          id: 'demo-student-6',
          email: 'student6@demo.com',
          name: '학생6',
          role: 'STUDENT',
          password: '123'
        }
      };
      
      const userData = demoUserData[email as keyof typeof demoUserData];
      if (userData) {
        try {
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          const newUser = await prisma.user.create({
            data: {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              password: hashedPassword,
              role: userData.role as any,
            }
          });
          
          user = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
          };
          
          console.log(`New demo user created: ${user.name}`);
        } catch (createError) {
          console.error("User creation error:", createError);
          return NextResponse.json(
            { error: '사용자 생성 중 오류가 발생했습니다.' },
            { status: 500 }
          );
        }
      }
    }

    if (!user) {
      console.log("No user found or created");
      return NextResponse.json(
        { error: '유효하지 않은 데모 계정입니다.' },
        { status: 400 }
      );
    }

    console.log(`Login successful for ${email}`);

    // 성공적인 로그인 - 쿠키 설정
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // 데모 사용자 정보를 쿠키에 저장
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    
    console.log("Cookie settings - Production:", isProduction, "Vercel:", isVercel);
    
    // Vercel 환경에서는 쿠키 설정을 더 안전하게
    const cookieOptions = {
      path: '/',
      httpOnly: false, // 클라이언트에서 접근 가능하도록
      secure: isProduction || isVercel, // Vercel에서는 HTTPS이므로 true
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7 // 7일
    };
    
    response.cookies.set('demoUser', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }), cookieOptions);

    console.log("Cookie set successfully");
    return response;

  } catch (error) {
    console.error('Demo login error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json(
      { 
        error: '로그인 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Prisma disconnect error:', disconnectError);
    }
  }
}
