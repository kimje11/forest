"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Users, Calendar, Edit, Trash2, Copy, Share2, RefreshCw } from "lucide-react";
import AuthHeader from "@/components/layout/auth-header";

interface Template {
  id: string;
  title: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  teacher: {
    id: string;
    name: string;
  };
  _count: {
    projects: number;
  };
  steps: any[];
}

interface Class {
  id: string;
  name: string;
  _count: {
    enrollments: number;
  };
}

function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");

  useEffect(() => {
    checkAuth();
    fetchTemplates();
    fetchClasses();

    // 페이지가 다시 포커스될 때 데이터 새로고침
    const handleFocus = () => {
      fetchTemplates();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
        console.log("Templates updated:", data.templates.map(t => ({ title: t.title, projects: t._count.projects })));
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
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
    }
  };

  const handleShareTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShareTitle(template.title);
    setShareDescription(template.description || "");
    setSelectedClasses([]);
    setShowShareModal(true);
  };

  const handleShareToClasses = async () => {
    if (!selectedTemplate || selectedClasses.length === 0) {
      alert("클래스를 선택해주세요.");
      return;
    }

    if (!shareTitle.trim()) {
      alert("활동 제목을 입력해주세요.");
      return;
    }

    try {
      const promises = selectedClasses.map(classId =>
        fetch(`/api/classes/${classId}/activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: shareTitle,
            description: shareDescription,
            templateId: selectedTemplate.id,
          }),
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      
      if (successCount === selectedClasses.length) {
        alert(`${successCount}개 클래스에 활동이 성공적으로 공유되었습니다.`);
      } else {
        alert(`${successCount}/${selectedClasses.length}개 클래스에 활동이 공유되었습니다.`);
      }

      setShowShareModal(false);
      fetchTemplates(); // 템플릿 사용량 업데이트
    } catch (error) {
      console.error("Share template error:", error);
      alert("템플릿 공유 중 오류가 발생했습니다.");
    }
  };

  const handleCopyTemplate = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}/duplicate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        alert(`템플릿이 성공적으로 복사되었습니다: "${data.template.title}"`);
        fetchTemplates(); // 템플릿 목록 새로고침
      } else {
        const error = await response.json();
        alert(error.error || "템플릿 복사에 실패했습니다.");
      }
    } catch (error) {
      console.error("Copy template error:", error);
      alert("템플릿 복사 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("정말로 이 템플릿을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
        credentials: "include", // 인증 정보 포함
      });

      if (response.ok) {
        alert("템플릿이 성공적으로 삭제되었습니다.");
        fetchTemplates(); // 템플릿 목록 새로고침 (사용량 포함)
      } else {
        const error = await response.json();
        alert(error.error || "템플릿 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete template error:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">템플릿을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const myTemplates = templates.filter(t => !t.isDefault);
  const defaultTemplates = templates.filter(t => t.isDefault);

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader 
        title="탐구 템플릿"
        subtitle="탐구 활동을 위한 템플릿을 관리하세요"
      />
      
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchTemplates}
                title="데이터 새로고침"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Link href="/teacher/dashboard">
                <Button variant="outline">대시보드로</Button>
              </Link>
              <Link href="/teacher/templates/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  새 템플릿 만들기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">내 템플릿</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myTemplates.length}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">기본 템플릿</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{defaultTemplates.length}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 사용량</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.reduce((total, t) => total + t._count.projects, 0)}
              </div>
              <p className="text-xs text-muted-foreground">프로젝트</p>
            </CardContent>
          </Card>
        </div>

        {/* 내 템플릿 */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">내 템플릿</h2>
            <Link href="/teacher/templates/create">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                새 템플릿
              </Button>
            </Link>
          </div>

          {myTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  첫 번째 템플릿을 만들어보세요
                </h3>
                <p className="text-gray-500 mb-4">
                  학생들의 탐구 활동을 체계적으로 안내할 수 있는 맞춤형 템플릿을 설계하세요.
                </p>
                <Link href="/teacher/templates/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    템플릿 만들기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShareTemplate(template)}
                          title="클래스에 공유하기"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyTemplate(template)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Link href={`/teacher/templates/${template.id}/edit`}>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>단계: {template.steps.length}개</span>
                        <span>사용: {template._count.projects}회</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                      <Link href={`/teacher/templates/${template.id}`}>
                        <Button size="sm" className="w-full">
                          상세보기
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* 기본 템플릿 */}
        {defaultTemplates.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-6">기본 제공 템플릿</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {defaultTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        기본
                      </span>
                    </div>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>단계: {template.steps.length}개</span>
                        <span>사용: {template._count.projects}회</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleCopyTemplate(template)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          복사
                        </Button>
                        <Link href={`/teacher/templates/${template.id}`} className="flex-1">
                          <Button size="sm" className="w-full">
                            보기
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 클래스 공유 모달 */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">클래스에 공유하기</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">활동 제목</label>
                <Input
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  placeholder="클래스 활동 제목을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">활동 설명 (선택사항)</label>
                <Input
                  value={shareDescription}
                  onChange={(e) => setShareDescription(e.target.value)}
                  placeholder="활동 설명을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">공유할 클래스 선택</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {classes.map((classItem) => (
                    <label key={classItem.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(classItem.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClasses([...selectedClasses, classItem.id]);
                          } else {
                            setSelectedClasses(selectedClasses.filter(id => id !== classItem.id));
                          }
                        }}
                      />
                      <span className="text-sm">
                        {classItem.name} ({classItem._count.enrollments}명)
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleShareToClasses}
                className="flex-1"
                disabled={selectedClasses.length === 0}
              >
                공유하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TemplatesContent />
    </Suspense>
  );
}
