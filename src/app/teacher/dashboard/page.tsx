"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Plus, BarChart3, Copy, Settings } from "lucide-react";
import CreateClassModal from "@/components/modals/create-class-modal";
import PasswordVerificationModal from "@/components/ui/password-verification-modal";
import AuthHeader from "@/components/layout/auth-header";
import FeatureNote from "@/components/ui/feature-note";
import { safeUserName } from "@/utils/text-utils";

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
  const { user, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [templateCount, setTemplateCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // 인증 로딩 중이면 아무것도 하지 않음
    if (authLoading) {
      console.log("Auth loading, waiting...");
      return;
    }

    // 사용자가 없으면 로그인 페이지로 리다이렉트
    if (!user) {
      console.log("No user, redirecting to login");
      router.push("/auth/login");
      return;
    }

    // 사용자 역할 확인
    const userRole = (user as any)?.role;
    console.log("User role:", userRole);

    if (userRole === "TEACHER") {
      console.log("Teacher user confirmed, fetching data...");
      fetchClasses();
      fetchTemplates();
    } else if (userRole && userRole !== "TEACHER") {
      console.log("Wrong role, redirecting to login");
      // 잘못된 역할의 사용자는 로그인 페이지로 리다이렉트
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);



  const fetchClasses = async () => {
    try {
      console.log("Fetching classes...");
      const response = await fetch("/api/classes");
      console.log("Classes response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Classes data:", data);
        setClasses(data.classes);
      } else {
        const errorData = await response.json();
        console.error("Classes API error:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      console.log("Fetching templates...");
      const response = await fetch("/api/templates");
      console.log("Templates response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Templates data:", data);
        setTemplateCount(data.templates.length);
      } else {
        const errorData = await response.json();
        console.error("Templates API error:", errorData);
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



  // 인증 로딩 중일 때
  if (authLoading) {
    console.log("Auth loading, showing loading screen");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 사용자가 없을 때 (인증 로딩이 완료된 후)
  if (!user) {
    console.log("No user found after auth loading completed");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인이 필요합니다</p>
          <p className="text-sm text-gray-500 mt-2">잠시 후 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  // 데이터 로딩 중일 때 (인증은 완료됨)
  if (isLoading) {
    console.log("Data loading, showing loading screen");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader 
        title="교사 대시보드를 활용해보세요"
        subtitle={`안녕하세요, ${safeUserName((user as any)?.name || user?.email, '선생님')}님! 탐구 템플릿을 만들고 학생들의 탐구 활동을 관리해보세요.`}
      />
      
      {/* 추가 기능 버튼들 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex justify-end gap-4">
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
              <Button
                onClick={() => setShowPasswordModal(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                개인정보 수정
              </Button>
            </div>
          </div>
        </div>
      </div>

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
                    <div 
                      key={cls.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/teacher/classes/${cls.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{cls.name}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation(); // 부모 클릭 이벤트 방지
                            handleCopyCode(cls.classCode);
                          }}
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
                      <div className="mt-2 text-xs text-blue-600">
                        클릭하여 클래스 관리 →
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

      <PasswordVerificationModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => router.push("/teacher/profile")}
        title="개인정보 수정"
        description="개인정보 보호를 위해 현재 비밀번호를 입력해주세요."
      />
    </div>
  );
}
