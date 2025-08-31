import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("Demo login API called");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log("VERCEL:", process.env.VERCEL);
    console.log("VERCEL_ENV:", process.env.VERCEL_ENV);
    
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
    
    // 먼저 쿠키에서 업데이트된 사용자 정보 확인
    const demoUserCookie = request.cookies.get('demoUser')?.value;
    let user: any = null;
    
    if (demoUserCookie) {
      try {
        const demoUser = JSON.parse(demoUserCookie);
        if (demoUser.email === email) {
          user = demoUser;
          console.log(`Using updated demo user from cookie: ${user.name}`);
        }
      } catch (e) {
        console.log('Failed to parse demo user cookie');
      }
    }
    
    // 쿠키에 없으면 데이터베이스에서 데모 사용자 찾기
    if (!user) {
      try {
        console.log("Attempting to find user in database...");
        user = await prisma.user.findUnique({
          where: { email }
        });
        console.log("Database query result:", user ? "User found" : "User not found");
        
        // 사용자가 데이터베이스에 없으면 생성하고 관련 데이터도 함께 생성
        if (!user) {
          console.log("Creating demo user and related data in database...");
          const demoUserData: Record<string, any> = {
            'math@demo.com': {
              id: 'demo-teacher-math',
              email: 'math@demo.com',
              name: '김수학',
              role: 'TEACHER',
              password: '123'
            },
            'chemistry@demo.com': {
              id: 'demo-teacher-chemistry',
              email: 'chemistry@demo.com',
              name: '이화학',
              role: 'TEACHER',
              password: '123'
            },
            'physics@demo.com': {
              id: 'demo-teacher-physics',
              email: 'physics@demo.com',
              name: '박물리',
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
            }
          };
          
          const userData = demoUserData[email as keyof typeof demoUserData];
          if (userData) {
            // 트랜잭션으로 사용자와 관련 데이터를 함께 생성
            user = await prisma.$transaction(async (tx) => {
              // 사용자 생성
              const newUser = await tx.user.create({
                data: {
                  id: userData.id,
                  email: userData.email,
                  name: userData.name,
                  password: userData.password,
                  role: userData.role as any,
                }
              });

              // 교사인 경우 클래스와 템플릿 생성
              if (userData.role === 'TEACHER') {
                // 기본 템플릿도 함께 생성 (모든 사용자가 사용할 수 있도록)
                const defaultTemplate = await tx.template.upsert({
                  where: { id: 'demo-template-default' },
                  update: {},
                  create: {
                    id: 'demo-template-default',
                    title: '자유 탐구 템플릿',
                    description: '학생들이 자유롭게 탐구할 수 있는 기본 템플릿입니다.',
                    isDefault: true,
                    teacherId: 'demo-teacher-math'
                  }
                });

                // 기본 템플릿의 단계와 컴포넌트 생성
                const defaultStep = await tx.templateStep.upsert({
                  where: { id: 'demo-step-default' },
                  update: {},
                  create: {
                    id: 'demo-step-default',
                    title: '탐구 주제 선정',
                    description: '관심 있는 탐구 주제를 선정해보세요.',
                    order: 1,
                    isRequired: true,
                    templateId: defaultTemplate.id
                  }
                });

                await tx.templateComponent.upsert({
                  where: { id: 'demo-comp-default' },
                  update: {},
                  create: {
                    id: 'demo-comp-default',
                    type: 'TEXTAREA' as any,
                    label: '탐구 주제',
                    placeholder: '탐구하고 싶은 주제를 입력하세요',
                    required: true,
                    order: 1,
                    stepId: defaultStep.id
                  }
                });
                const classData = {
                  'demo-teacher-math': {
                    id: 'demo-class-math-1',
                    name: '수학 탐구반',
                    description: '수학적 사고력을 기르는 탐구 수업',
                    classCode: 'MATH01',
                    teacherId: userData.id
                  },
                  'demo-teacher-chemistry': {
                    id: 'demo-class-chemistry-1',
                    name: '화학 실험반',
                    description: '화학 실험을 통한 과학적 탐구',
                    classCode: 'CHEM01',
                    teacherId: userData.id
                  },
                  'demo-teacher-physics': {
                    id: 'demo-class-physics-1',
                    name: '물리 실험반',
                    description: '물리 원리를 실험으로 이해하기',
                    classCode: 'PHYS01',
                    teacherId: userData.id
                  }
                };

                const classInfo = classData[userData.id as keyof typeof classData];
                if (classInfo) {
                  await tx.class.upsert({
                    where: { id: classInfo.id },
                    update: {},
                    create: classInfo
                  });
                }

                // 기본 템플릿 생성
                const template = await tx.template.upsert({
                  where: { id: `demo-template-${userData.id}` },
                  update: {},
                  create: {
                    id: `demo-template-${userData.id}`,
                    title: `${userData.name}의 탐구 템플릿`,
                    description: `${userData.name} 교사가 만든 기본 탐구 템플릿입니다.`,
                    isDefault: false,
                    teacherId: userData.id
                  }
                });

                // 템플릿 단계 생성
                const step = await tx.templateStep.upsert({
                  where: { id: `demo-step-${userData.id}` },
                  update: {},
                  create: {
                    id: `demo-step-${userData.id}`,
                    title: '탐구 주제 선정',
                    description: '관심 있는 탐구 주제를 선정해보세요.',
                    order: 1,
                    isRequired: true,
                    templateId: template.id
                  }
                });

                // 템플릿 컴포넌트 생성
                await tx.templateComponent.upsert({
                  where: { id: `demo-comp-${userData.id}` },
                  update: {},
                  create: {
                    id: `demo-comp-${userData.id}`,
                    type: 'TEXTAREA' as any,
                    label: '탐구 주제',
                    placeholder: '탐구하고 싶은 주제를 입력하세요',
                    required: true,
                    order: 1,
                    stepId: step.id
                  }
                });
              }

              // 학생들을 클래스에 등록
              if (userData.role === 'STUDENT') {
                const enrollments = [
                  { studentId: 'demo-student-1', classId: 'demo-class-math-1' },
                  { studentId: 'demo-student-2', classId: 'demo-class-math-1' },
                  { studentId: 'demo-student-3', classId: 'demo-class-chemistry-1' },
                  { studentId: 'demo-student-4', classId: 'demo-class-physics-1' }
                ];

                for (const enrollment of enrollments) {
                  if (enrollment.studentId === userData.id) {
                    await tx.classEnrollment.upsert({
                      where: {
                        studentId_classId: {
                          studentId: enrollment.studentId,
                          classId: enrollment.classId
                        }
                      },
                      update: {},
                      create: enrollment
                    });
                    break;
                  }
                }
              }

              return newUser;
            });
            console.log("Demo user and related data created in database:", user.name);
          }
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // 데이터베이스 연결 실패 시 하드코딩된 데모 사용자 사용
        console.log("Using fallback demo users due to database error");
        const fallbackUsers: Record<string, any> = {
          'math@demo.com': {
            id: 'demo-teacher-math',
            email: 'math@demo.com',
            name: '김수학',
            role: 'TEACHER',
            password: '123' // 간단한 문자열로 변경
          },
          'chemistry@demo.com': {
            id: 'demo-teacher-chemistry',
            email: 'chemistry@demo.com',
            name: '이화학',
            role: 'TEACHER',
            password: '123'
          },
          'physics@demo.com': {
            id: 'demo-teacher-physics',
            email: 'physics@demo.com',
            name: '박물리',
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
          }
        };
        
        user = fallbackUsers[email as keyof typeof fallbackUsers];
      }
    }

    if (!user) {
      console.log(`User not found: ${email}`);
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`User found: ${user.name}`);
    
    // 비밀번호 확인
    console.log(`Checking password for ${email}`);
    console.log(`Input password: ${password}`);
    console.log(`Stored password: ${user.password}`);
    
    let passwordMatch = false;
    
    // 먼저 bcrypt로 시도
    if (user.password && user.password.startsWith('$2a$')) {
      try {
        passwordMatch = await bcrypt.compare(password, user.password);
        console.log(`Bcrypt comparison result: ${passwordMatch}`);
      } catch (bcryptError) {
        console.error("Bcrypt error:", bcryptError);
      }
    }
    
    // bcrypt가 실패하거나 해시가 아닌 경우 직접 비교
    if (!passwordMatch) {
      passwordMatch = (password === user.password);
      console.log(`Direct comparison result: ${passwordMatch}`);
    }
    
    if (!passwordMatch) {
      console.log(`Login failed for ${email}: password mismatch`);
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
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
        role: user.role,
        password: user.password // 비밀번호는 해시화된 상태로 유지
      }
    });

    // 데모 사용자 정보를 쿠키에 저장 (업데이트된 정보 포함)
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    
    console.log("Cookie settings - Production:", isProduction, "Vercel:", isVercel);
    console.log("User data to store in cookie:", {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
    
    // Vercel 환경에서는 쿠키 설정을 더 안전하게
    const cookieOptions = {
      path: '/',
      httpOnly: false, // 클라이언트에서 접근 가능하도록
      secure: isProduction || isVercel, // Vercel에서는 HTTPS이므로 true
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7 // 7일
    };
    
    console.log("Cookie options:", cookieOptions);
    
    response.cookies.set('demoUser', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      password: user.password // 비밀번호도 포함하여 다음 로그인 시 사용
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
