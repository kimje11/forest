"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function LoginForm() {
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
        
        // 역할에 따라 대시보드로 리디렉션
        if (userRole === "TEACHER") {
          router.push("/teacher/dashboard");
        } else if (userRole === "STUDENT") {
          router.push("/student/dashboard");
        } else if (userRole === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          // 역할이 설정되지 않은 경우 기본적으로 학생으로 처리
          router.push("/student/dashboard");
        }
        
        router.refresh();
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/auth/register")}
                className="text-sm text-blue-600 hover:underline"
              >
                계정이 없나요? 회원가입하기
              </button>
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
      <LoginForm />
    </Suspense>
  );
}
