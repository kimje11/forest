"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, Clock, Plus, User, Eye, RefreshCw, Brain, Settings } from "lucide-react";
import JoinClassModal from "@/components/modals/join-class-modal";
import ConceptHelper from "@/components/ai/concept-helper";
import PasswordVerificationModal from "@/components/ui/password-verification-modal";
import AuthHeader from "@/components/layout/auth-header";
import { safeUserName } from "@/utils/text-utils";
import FeatureNote from "@/components/ui/feature-note";

interface ClassData {
  id: string;
  name: string;
  description?: string;
  teacher: {
    name: string;
  };
  enrollmentDate: string;
  _count: {
    enrollments: number;
    projects: number;
  };
}

interface Feedback {
  id: string;
  content: string;
  createdAt: string;
  project: {
    id: string;
    title: string;
  };
  teacher: {
    name: string;
  };
  step?: {
    id: string;
    title: string;
    order: number;
  } | null;
}

export default function StudentDashboard() {
  console.log("StudentDashboard component rendered");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  console.log("Auth state:", { user: !!user, loading: authLoading, userRole: (user as any)?.role });
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    // 페이지 로드 시 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);
    
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

    if (userRole === "STUDENT") {
      console.log("Student user confirmed, fetching data...");
      fetchClasses();
      fetchProjects();
      fetchFeedbacks();
    } else if (userRole && userRole !== "STUDENT") {
      console.log("Wrong role, redirecting to login");
      // 잘못된 역할의 사용자는 로그인 페이지로 리다이렉트
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // 페이지가 다시 포커스될 때 프로젝트 목록 새로고침
  useEffect(() => {
    const handleFocus = () => {
      fetchProjects();
      fetchFeedbacks();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);



  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch("/api/student/feedbacks", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks);
      }
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
    }
  };

  // 데이터 로딩이 완료된 후 스크롤을 맨 위로 이동
  useEffect(() => {
    if (!authLoading && user && classes.length > 0) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤 조정
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }
  }, [authLoading, user, classes.length]);





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
        title="학생 대시보드에서 탐구를 시작해보세요"
        subtitle={`안녕하세요, ${safeUserName((user as any)?.name || user?.email)}님! AI 도우미를 활용하여 흥미로운 탐구 활동을 시작해보세요.`}
      />
      
      {/* 헤더 섹션 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* 왼쪽: 환영 메시지 */}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  탐구의 숲에 오신 것을 환영합니다!
                </h2>
                <p className="text-sm text-gray-600">
                  AI 도우미와 함께 흥미로운 탐구 활동을 시작해보세요
                </p>
              </div>
              
              {/* 오른쪽: 기능 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <FeatureNote
                  title="학생 대시보드 사용법"
                  description="학생용 주요 기능들을 안내합니다"
                  details={[
                    "📚 클래스 참여: 교사가 제공한 참여 코드로 클래스에 참여하여 탐구 활동을 시작할 수 있습니다",
                    "🔍 탐구 프로젝트: 템플릿 기반 또는 자유 주제로 탐구 프로젝트를 생성하고 관리할 수 있습니다",
                    "✏️ 수식 편집기: 수학 수식, 표, 이미지를 포함한 풍부한 내용을 작성할 수 있습니다",
                    "🤖 AI 개념 도우미: 대시보드 하단의 AI 도우미를 활용하여 탐구 주제와 개념을 분석받을 수 있습니다",
                    "📊 진행 상황: 초안, 진행중, 완료, 제출 상태별로 프로젝트 진행 상황을 한눈에 확인할 수 있습니다",
                    "💬 피드백 확인: 교사로부터 받은 피드백을 확인하고 프로젝트를 개선할 수 있습니다",
                    "⚙️ 개인정보 관리: 이름, 학번, 비밀번호를 안전하게 수정할 수 있습니다"
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
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* 통계 카드들 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">참여 중인 클래스</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행 중인 탐구</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {projects.filter(p => p.status === "DRAFT" || p.status === "IN_PROGRESS").length}
              </div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료 중인 탐구</CardTitle>
              <Trophy className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {projects.filter(p => p.status === "COMPLETED").length}
              </div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">제출한 탐구</CardTitle>
              <Trophy className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === "SUBMITTED").length}
              </div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">받은 피드백</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feedbacks.length}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 클래스 참여 */}
          <Card>
            <CardHeader>
              <CardTitle>클래스 참여</CardTitle>
              <CardDescription>
                교사가 제공한 참여 코드로 클래스에 참여하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full"
                onClick={() => setShowJoinModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                클래스 참여하기
              </Button>
              
              {classes.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  아직 참여한 클래스가 없습니다.
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {classes.map((cls) => (
                    <div 
                      key={cls.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/student/classes/${cls.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{cls.name}</h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <User className="h-3 w-3 mr-1" />
                          {cls.teacher.name}
                        </div>
                      </div>
                      {cls.description ? (
                        <p className="text-xs text-gray-600 mb-2">{cls.description}</p>
                      ) : null}
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>참여일: {new Date(cls.enrollmentDate).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          <span>프로젝트 {cls._count.projects}개</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/student/classes/${cls.id}`);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            활동보기
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 탐구 프로젝트 시작하기 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>탐구 프로젝트 시작하기</CardTitle>
                  <CardDescription>
                    클래스 활동이나 자유 주제로 탐구 프로젝트를 시작해보세요.
                  </CardDescription>
                </div>
                <FeatureNote
                  title="탐구 프로젝트 시작 방법"
                  description="효과적인 탐구 프로젝트 시작 방법을 안내합니다"
                  details={[
                    "클래스 활동: 참여한 클래스에서 제공하는 탐구 활동으로 시작해보세요",
                    "AI 도우미 활용: 하단의 AI 개념 도우미와 대화형 도우미로 주제를 탐색해보세요",
                    "자유 탐구: 관심 있는 주제나 궁금한 내용으로 자유롭게 탐구를 시작해보세요",
                    "포트폴리오 관리: 완성된 탐구는 포트폴리오에서 체계적으로 관리할 수 있습니다"
                  ]}
                  className="shrink-0"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* 기본 버튼들 */}
              <div className="space-y-3 pt-4 border-t">
                <Button 
                  className="w-full"
                  onClick={() => router.push("/student/explore")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  직접 탐구 시작하기
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push("/student/portfolio")}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  포트폴리오 보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI 탐구 도우미들 - 두 번째 행 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* AI 개념 탐구 도우미 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                AI 개념 탐구 도우미
              </CardTitle>
              <CardDescription>
                궁금한 질문을 입력하면 AI가 핵심 개념과 탐구 방향을 제안합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 min-h-[800px] flex flex-col">
                <p className="text-sm text-gray-600 mb-3">
                  클래스 활동과 연계하여 탐구 주제를 발견해보세요!
                </p>
                <div className="flex-1">
                  <ConceptHelper 
                    className="border-0 shadow-none bg-transparent p-0 h-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI 대화형 탐구 도우미 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI 대화형 탐구 도우미
              </CardTitle>
              <CardDescription>
                AI와 실시간 대화하며 탐구 주제를 깊이 있게 탐색해보세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 flex flex-col">
                <p className="text-sm text-gray-600 mb-3">
                  클래스에서 배운 내용과 연관된 질문을 해보세요!
                </p>
                <div className="rounded-lg overflow-hidden shadow-sm border">
                  <iframe 
                    src="https://getgpt.app/play/NVojbkcZsd/iframe" 
                    width="600" 
                    height="800" 
                    frameBorder="0"
                    className="w-full h-[800px]"
                    title="AI 탐구 챗봇"
                    style={{ minHeight: '800px' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 팁: 구체적인 질문을 하면 더 도움이 되는 답변을 받을 수 있어요!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 내 탐구 보고서 */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>내 탐구 보고서</CardTitle>
                <CardDescription>
                  저장된 탐구 보고서를 확인하고 계속 작업하세요.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchProjects();
                  fetchFeedbacks();
                }}
                className="shrink-0"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="mb-4">아직 작성한 탐구 보고서가 없습니다.</p>
                <Button onClick={() => router.push("/student/explore")}>
                  <Plus className="h-4 w-4 mr-2" />
                  새 탐구 시작하기
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 진행 중인 탐구 (DRAFT, IN_PROGRESS) */}
                {(() => {
                  const inProgressProjects = projects.filter(p => p.status === "DRAFT" || p.status === "IN_PROGRESS");
                  if (inProgressProjects.length === 0) return null;
                  
                  return (
                    <div key="in-progress-section">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        진행 중인 탐구 ({inProgressProjects.length}개)
                      </h4>
                      <div className="space-y-3">
                        {inProgressProjects
                          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                          .map((project) => (
                          <div key={project.id} className="p-4 border rounded-lg hover:bg-gray-50 bg-blue-50 border-blue-200">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-blue-900">{project.title}</h4>
                                <p className="text-sm text-blue-700">{project.template.title}</p>
                                {project.class && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    📚 {project.class.name} - {project.class.teacher.name}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {project.status === "DRAFT" ? "임시저장" : "진행중"}
                                </Badge>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => router.push(`/student/projects/${project.id}`)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  계속하기
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-blue-600">
                              수정일: {new Date(project.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 완료 중인 탐구 (COMPLETED - 완료했지만 아직 제출하지 않음) */}
                {(() => {
                  const completedProjects = projects.filter(p => p.status === "COMPLETED");
                  if (completedProjects.length === 0) return null;
                  
                  return (
                    <div key="completed-section">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-orange-600" />
                        완료 중인 탐구 ({completedProjects.length}개)
                      </h4>
                      <div className="space-y-3">
                        {completedProjects
                          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                          .map((project) => (
                          <div key={project.id} className="p-4 border rounded-lg hover:bg-gray-50 bg-orange-50 border-orange-200">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-orange-900">{project.title}</h4>
                                <p className="text-sm text-orange-700">{project.template.title}</p>
                                {project.class && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    📚 {project.class.name} - {project.class.teacher.name}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-orange-600">
                                  완료됨
                                </Badge>
                                <Button
                                  size="sm"
                                  className="bg-orange-600 hover:bg-orange-700"
                                  onClick={() => router.push(`/student/projects/${project.id}`)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  제출하기
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-orange-600">
                              완료일: {new Date(project.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 제출한 탐구 (SUBMITTED) */}
                {(() => {
                  const submittedProjects = projects.filter(p => p.status === "SUBMITTED");
                  if (submittedProjects.length === 0) return null;
                  
                  return (
                    <div key="submitted-section">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-green-600" />
                        제출한 탐구 ({submittedProjects.length}개)
                      </h4>
                      <div className="space-y-3">
                        {submittedProjects
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .map((project) => (
                          <div key={project.id} className="p-4 border rounded-lg hover:bg-gray-50 bg-green-50 border-green-200">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-green-900">{project.title}</h4>
                                <p className="text-sm text-green-700">{project.template.title}</p>
                                {project.class && (
                                  <p className="text-xs text-green-600 mt-1">
                                    📚 {project.class.name} - {project.class.teacher.name}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-green-600">
                                  제출완료
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-600 text-green-600 hover:bg-green-50"
                                  onClick={() => router.push(`/student/projects/${project.id}`)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  보기
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-green-600">
                              제출일: {new Date(project.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 피드백 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>최근 피드백</CardTitle>
            <CardDescription>
              교사로부터 받은 최근 피드백을 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedbacks.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>아직 받은 피드백이 없습니다.</p>
                <p className="text-xs mt-2">탐구 활동을 진행하면 교사로부터 피드백을 받을 수 있습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5) // 최근 5개만 표시
                  .map((feedback) => (
                    <div key={feedback.id} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">{feedback.project.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {feedback.teacher.name}
                            </Badge>
                            {feedback.step ? (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                {feedback.step.order}단계: {feedback.step.title}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                전체 피드백
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2 pl-1 border-l-2 border-orange-300">
                            {feedback.content}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(feedback.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/student/projects/${feedback.project.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          프로젝트 보기
                        </Button>
                      </div>
                    </div>
                  ))}
                {feedbacks.length > 5 ? (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: 전체 피드백 페이지로 이동
                        alert("전체 피드백 페이지는 추후 구현 예정입니다.");
                      }}
                    >
                      더 많은 피드백 보기 ({feedbacks.length - 5}개 더)
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 모달들 */}
      <JoinClassModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => {
          fetchClasses();
          fetchProjects(); // 새 클래스 참여 시 프로젝트도 새로고침
          fetchFeedbacks(); // 새 클래스 참여 시 피드백도 새로고침
        }}
      />

      <PasswordVerificationModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => router.push("/student/profile")}
        title="개인정보 수정"
        description="개인정보 보호를 위해 현재 비밀번호를 입력해주세요."
      />
    </div>
  );
}
