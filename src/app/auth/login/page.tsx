"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setErrors({ form: "이메일과 비밀번호를 입력해주세요." });
      return;
    }

    setIsLoading(true);

    try {
      // 데모 계정인지 확인 (모든 @demo.com 이메일)
      const isDemoAccount = formData.email.endsWith('@demo.com');
      
      if (isDemoAccount) {
        // 데모 계정 로그인 처리
        const response = await fetch('/api/auth/demo-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Demo login failed:', result);
          setErrors({ form: result.error || "로그인에 실패했습니다." });
          return;
        }

        console.log('Demo login successful:', result.user);
        
        // 데모 계정 로그인 성공 - 세션 저장 (localStorage와 쿠키 둘 다)
        localStorage.setItem('demoUser', JSON.stringify(result.user));
        
        // 쿠키 설정 (Vercel 환경 고려)
        const isProduction = process.env.NODE_ENV === 'production';
        const isVercel = window.location.hostname.includes('vercel.app');
        
        const cookieOptions = [
          `demoUser=${JSON.stringify(result.user)}`,
          'path=/',
          `max-age=${60 * 60 * 24 * 7}`, // 7일
          'sameSite=lax'
        ];
        
        if (isProduction || isVercel) {
          cookieOptions.push('secure');
        }
        
        document.cookie = cookieOptions.join('; ');
        
        // 역할에 따라 리다이렉트
        if (result.user.role === 'TEACHER') {
          router.push('/teacher/dashboard');
        } else if (result.user.role === 'STUDENT') {
          router.push('/student/dashboard');
        } else {
          router.push('/');
        }
        return;
      }

      // 일반 Supabase 계정 로그인
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Supabase login error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        if (error.message === 'Invalid login credentials') {
          setErrors({ form: "이메일 또는 비밀번호가 올바르지 않습니다." });
        } else if (error.message.includes('fetch')) {
          setErrors({ form: "Supabase 연결에 문제가 있습니다. 환경변수를 확인해주세요." });
        } else {
          setErrors({ form: `로그인 오류: ${error.message}` });
        }
        return;
      }

      if (data.user) {
        console.log('Supabase login successful:', data.user.email);
        
        // 사용자 정보를 데이터베이스에 동기화
        const userRole = data.user.user_metadata?.role || data.user.app_metadata?.role || "STUDENT";
        const userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || "사용자";
        
        try {
          await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.user.email,
              name: userName,
              role: userRole
            })
          });
        } catch (syncError) {
          console.error('사용자 동기화 오류:', syncError);
          // 동기화 실패해도 로그인은 계속 진행
        }
        
        // AuthProvider가 인증 상태를 감지할 시간을 주기 위해 잠시 대기
        setTimeout(() => {
          // 역할에 따라 대시보드로 리디렉션
          console.log('Redirecting based on role:', userRole);
          if (userRole === "TEACHER") {
            router.push("/teacher/dashboard");
          } else if (userRole === "STUDENT") {
            router.push("/student/dashboard");
          } else if (userRole === "ADMIN") {
            router.push("/admin/dashboard");
          } else {
            // 역할이 설정되지 않은 경우 기본적으로 학생으로 처리
            console.log('No role specified, defaulting to STUDENT');
            router.push("/student/dashboard");
          }
        }, 1000); // 1초로 증가
      }
    } catch (error) {
      setErrors({ form: "로그인 중 오류가 발생했습니다." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">탐구의 숲</CardTitle>
          <CardDescription>AI기반 자기주도 주제탐구학습 플랫폼</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{message}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="이메일을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            {errors.form && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.form}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            <div className="text-center space-y-2">
              <a 
                href="/auth/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </a>
              <div className="text-sm text-gray-600">
                계정이 없으신가요?{" "}
                <a 
                  href="/auth/register" 
                  className="text-blue-600 hover:text-blue-500 hover:underline"
                >
                  회원가입하기
                </a>
              </div>
            </div>

            {/* 심사용 데모 계정 정보 */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">🎓 데모 계정으로 체험하기</h3>
              <p className="text-xs text-blue-700 mb-3">
                아래 계정으로 로그인하시면 모든 기능을 체험하실 수 있습니다.
              </p>
              
              {/* 교사 계정들 */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">🧑‍🏫 교사 계정</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="bg-white p-3 rounded border hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-blue-700 mb-1">👨‍🏫 교사1</div>
                        <div className="text-gray-600">teacher1@demo.com</div>
                        <div className="text-gray-600">비밀번호: 123</div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({ email: 'teacher1@demo.com', password: '123' });
                          setErrors({});
                        }}
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                      >
                        사용하기
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-purple-700 mb-1">👨‍🏫 교사2</div>
                        <div className="text-gray-600">teacher2@demo.com</div>
                        <div className="text-gray-600">비밀번호: 123</div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({ email: 'teacher2@demo.com', password: '123' });
                          setErrors({});
                        }}
                        className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded transition-colors"
                      >
                        사용하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 학생 계정들 */}
              <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-700 mb-2">👨‍🎓 학생 계정</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="bg-white p-3 rounded border hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-green-700 mb-1">👨‍🎓 학생1</div>
                        <div className="text-gray-600">student1@demo.com</div>
                        <div className="text-gray-600">비밀번호: 123</div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({ email: 'student1@demo.com', password: '123' });
                          setErrors({});
                        }}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                      >
                        사용하기
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-green-700 mb-1">👨‍🎓 학생2</div>
                        <div className="text-gray-600">student2@demo.com</div>
                        <div className="text-gray-600">비밀번호: 123</div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({ email: 'student2@demo.com', password: '123' });
                          setErrors({});
                        }}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                      >
                        사용하기
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-green-700 mb-1">👨‍🎓 학생3</div>
                        <div className="text-gray-600">student3@demo.com</div>
                        <div className="text-gray-600">비밀번호: 123</div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({ email: 'student3@demo.com', password: '123' });
                          setErrors({});
                        }}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                      >
                        사용하기
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-green-700 mb-1">👨‍🎓 학생4</div>
                        <div className="text-gray-600">student4@demo.com</div>
                        <div className="text-gray-600">비밀번호: 123</div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({ email: 'student4@demo.com', password: '123' });
                          setErrors({});
                        }}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                      >
                        사용하기
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-green-700 mb-1">👨‍🎓 학생5</div>
                        <div className="text-gray-600">student5@demo.com</div>
                        <div className="text-gray-600">비밀번호: 123</div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({ email: 'student5@demo.com', password: '123' });
                          setErrors({});
                        }}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                      >
                        사용하기
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-green-700 mb-1">👨‍🎓 학생6</div>
                        <div className="text-gray-600">student6@demo.com</div>
                        <div className="text-gray-600">비밀번호: 123</div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({ email: 'student6@demo.com', password: '123' });
                          setErrors({});
                        }}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                      >
                        사용하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  💡 <strong>교사 계정</strong>으로 로그인하면 템플릿 생성, 클래스 관리, 학생 피드백 등의 기능을 체험할 수 있습니다.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💡 <strong>학생 계정</strong>으로 로그인하면 프로젝트 작성, 제출, 피드백 확인 등의 기능을 체험할 수 있습니다.
                </p>
              </div>
              

            </div>


          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
