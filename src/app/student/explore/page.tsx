"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Users, ArrowRight, Clock, Eye } from "lucide-react";
import TopicSuggestion from "@/components/ai/topic-suggestion";

interface Class {
  id: string;
  name: string;
  teacher: {
    name: string;
  };
}

interface Template {
  id: string;
  title: string;
  description?: string;
  teacher: {
    name: string;
  };
  steps: any[];
}

export default function ExplorePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include"
      });
      if (!response.ok) {
        router.push("/auth/login");
        return;
      }
      
      const data = await response.json();
      if (data.user.role !== "STUDENT") {
        router.push("/auth/login");
        return;
      }
      
      setUser(data.user);
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/auth/login");
    }
  };

  const fetchData = async () => {
    try {
      const [classesRes, templatesRes] = await Promise.all([
        fetch("/api/classes", { credentials: "include" }),
        fetch("/api/templates", { credentials: "include" })
      ]);

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData.classes);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExploration = async (templateId: string, classId?: string) => {
    try {
      // 먼저 템플릿 정보를 가져와서 프로젝트 제목 생성
      const templateResponse = await fetch(`/api/templates/${templateId}`, {
        credentials: "include"
      });
      
      if (!templateResponse.ok) {
        alert("템플릿을 찾을 수 없습니다.");
        return;
      }
      
      const templateData = await templateResponse.json();
      const template = templateData.template;
      
      // 프로젝트 생성
      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: `${template.title} - ${new Date().toLocaleDateString()}`,
          templateId: templateId,
          classId: classId || null,
        }),
      });

      if (createResponse.ok) {
        const projectData = await createResponse.json();
        // 생성된 프로젝트로 바로 이동
        router.push(`/student/projects/${projectData.project.id}`);
      } else {
        const error = await createResponse.json();
        alert(error.error || "프로젝트 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Project creation error:", error);
      alert("프로젝트 생성 중 오류가 발생했습니다.");
    }
  };

  const handleSelectTopic = (topic: any) => {
    // AI가 추천한 주제를 선택했을 때의 처리
    console.log("Selected topic:", topic);
    // TODO: 주제 선택 후 템플릿 선택 또는 자유 탐구 시작
    alert(`"${topic.title}" 주제를 선택했습니다. 템플릿을 선택하여 탐구를 시작해보세요!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">탐구 환경을 준비하는 중...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">탐구 시작하기</h1>
              <p className="text-gray-600">새로운 탐구 여정을 시작해보세요, {user?.name}님!</p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.push("/student/dashboard")}>
                대시보드로
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI 주제 추천 */}
          <div className="lg:col-span-2">
            <TopicSuggestion onSelectTopic={handleSelectTopic} />
          </div>

          {/* 클래스 기반 탐구 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                클래스 탐구 활동
              </CardTitle>
              <CardDescription>
                참여 중인 클래스의 탐구 활동에 참여하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    아직 참여한 클래스가 없습니다.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/student/dashboard")}
                  >
                    클래스 참여하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {classes.map((cls) => (
                    <div key={cls.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{cls.name}</h4>
                          <p className="text-sm text-gray-600">교사: {cls.teacher.name}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/student/classes/${cls.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          활동보기
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 템플릿 기반 자유 탐구 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                자유 탐구 활동
              </CardTitle>
              <CardDescription>
                제공된 템플릿을 사용하여 자유롭게 탐구하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    사용 가능한 템플릿이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{template.title}</h4>
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {template.steps.length}단계
                            </span>
                            <span>by {template.teacher.name}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleStartExploration(template.id)}
                        >
                          시작하기
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 안내 섹션 */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center">
              <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                탐구의 숲에서 여러분의 호기심을 키워보세요!
              </h3>
              <p className="text-blue-700 mb-4">
                AI 추천부터 체계적인 템플릿까지, 다양한 방식으로 탐구 활동을 시작할 수 있습니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <p className="font-medium">주제 발견</p>
                  <p className="text-gray-600">AI 추천이나 자유 주제 선택</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <p className="font-medium">체계적 탐구</p>
                  <p className="text-gray-600">단계별 템플릿으로 진행</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <p className="font-medium">성장 확인</p>
                  <p className="text-gray-600">포트폴리오로 성과 관리</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
