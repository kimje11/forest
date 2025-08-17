"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical
} from "lucide-react";
import TemplateEditor from "@/components/template-editor/template-editor";

interface Template {
  id: string;
  title: string;
  description?: string;
  isDefault: boolean;
  steps: any[];
}

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

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
        setTitle(data.template.title);
        setDescription(data.template.description || "");
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

  const handleSave = async () => {
    if (!template) return;

    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (response.ok) {
        router.push(`/teacher/templates/${templateId}`);
      } else {
        const error = await response.json();
        alert(error.error || "템플릿 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Save template error:", error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
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

  if (template.isDefault) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              기본 템플릿은 편집할 수 없습니다
            </h3>
            <p className="text-gray-500 mb-4">
              기본 템플릿을 복제하여 새로운 템플릿을 만드세요.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/teacher/templates/${templateId}`)}
              >
                돌아가기
              </Button>
              <Button onClick={() => router.push("/teacher/templates/create")}>
                새 템플릿 만들기
              </Button>
            </div>
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
                onClick={() => router.push(`/teacher/templates/${templateId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                돌아가기
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">템플릿 편집</h1>
                <p className="text-gray-600">탐구 템플릿을 수정하세요.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push(`/teacher/templates/${templateId}`)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 기본 정보 편집 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>
              템플릿의 제목과 설명을 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목 *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="템플릿 제목을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="템플릿에 대한 설명을 입력하세요"
                className="w-full p-3 border rounded-md resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 템플릿 에디터 */}
        <Card>
          <CardHeader>
            <CardTitle>탐구 단계 편집</CardTitle>
            <CardDescription>
              드래그 앤 드롭으로 단계와 컴포넌트를 구성하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateEditor 
              initialTemplate={{
                title: template.title,
                description: template.description || "",
                steps: template.steps || []
              }}
              onSave={async (updatedTemplate) => {
                // 기본 정보는 별도로 저장되므로, 단계 정보만 저장
                try {
                  // null 값을 빈 문자열로 변환
                  const cleanedSteps = updatedTemplate.steps.map(step => ({
                    ...step,
                    description: step.description || "",
                    components: step.components.map(component => ({
                      ...component,
                      placeholder: component.placeholder || "",
                      options: component.options || ""
                    }))
                  }));

                  const response = await fetch(`/api/templates/${templateId}/steps`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      steps: cleanedSteps
                    }),
                  });

                  if (response.ok) {
                    alert("단계가 저장되었습니다.");
                  } else {
                    const error = await response.json();
                    alert(error.error || "단계 저장에 실패했습니다.");
                  }
                } catch (error) {
                  console.error("Save steps error:", error);
                  alert("서버 오류가 발생했습니다.");
                }
              }}
              onPreview={(template) => {
                console.log("Preview template:", template);
              }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
