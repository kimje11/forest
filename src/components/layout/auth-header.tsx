"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { safeUserName } from "@/utils/text-utils";

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
  hideUserInfo?: boolean;
}

export default function AuthHeader({ 
  title, 
  subtitle, 
  hideUserInfo = false 
}: AuthHeaderProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      // 에러가 발생해도 로그인 페이지로 이동
      router.push("/auth/login");
      router.refresh();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* 왼쪽: 제목 및 부제목 */}
          <div className="flex-1">
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>

          {/* 오른쪽: 사용자 정보 및 로그아웃 */}
          <div className="flex items-center gap-4">
            {!hideUserInfo && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>{safeUserName((user as any).name || user.email)}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {(user as any).role === 'TEACHER' ? '교사' : (user as any).role === 'STUDENT' ? '학생' : '관리자'}
                </span>
              </div>
            )}
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
