"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  User,
  Calendar,
  FileText
} from "lucide-react";
import FeatureNote from "@/components/ui/feature-note";

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
}

interface Project {
  id: string;
  title: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED';
  student: {
    id: string;
    name: string;
    email: string;
  };
  template: {
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ClassDetails {
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

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'projects'>('students');

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
      fetchStudents();
      fetchProjects();
    }
  }, [classId]);

  const fetchClassDetails = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`);
      if (response.ok) {
        const data = await response.json();
        setClassDetails(data.class);
      }
    } catch (error) {
      console.error("Failed to fetch class details:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/projects?classId=${classId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Project['status']) => {
    const statusConfig = {
      DRAFT: { label: '초안', variant: 'secondary' as const, icon: FileText },
      IN_PROGRESS: { label: '진행중', variant: 'default' as const, icon: Clock },
      COMPLETED: { label: '완료', variant: 'success' as const, icon: CheckCircle },
      SUBMITTED: { label: '제출됨', variant: 'success' as const, icon: CheckCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getProjectStats = () => {
    const stats = {
      draft: projects.filter(p => p.status === 'DRAFT').length,
      inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
      completed: projects.filter(p => p.status === 'COMPLETED' || p.status === 'SUBMITTED').length,
    };
    return stats;
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

  if (!classDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">클래스를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push('/teacher/dashboard')} className="mt-4">
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const stats = getProjectStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/teacher/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                대시보드로 돌아가기
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classDetails.name}</h1>
                <p className="text-gray-600">클래스 코드: {classDetails.classCode}</p>
              </div>
            </div>
            <FeatureNote
              title="클래스 관리 기능"
              description="학생과 프로젝트 현황을 한눈에 파악하십시오"
              details={[
                "학생 목록: 클래스에 등록된 모든 학생들을 확인할 수 있습니다",
                "프로젝트 현황: 각 학생의 탐구 프로젝트 진행 상황을 모니터링할 수 있습니다",
                "상태별 분류: 초안, 진행중, 완료 상태별로 프로젝트를 구분하여 확인합니다",
                "개별 관리: 각 학생의 프로젝트를 클릭하여 상세 내용을 확인하고 피드백을 제공할 수 있습니다"
              ]}
              className="shrink-0"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 클래스 개요 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">등록된 학생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classDetails._count.enrollments}</div>
              <p className="text-xs text-muted-foreground">명</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행중</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">개 프로젝트</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">개 프로젝트</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 프로젝트</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classDetails._count.projects}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>
        </div>

        {/* 탭 메뉴 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('students')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 mr-2 inline" />
                학생 목록 ({students.length})
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="h-4 w-4 mr-2 inline" />
                프로젝트 현황 ({projects.length})
              </button>
            </nav>
          </div>
        </div>

        {/* 콘텐츠 */}
        {activeTab === 'students' && (
          <Card>
            <CardHeader>
              <CardTitle>등록된 학생 목록</CardTitle>
              <CardDescription>
                이 클래스에 등록된 학생들을 확인하고 관리하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  아직 등록된 학생이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          가입일: {new Date(student.enrollmentDate).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'projects' && (
          <Card>
            <CardHeader>
              <CardTitle>탐구 프로젝트 현황</CardTitle>
              <CardDescription>
                학생들의 탐구 프로젝트 진행 상황을 모니터링하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  아직 생성된 프로젝트가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/teacher/projects/${project.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{project.title}</h4>
                            {getStatusBadge(project.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {project.student.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {project.template.title}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(project.updatedAt).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 ml-4">
                          클릭하여 상세보기 →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
