"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  BookOpen, 
  Clock, 
  MessageSquare, 
  Search,
  Eye,
  CheckCircle,
  Circle,
  AlertCircle,
  Filter,
  Download,
  MoreHorizontal
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

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, selectedClassId, selectedStatus, searchTerm]);

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
      const [projectsRes, classesRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/classes")
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects);
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData.classes);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // 클래스 필터
    if (selectedClassId !== "all") {
      filtered = filtered.filter(p => p.class.id === selectedClassId);
    }

    // 상태 필터
    if (selectedStatus !== "all") {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.template.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
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
      case "DRAFT": return "배포";
      default: return status;
    }
  };

  const exportToCSV = () => {
    const csvData = filteredProjects.map(project => {
      const progress = getProjectProgress(project);
      return {
        "프로젝트명": project.title || "",
        "학생명": project.student.name,
        "클래스": project.class.name,
        "템플릿": project.template.title,
        "상태": getStatusText(project.status),
        "진행률": `${progress.completed}/${progress.total}`,
        "피드백 수": project.feedbacks.length,
        "생성일": new Date(project.createdAt).toLocaleDateString(),
        "수정일": new Date(project.updatedAt).toLocaleDateString()
      };
    });

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `projects_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로젝트 데이터를 불러오는 중...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
              <p className="text-gray-600">학생들의 탐구 프로젝트를 체계적으로 관리하세요.</p>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                disabled={filteredProjects.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV 내보내기
              </Button>
              <Link href="/teacher/dashboard">
                <Button variant="outline">대시보드로</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">배포 (0%)</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => {
                  // 제출된 프로젝트는 제외하고 0% 진행률만 카운트
                  if (p.status === "SUBMITTED") return false;
                  const progress = getProjectProgress(p);
                  const progressPercent = (progress.completed / progress.total) * 100;
                  return progressPercent === 0;
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행중 (0%초과)</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => {
                  // 제출된 프로젝트는 제외하고 0%초과 100%미만만 카운트
                  if (p.status === "SUBMITTED") return false;
                  const progress = getProjectProgress(p);
                  const progressPercent = (progress.completed / progress.total) * 100;
                  return progressPercent > 0 && progressPercent < 100;
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료 (100%)</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => {
                  // 제출된 프로젝트는 제외하고 100% 완료만 카운트
                  if (p.status === "SUBMITTED") return false;
                  const progress = getProjectProgress(p);
                  const progressPercent = (progress.completed / progress.total) * 100;
                  return progressPercent === 100;
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">제출됨</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === "SUBMITTED").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              필터 및 검색
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="프로젝트, 학생, 템플릿 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 클래스 필터 */}
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="all">모든 클래스</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>

              {/* 상태 필터 */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="all">모든 상태</option>
                <option value="DRAFT">배포</option>
                <option value="IN_PROGRESS">진행중</option>
                <option value="SUBMITTED">제출됨</option>
                <option value="COMPLETED">완료</option>
              </select>

              {/* 결과 수 */}
              <div className="flex items-center justify-center bg-gray-50 rounded-md px-3 py-2">
                <span className="text-sm text-gray-600">
                  {filteredProjects.length}개 프로젝트
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 프로젝트 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 목록</CardTitle>
            <CardDescription>
              필터링된 {filteredProjects.length}개의 프로젝트를 관리하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">조건에 맞는 프로젝트가 없습니다.</p>
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
                            {project.feedbacks.length === 0 && project.status === "SUBMITTED" && (
                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                피드백 대기
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">학생:</span> {project.student.name}
                            </div>
                            <div>
                              <span className="font-medium">클래스:</span> {project.class.name}
                            </div>
                            <div>
                              <span className="font-medium">템플릿:</span> {project.template.title}
                            </div>
                            <div>
                              <span className="font-medium">피드백:</span> {project.feedbacks.length}개
                            </div>
                          </div>

                          <div className="mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500">진행률</span>
                              <span className="text-xs text-gray-500">
                                {progress.completed}/{progress.total} 단계 ({Math.round(progressPercentage)}%)
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

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>생성일: {new Date(project.createdAt).toLocaleDateString()}</span>
                        <span>수정일: {new Date(project.updatedAt).toLocaleDateString()}</span>
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
