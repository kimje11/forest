"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Users, ArrowRight, Clock } from "lucide-react";

interface Template {
  id: string;
  title: string;
  description?: string;
  teacher: {
    name: string;
  };
  steps: any[];
}

interface Class {
  id: string;
  name: string;
  teacher: {
    name: string;
  };
}

export default function CreateProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const classId = searchParams.get("class");
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(classId || "");
  const [projectTitle, setProjectTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [templateId]);

  const fetchData = async () => {
    try {
      if (!templateId) {
        setIsLoading(false);
        return;
      }

      const [templateRes, classesRes] = await Promise.all([
        fetch(`/api/templates/${templateId}`, { credentials: "include" }),
        fetch("/api/classes", { credentials: "include" })
      ]);

      if (templateRes.ok) {
        const templateData = await templateRes.json();
        setTemplate(templateData.template);
        setProjectTitle(`${templateData.template.title} - 탐구`);
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

  const handleCreateProject = async () => {
    if (!template) return;

    setIsCreating(true);
    
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          templateId: template.id,
          classId: selectedClassId || undefined,
          title: projectTitle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/student/projects/${data.project.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "프로젝트 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Create project error:", error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">템플릿 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              템플릿을 찾을 수 없습니다
            </h3>
            <p className="text-gray-500 mb-4">
              선택한 템플릿이 존재하지 않거나 접근할 수 없습니다.
            </p>
            <Button onClick={() => router.push("/student/explore")}>
              탐구 시작 페이지로
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">새 탐구 프로젝트 만들기</h1>
              <p className="text-gray-600">템플릿을 기반으로 탐구 활동을 시작하세요.</p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                돌아가기
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 템플릿 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                선택된 템플릿
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{template.title}</h3>
                  {template.description && (
                    <p className="text-gray-600 mt-1">{template.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {template.steps.length}개 단계
                  </span>
                  <span>제작: {template.teacher.name}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {template.steps.map((step, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium">단계 {index + 1}</div>
                      <div className="text-xs text-gray-600">{step.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 프로젝트 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 설정</CardTitle>
              <CardDescription>
                탐구 프로젝트의 기본 정보를 설정하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">프로젝트 제목</label>
                <Input
                  value={projectTitle}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                  placeholder="템플릿 기반으로 자동 생성됩니다"
                />
                <p className="text-xs text-gray-500">
                  프로젝트 제목은 템플릿을 기반으로 자동 생성됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">클래스 선택 (선택사항)</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">개인 탐구 (클래스 없음)</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.teacher.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  클래스를 선택하면 교사의 피드백과 지도를 받을 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 탐구 과정 안내 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">탐구 과정 안내</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <p className="font-medium text-blue-900">단계별 진행</p>
                  <p className="text-blue-700">템플릿의 각 단계를 순서대로 완료</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <p className="font-medium text-blue-900">자동 저장</p>
                  <p className="text-blue-700">입력한 내용이 실시간으로 저장</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <p className="font-medium text-blue-900">피드백 받기</p>
                  <p className="text-blue-700">교사의 실시간 피드백과 조언</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 생성 버튼 */}
          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push("/student/explore")}
            >
              취소
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={!projectTitle.trim() || isCreating}
              className="min-w-32"
            >
              {isCreating ? (
                "생성 중..."
              ) : (
                <>
                  탐구 시작하기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
