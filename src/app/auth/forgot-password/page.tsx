"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    // 데모 계정 확인
    if (email.includes("@demo.com")) {
      setError("데모 계정의 비밀번호는 항상 '123'입니다. 비밀번호 재설정이 필요하지 않습니다.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        let errorMessage = data.error || "비밀번호 재설정 요청에 실패했습니다.";
        
        // 추가 세부 정보가 있으면 표시
        if (data.details) {
          errorMessage += `\n\n세부 정보: ${data.details}`;
        }
        
        if (data.fallback) {
          errorMessage += `\n\n대안: ${data.fallback}`;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                이메일을 확인해주세요
              </CardTitle>
              <CardDescription>
                비밀번호 재설정 링크가 발송되었습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  <strong>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.
                  이메일을 확인하고 링크를 클릭하여 새 비밀번호를 설정해주세요.
                </p>
                <p className="text-xs text-gray-500">
                  이메일이 도착하지 않았다면 스팸 폴더를 확인해주세요.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => setIsSuccess(false)}
                  variant="outline" 
                  className="w-full"
                >
                  다른 이메일로 재시도
                </Button>
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    로그인으로 돌아가기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              비밀번호 찾기
            </CardTitle>
            <CardDescription>
              가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 주소
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "발송 중..." : "비밀번호 재설정 링크 발송"}
              </Button>

              {/* 데모 계정 안내 */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  <strong>💡 데모 계정 안내:</strong><br />
                  모든 데모 계정(@demo.com)의 비밀번호는 <strong>'123'</strong>입니다.<br />
                  데모 계정은 비밀번호 재설정이 필요하지 않습니다.
                </p>
              </div>



              <div className="text-center">
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    로그인으로 돌아가기
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
