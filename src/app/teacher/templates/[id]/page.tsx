"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Edit, 
  Copy, 
  Trash2, 
  ArrowLeft,
  Clock,
  User,
  CheckCircle,
  Circle,
  Plus
} from "lucide-react";

interface Component {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: string;
}

interface Step {
  id: string;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  components: Component[];
}

interface Template {
  id: string;
  title: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  teacher: {
    id: string;
    name: string;
  };
  steps: Step[];
  _count: {
    projects: number;
  };
}

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setTemplateId(id);
      fetchTemplate(id);
    });
  }, []);

  const fetchTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
      } else {
        router.push("/teacher/templates");
      }
    } catch (error) {
      console.error("Failed to fetch template:", error);
      router.push("/teacher/templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!template) return;

    try {
      const response = await fetch(`/api/templates/${templateId}/duplicate`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/teacher/templates/${data.template.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "템플릿 복제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Duplicate template error:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!template) return;

    const confirmed = window.confirm(
      `정말로 "${template.title}" 템플릿을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/teacher/templates");
      } else {
        const error = await response.json();
        alert(error.error || "템플릿 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete template error:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const getComponentTypeLabel = (type: string) => {
    switch (type) {
      case "TEXT": return "단문 입력";
      case "TEXTAREA": return "장문 입력";
      case "FILE_UPLOAD": return "파일 업로드";
      case "MULTIPLE_CHOICE": return "선택형";
      case "CHECKBOX": return "체크박스";
      case "AI_TOPIC_HELPER": return "AI 주제 도우미";
      default: return type;
    }
  };

  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case "TEXT": return "bg-blue-100 text-blue-800";
      case "TEXTAREA": return "bg-green-100 text-green-800";
      case "FILE_UPLOAD": return "bg-purple-100 text-purple-800";
      case "MULTIPLE_CHOICE": return "bg-orange-100 text-orange-800";
      case "CHECKBOX": return "bg-pink-100 text-pink-800";
      case "AI_TOPIC_HELPER": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
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

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              템플릿을 찾을 수 없습니다
            </h3>
            <Button onClick={() => router.push("/teacher/templates")}>
              템플릿 목록으로
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push("/teacher/templates")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{template.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {template.teacher.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                  <span>{template._count.projects}개 프로젝트에서 사용</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {template.isDefault && (
                <Badge variant="secondary">기본 템플릿</Badge>
              )}
              <Button variant="outline" onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                복제
              </Button>
              {!template.isDefault && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/teacher/templates/${templateId}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    편집
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 템플릿 정보 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>템플릿 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {template.description && (
                <div>
                  <h4 className="font-medium mb-2">설명</h4>
                  <p className="text-gray-600">{template.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">단계 수:</span> {template.steps.length}개
                </div>
                <div>
                  <span className="font-medium">총 컴포넌트:</span> {template.steps.reduce((total, step) => total + step.components.length, 0)}개
                </div>
                <div>
                  <span className="font-medium">사용 프로젝트:</span> {template._count.projects}개
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 탐구 단계들 */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">탐구 단계</h2>
            {!template.isDefault && (
              <Button 
                variant="outline"
                onClick={() => router.push(`/teacher/templates/${templateId}/edit`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                단계 추가
              </Button>
            )}
          </div>

          {template.steps.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Circle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  아직 단계가 없습니다
                </h3>
                <p className="text-gray-500 mb-4">
                  탐구 활동의 첫 번째 단계를 추가해보세요.
                </p>
                {!template.isDefault && (
                  <Button onClick={() => router.push(`/teacher/templates/${templateId}/edit`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    단계 추가하기
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            template.steps
              .sort((a, b) => a.order - b.order)
              .map((step, index) => (
                <Card key={step.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          {step.title}
                          {step.isRequired && (
                            <Badge variant="destructive" className="text-xs">필수</Badge>
                          )}
                        </CardTitle>
                        {step.description && (
                          <CardDescription className="mt-2">
                            {step.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="outline">
                        {step.components.length}개 컴포넌트
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {step.components.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        컴포넌트가 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {step.components
                          .sort((a, b) => a.order - b.order)
                          .map((component) => (
                            <div key={component.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{component.label}</h4>
                                  {component.required && (
                                    <span className="text-red-500 text-sm">*</span>
                                  )}
                                </div>
                                <Badge className={getComponentTypeColor(component.type)}>
                                  {getComponentTypeLabel(component.type)}
                                </Badge>
                              </div>
                              
                              {component.placeholder && (
                                <p className="text-sm text-gray-600 mb-2">
                                  안내: {component.placeholder}
                                </p>
                              )}

                              {component.type === "MULTIPLE_CHOICE" && component.options && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">선택 옵션:</span>
                                  <ul className="ml-4 mt-1">
                                    {JSON.parse(component.options).map((option: string, idx: number) => (
                                      <li key={idx} className="list-disc">{option}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="text-xs text-gray-500 mt-2">
                                순서: {component.order} | 필수: {component.required ? "예" : "아니오"}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {/* 사용 통계 */}
        {template._count.projects > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>사용 현황</CardTitle>
              <CardDescription>
                이 템플릿을 사용한 프로젝트들의 현황입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{template._count.projects}</div>
                  <p className="text-sm text-blue-700">총 사용 프로젝트</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">-</div>
                  <p className="text-sm text-green-700">완료된 프로젝트</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">-</div>
                  <p className="text-sm text-purple-700">진행 중인 프로젝트</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
