"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Settings,
  Database,
  Shield,
  BarChart3
} from "lucide-react";
import { BarChart, LineChart, useChartRegistration } from "@/components/charts/dynamic-chart";

interface SystemStats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalTemplates: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  recentSignups: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { registerChartJS } = useChartRegistration();

  useEffect(() => {
    checkAuth();
    fetchSystemStats();
    fetchRecentActivity();
    registerChartJS(); // Chart.js 동적 등록
  }, [registerChartJS]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.push("/auth/login");
        return;
      }
      
      const data = await response.json();
      if (data.user.role !== "ADMIN") {
        router.push("/auth/login");
        return;
      }
      
      setUser(data.user);
    } catch (error) {
      router.push("/auth/login");
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch system stats:", error);
    }
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

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/admin/activity");
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities);
      }
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 더미 데이터 (실제 구현에서는 API에서 가져옴)
  const userGrowthData = {
    labels: ["1월", "2월", "3월", "4월", "5월", "6월"],
    datasets: [
      {
        label: "교사",
        data: [12, 19, 25, 32, 38, 42],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
      },
      {
        label: "학생",
        data: [45, 78, 120, 165, 210, 250],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
      },
    ],
  };

  const projectsData = {
    labels: ["1월", "2월", "3월", "4월", "5월", "6월"],
    datasets: [
      {
        label: "생성된 프로젝트",
        data: [15, 25, 35, 42, 48, 55],
        backgroundColor: "rgba(168, 85, 247, 0.8)",
      },
      {
        label: "완료된 프로젝트",
        data: [8, 15, 22, 28, 35, 40],
        backgroundColor: "rgba(34, 197, 94, 0.8)",
      },
    ],
  };

  const mockStats: SystemStats = {
    totalUsers: 342,
    totalTeachers: 42,
    totalStudents: 300,
    totalClasses: 68,
    totalTemplates: 15,
    totalProjects: 156,
    activeProjects: 89,
    completedProjects: 67,
    recentSignups: 12,
  };

  const displayStats = stats || mockStats;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 대시보드를 불러오는 중...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-gray-600">탐구의 숲 플랫폼 관리</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                관리자
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 시스템 개요 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{displayStats.recentSignups} 이번 주
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">교사</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">명</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">학생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">명</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 프로젝트</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                총 {displayStats.totalProjects}개 중
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 상세 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">운영 클래스</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.totalClasses}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">템플릿</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.totalTemplates}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료된 탐구</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.completedProjects}</div>
              <p className="text-xs text-muted-foreground">
                완료율 {Math.round((displayStats.completedProjects / displayStats.totalProjects) * 100)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">정상</span>
              </div>
              <p className="text-xs text-muted-foreground">모든 서비스 작동 중</p>
            </CardContent>
          </Card>
        </div>

        {/* 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                사용자 증가 추이
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart 
                data={userGrowthData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                프로젝트 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart 
                data={projectsData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* 관리 기능 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                사용자 관리
              </CardTitle>
              <CardDescription>
                사용자 계정 및 권한을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  사용자 목록 보기
                </Button>
                <Button className="w-full" variant="outline">
                  계정 상태 관리
                </Button>
                <Button className="w-full" variant="outline">
                  권한 설정
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                콘텐츠 관리
              </CardTitle>
              <CardDescription>
                템플릿과 기본 콘텐츠를 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  기본 템플릿 관리
                </Button>
                <Button className="w-full" variant="outline">
                  주제 카드 관리
                </Button>
                <Button className="w-full" variant="outline">
                  콘텐츠 승인
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                시스템 설정
              </CardTitle>
              <CardDescription>
                시스템 설정과 로그를 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  시스템 설정
                </Button>
                <Button className="w-full" variant="outline">
                  활동 로그
                </Button>
                <Button className="w-full" variant="outline">
                  백업 관리
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 시스템 활동</CardTitle>
            <CardDescription>
              최근 플랫폼에서 발생한 주요 활동들을 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: "user", message: "새로운 교사 계정 생성", time: "2분 전", icon: Users },
                { type: "project", message: "수학 탐구 프로젝트 완료", time: "15분 전", icon: BookOpen },
                { type: "class", message: "새 클래스 개설", time: "1시간 전", icon: GraduationCap },
                { type: "system", message: "시스템 백업 완료", time: "3시간 전", icon: Database },
                { type: "alert", message: "서버 부하 증가 감지", time: "5시간 전", icon: AlertTriangle },
              ].map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
