"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BookOpen, 
  Clock, 
  MessageSquare, 
  TrendingUp,
  Eye,
  CheckCircle,
  Circle,
  AlertCircle
} from "lucide-react";

interface Project {
  id: string;
  title?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
  };
  template: {
    title: string;
    steps: any[];
  };
  inputs: any[];
  feedbacks: any[];
}

interface Class {
  id: string;
  name: string;
  _count: {
    enrollments: number;
    projects: number;
  };
}

export default function MonitoringPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok || (await response.json()).user.role !== "TEACHER") {
        router.push("/auth/login");
      }
    } catch (error) {
      router.push("/auth/login");
    }
  };

  const fetchData = async () => {
    try {
      console.log("📊 모니터링 데이터 가져오기 시작...");
      
      const [projectsRes, classesRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/classes")
      ]);

      console.log("📈 Projects API 응답:", projectsRes.status, projectsRes.ok);
      console.log("🏫 Classes API 응답:", classesRes.status, classesRes.ok);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        console.log("📈 Projects 데이터:", projectsData.projects?.length || 0, "개");
        console.log("📈 Projects 상세:", projectsData.projects);
        setProjects(projectsData.projects || []);
      } else {
        console.error("📈 Projects API 오류:", projectsRes.status, projectsRes.statusText);
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        console.log("🏫 Classes 데이터:", classesData.classes?.length || 0, "개");
        console.log("🏫 Classes 상세:", classesData.classes);
        setClasses(classesData.classes || []);
      } else {
        console.error("🏫 Classes API 오류:", classesRes.status, classesRes.statusText);
      }
    } catch (error) {
      console.error("❌ 데이터 가져오기 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectProgress = (project: Project) => {
    if (!project.template.steps || !Array.isArray(project.template.steps)) {
      return { completed: 0, total: 1 }; // 기본값 설정
    }

    const totalSteps = project.template.steps.length;
    const completedSteps = project.template.steps.filter(step => {
      const stepInputs = project.inputs.filter(input => input.stepId === step.id);
      const requiredComponents = step.components?.filter((c: any) => c.required) || [];
      // 필수 컴포넌트가 없으면 전체 컴포넌트를 기준으로 계산
      const targetComponents = requiredComponents.length > 0 ? requiredComponents : (step.components || []);
      
      const completedComponents = targetComponents.filter((component: any) => {
        return stepInputs.some(input => 
          input.componentId === component.id && 
          input.value && 
          input.value.trim().length > 0
        );
      });
      return completedComponents.length === targetComponents.length && targetComponents.length > 0;
    }).length;

    return { completed: completedSteps, total: totalSteps };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "SUBMITTED": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED": return "완료";
      case "IN_PROGRESS": return "진행중";
      case "SUBMITTED": return "제출됨";
      case "DRAFT": return "초안";
      default: return status;
    }
  };

  const filteredProjects = selectedClassId === "all" 
    ? projects 
    : projects.filter(p => p.class.id === selectedClassId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">모니터링 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">학생 탐구 모니터링</h1>
              <p className="text-gray-600">학생들의 탐구 진행 상황을 실시간으로 확인하세요.</p>
            </div>
            <div className="flex gap-4">
              <Link href="/teacher/dashboard">
                <Button variant="outline">대시보드로</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 프로젝트</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행 중</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === "IN_PROGRESS" || p.status === "DRAFT").length}
              </div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료됨</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === "COMPLETED").length}
              </div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">피드백 대기</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === "SUBMITTED").length}
              </div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>
        </div>

        {/* 필터 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>클래스별 필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedClassId === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedClassId("all")}
              >
                전체 ({projects.length})
              </Button>
              {classes.map((cls) => (
                <Button
                  key={cls.id}
                  variant={selectedClassId === cls.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedClassId(cls.id)}
                >
                  {cls.name} ({projects.filter(p => p.class.id === cls.id).length})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 프로젝트 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>탐구 프로젝트 현황</CardTitle>
            <CardDescription>
              {filteredProjects.length}개의 프로젝트가 진행 중입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">진행 중인 프로젝트가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => {
                  const progress = getProjectProgress(project);
                  const progressPercentage = (progress.completed / progress.total) * 100;

                  return (
                    <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{project.title}</h4>
                            <Badge className={getStatusColor(project.status)}>
                              {getStatusText(project.status)}
                            </Badge>
                            {project.feedbacks.length === 0 && project.status !== "DRAFT" && (
                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                피드백 필요
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">학생:</span> {project.student.name}
                            </div>
                            <div>
                              <span className="font-medium">클래스:</span> {project.class.name}
                            </div>
                            <div>
                              <span className="font-medium">템플릿:</span> {project.template.title}
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500">진행률</span>
                              <span className="text-xs text-gray-500">
                                {progress.completed}/{progress.total} 단계
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Link href={`/teacher/projects/${project.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              상세보기
                            </Button>
                          </Link>
                          <Link href={`/teacher/projects/${project.id}/feedback`}>
                            <Button size="sm">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              피드백
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        마지막 업데이트: {new Date(project.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
