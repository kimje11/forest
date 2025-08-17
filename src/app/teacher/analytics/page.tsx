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
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Award,
  Target
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

interface StudentAnalytics {
  studentId: string;
  studentName: string;
  totalProjects: number;
  completedProjects: number;
  averageProgress: number;
  totalFeedbacks: number;
  averageCompletionTime: number;
  activeProjects: number;
}

interface ClassAnalytics {
  classId: string;
  className: string;
  totalStudents: number;
  totalProjects: number;
  completedProjects: number;
  averageProgress: number;
  engagementRate: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics[]>([]);
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [selectedPeriod]);

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

      let projectsData = null;
      let classesData = null;

      if (projectsRes.ok) {
        projectsData = await projectsRes.json();
        const filteredProjects = filterProjectsByPeriod(projectsData.projects);
        setProjects(filteredProjects);
      }

      if (classesRes.ok) {
        classesData = await classesRes.json();
        setClasses(classesData.classes);
      }

      // 두 데이터가 모두 있을 때 분석 계산
      if (projectsData && classesData) {
        const filteredProjects = filterProjectsByPeriod(projectsData.projects);
        calculateAnalytics(filteredProjects, classesData.classes);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjectsByPeriod = (projects: Project[]) => {
    const periodDays = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    
    return projects.filter(project => 
      new Date(project.createdAt) >= cutoffDate
    );
  };

  const calculateAnalytics = (projects: Project[], classes: Class[]) => {
    // 학생별 분석
    const studentMap = new Map<string, StudentAnalytics>();
    
    projects.forEach(project => {
      const studentId = project.student.id;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          studentName: project.student.name,
          totalProjects: 0,
          completedProjects: 0,
          averageProgress: 0,
          totalFeedbacks: 0,
          averageCompletionTime: 0,
          activeProjects: 0
        });
      }

      const student = studentMap.get(studentId)!;
      student.totalProjects++;
      
      if (project.status === "COMPLETED") {
        student.completedProjects++;
      }
      
      if (project.status === "IN_PROGRESS" || project.status === "SUBMITTED") {
        student.activeProjects++;
      }
      
      student.totalFeedbacks += project.feedbacks.length;
      
      // 진행률 계산
      const progress = getProjectProgress(project);
      student.averageProgress += (progress.completed / progress.total) * 100;
    });

    // 평균 계산
    studentMap.forEach(student => {
      if (student.totalProjects > 0) {
        student.averageProgress = student.averageProgress / student.totalProjects;
      }
    });

    setStudentAnalytics(Array.from(studentMap.values()));

    // 클래스별 분석
    const classMap = new Map<string, ClassAnalytics>();
    
    classes.forEach(cls => {
      const classProjects = projects.filter(p => p.class.id === cls.id);
      const submittedProjects = classProjects.filter(p => p.status === "SUBMITTED").length;
      const totalProgress = classProjects.reduce((sum, project) => {
        const progress = getProjectProgress(project);
        return sum + (progress.completed / progress.total) * 100;
      }, 0);

      // 참여율: 프로젝트를 가진 고유한 학생 수 / 전체 학생 수
      const uniqueStudents = new Set(classProjects.map(p => p.student.id));
      const participatingStudents = uniqueStudents.size;

      classMap.set(cls.id, {
        classId: cls.id,
        className: cls.name,
        totalStudents: cls._count.enrollments,
        totalProjects: classProjects.length,
        completedProjects: submittedProjects, // 제출된 프로젝트로 변경
        averageProgress: classProjects.length > 0 ? totalProgress / classProjects.length : 0,
        engagementRate: cls._count.enrollments > 0 ? (participatingStudents / cls._count.enrollments) * 100 : 0
      });
    });

    setClassAnalytics(Array.from(classMap.values()));
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

  const getOverallStats = () => {
    const totalProjects = projects.length;
    const submittedProjects = projects.filter(p => p.status === "SUBMITTED").length;
    const inProgressProjects = projects.filter(p => p.status === "IN_PROGRESS" || p.status === "SUBMITTED").length;
    const totalFeedbacks = projects.reduce((sum, p) => sum + p.feedbacks.length, 0);
    const submissionRate = totalProjects > 0 ? (submittedProjects / totalProjects) * 100 : 0;
    
    const totalProgress = projects.reduce((sum, project) => {
      const progress = getProjectProgress(project);
      return sum + (progress.completed / progress.total) * 100;
    }, 0);
    const averageProgress = totalProjects > 0 ? totalProgress / totalProjects : 0;

    return {
      totalProjects,
      submittedProjects,
      inProgressProjects,
      totalFeedbacks,
      submissionRate,
      averageProgress
    };
  };

  const stats = getOverallStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">학습 분석 데이터를 불러오는 중...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">학습 분석</h1>
              <p className="text-gray-600">학생들의 학습 패턴과 성과를 분석하세요.</p>
            </div>
            <div className="flex gap-4 items-center">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="7">최근 7일</option>
                <option value="30">최근 30일</option>
                <option value="90">최근 90일</option>
                <option value="365">최근 1년</option>
              </select>
              <Link href="/teacher/dashboard">
                <Button variant="outline">대시보드로</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 전체 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 프로젝트</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                최근 {selectedPeriod}일간
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">제출율</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.submissionRate)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.submittedProjects}/{stats.totalProjects} 제출
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 진행률</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.averageProgress)}%</div>
              <p className="text-xs text-muted-foreground">
                모든 프로젝트 평균
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 피드백</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFeedbacks}</div>
              <p className="text-xs text-muted-foreground">
                제공된 피드백 수
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 클래스별 성과 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                클래스별 성과
              </CardTitle>
              <CardDescription>
                각 클래스의 학습 활동 및 참여도를 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classAnalytics.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">분석할 클래스 데이터가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {classAnalytics.map((cls) => (
                    <div key={cls.classId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{cls.className}</h4>
                          <p className="text-sm text-gray-600">
                            학생 {cls.totalStudents}명 · 프로젝트 {cls.totalProjects}개
                          </p>
                        </div>
                        <Badge variant="outline">
                          제출 {cls.completedProjects}개
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">평균 진행률</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(cls.averageProgress, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">
                              {Math.round(cls.averageProgress)}%
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">참여율</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${Math.min(cls.engagementRate, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">
                              {Math.round(cls.engagementRate)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 학생별 성과 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                학생별 성과
              </CardTitle>
              <CardDescription>
                우수 학생과 관심이 필요한 학생을 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentAnalytics.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">분석할 학생 데이터가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {studentAnalytics
                    .sort((a, b) => b.averageProgress - a.averageProgress)
                    .map((student, index) => (
                    <div key={student.studentId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <h4 className="font-medium">{student.studentName}</h4>
                        </div>
                        {student.averageProgress >= 80 && (
                          <Badge className="bg-green-100 text-green-800">우수</Badge>
                        )}
                        {student.averageProgress < 30 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            관심 필요
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                        <div>
                          <span className="block text-gray-500">제출율</span>
                          <span className="font-medium">
                            {student.totalProjects > 0 
                              ? Math.round((projects.filter(p => p.student.id === student.studentId && p.status === "SUBMITTED").length / student.totalProjects) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div>
                          <span className="block text-gray-500">평균 진행률</span>
                          <span className="font-medium">{Math.round(student.averageProgress)}%</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">받은 피드백</span>
                          <span className="font-medium">{student.totalFeedbacks}개</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(student.averageProgress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 추가 인사이트 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              학습 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(stats.averageProgress)}%
                </div>
                <p className="text-sm text-gray-600">평균 학습 진행률</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {studentAnalytics.filter(s => s.completedProjects > 0).length}
                </div>
                <p className="text-sm text-gray-600">활성 학습자</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.totalFeedbacks / Math.max(stats.totalProjects, 1) * 100) / 100}
                </div>
                <p className="text-sm text-gray-600">프로젝트당 평균 피드백</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {studentAnalytics.filter(s => s.averageProgress < 30).length}
                </div>
                <p className="text-sm text-gray-600">관심 필요 학생</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
