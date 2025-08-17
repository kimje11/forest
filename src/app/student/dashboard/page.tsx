"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, Clock, Plus, User, Eye, RefreshCw } from "lucide-react";
import JoinClassModal from "@/components/modals/join-class-modal";

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
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchClasses();
    fetchProjects();
    fetchFeedbacks();
  }, []);

  // 페이지가 다시 포커스될 때 프로젝트 목록 새로고침
  useEffect(() => {
    const handleFocus = () => {
      fetchProjects();
      fetchFeedbacks();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user.role !== "STUDENT") {
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
      const response = await fetch("/api/classes", {
        credentials: "include"
      });
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

  const handleLogout = async () => {
    try {
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
              <h1 className="text-2xl font-bold text-gray-900">학생 대시보드</h1>
              <p className="text-gray-600">안녕하세요, {user.name}님</p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleLogout}>로그아웃</Button>
            </div>
          </div>
        </div>
      </header>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                      {cls.description && (
                        <p className="text-xs text-gray-600 mb-2">{cls.description}</p>
                      )}
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

          {/* 탐구 시작하기 */}
          <Card>
            <CardHeader>
              <CardTitle>새 탐구 시작하기</CardTitle>
              <CardDescription>
                AI 추천이나 템플릿을 활용하여 새로운 탐구를 시작하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full"
                onClick={() => router.push("/student/explore")}
              >
                <Plus className="mr-2 h-4 w-4" />
                탐구 시작하기
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push("/student/portfolio")}
              >
                <Trophy className="mr-2 h-4 w-4" />
                포트폴리오 보기
              </Button>
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
                {projects.filter(p => p.status === "DRAFT" || p.status === "IN_PROGRESS").length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      진행 중인 탐구 ({projects.filter(p => p.status === "DRAFT" || p.status === "IN_PROGRESS").length}개)
                    </h4>
                    <div className="space-y-3">
                      {projects
                        .filter(p => p.status === "DRAFT" || p.status === "IN_PROGRESS")
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
                )}

                {/* 완료 중인 탐구 (COMPLETED - 완료했지만 아직 제출하지 않음) */}
                {projects.filter(p => p.status === "COMPLETED").length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-orange-600" />
                      완료 중인 탐구 ({projects.filter(p => p.status === "COMPLETED").length}개)
                    </h4>
                    <div className="space-y-3">
                      {projects
                        .filter(p => p.status === "COMPLETED")
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
                )}

                {/* 제출한 탐구 (SUBMITTED) */}
                {projects.filter(p => p.status === "SUBMITTED").length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-green-600" />
                      제출한 탐구 ({projects.filter(p => p.status === "SUBMITTED").length}개)
                    </h4>
                    <div className="space-y-3">
                      {projects
                        .filter(p => p.status === "SUBMITTED")
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
                )}
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
                {feedbacks.length > 5 && (
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
                )}
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
    </div>
  );
}
