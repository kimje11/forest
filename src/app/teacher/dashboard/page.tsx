"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Plus, BarChart3, Copy, Settings } from "lucide-react";
import CreateClassModal from "@/components/modals/create-class-modal";
import FeatureNote from "@/components/ui/feature-note";

interface ClassData {
  id: string;
  name: string;
  description?: string;
  classCode: string;
  createdAt: string;
  _count: {
    enrollments: number;
    projects: number;
  };
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [templateCount, setTemplateCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchClasses();
    fetchTemplates();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        if (data.user.role !== "TEACHER") {
          router.push("/auth/login");
          return;
        }
        setUser(data.user);
      } else {
        router.push("/auth/login");
      }
    } catch (error) {
      router.push("/auth/login");
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplateCount(data.templates.length);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const handleCopyCode = async (classCode: string) => {
    await navigator.clipboard.writeText(classCode);
    setCopiedCode(classCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleLogout = async () => {
    try {
      // 데모 계정 확인
      const demoUser = localStorage.getItem('demoUser');
      
      if (demoUser) {
        // 데모 계정 로그아웃 - localStorage와 쿠키 정리
        localStorage.removeItem('demoUser');
        document.cookie = 'demoUser=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        router.push("/auth/login");
        router.refresh();
        return;
      }
      
      // 일반 Supabase 계정 로그아웃
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/auth/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">교사 대시보드를 활용해보십시다</h1>
              <p className="text-gray-600">안녕하세요, {user.name}님! 탐구 템플릿을 만들고 학생들의 탐구 활동을 관리해보십시다.</p>
            </div>
            <div className="flex gap-4">
              <FeatureNote
                title="교사 대시보드 사용법"
                description="교사용 주요 기능들을 안내합니다"
                details={[
                  "클래스 관리: 새로운 클래스를 생성하고 학생들을 초대할 수 있습니다",
                  "템플릿 제작: AI 도우미를 활용하여 탐구 활동 템플릿을 만들 수 있습니다",
                  "학습 모니터링: 학생들의 탐구 진행 상황과 제출 현황을 확인할 수 있습니다",
                  "피드백 제공: 학생들의 탐구 활동에 대한 개별 피드백을 제공할 수 있습니다"
                ]}
                className="shrink-0"
              />
              <Button variant="outline" onClick={handleLogout}>로그아웃</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 통계 카드들 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">운영 중인 클래스</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">등록된 학생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {classes.reduce((total, cls) => total + cls._count.enrollments, 0)}
              </div>
              <p className="text-xs text-muted-foreground">명</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">탐구 템플릿</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templateCount}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행 중인 프로젝트</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {classes.reduce((total, cls) => total + cls._count.projects, 0)}
              </div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 클래스 관리 */}
          <Card>
            <CardHeader>
              <CardTitle>클래스 관리</CardTitle>
              <CardDescription>
                새로운 클래스를 개설하거나 기존 클래스를 관리하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                새 클래스 개설
              </Button>
              
              {classes.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  아직 개설된 클래스가 없습니다.
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {classes.map((cls) => (
                    <div key={cls.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{cls.name}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(cls.classCode)}
                        >
                          {copiedCode === cls.classCode ? (
                            "복사됨"
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              {cls.classCode}
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>학생 {cls._count.enrollments}명</span>
                        <span>프로젝트 {cls._count.projects}개</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 탐구 템플릿 */}
          <Card>
            <CardHeader>
              <CardTitle>탐구 템플릿</CardTitle>
              <CardDescription>
                탐구 활동을 위한 템플릿을 생성하고 관리하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push("/teacher/templates/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                새 템플릿 만들기
              </Button>
              <Button 
                className="w-full" 
                variant="ghost"
                onClick={() => router.push("/teacher/templates")}
              >
                템플릿 관리
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 모니터링 및 관리 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>탐구 활동 관리</CardTitle>
            <CardDescription>
              학생들의 탐구 활동을 모니터링하고 관리하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => router.push("/teacher/monitoring")}
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              실시간 모니터링
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => router.push("/teacher/projects")}
            >
              <BookOpen className="h-6 w-6 mb-2" />
              프로젝트 관리
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => router.push("/teacher/analytics")}
            >
              <Users className="h-6 w-6 mb-2" />
              학습 분석
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* 모달들 */}
      <CreateClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchClasses}
      />
    </div>
  );
}
