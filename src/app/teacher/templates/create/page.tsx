"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TemplateEditor from "@/components/template-editor/template-editor";
import { TemplateStep } from "@/components/template-editor/template-step";

export default function CreateTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (template: {
    title: string;
    description?: string;
    steps: TemplateStep[];
  }) => {
    setIsLoading(true);
    
    try {
      // API 형태에 맞게 변환
      const templateData = {
        title: template.title,
        description: template.description,
        steps: template.steps.map(step => ({
          title: step.title,
          description: step.description,
          order: step.order,
          isRequired: step.isRequired,
          components: step.components.map(component => ({
            type: component.type,
            label: component.label,
            placeholder: component.placeholder,
            required: component.required,
            order: component.order,
            options: component.options,
          })),
        })),
      };

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        router.push("/teacher/templates?message=템플릿이 성공적으로 생성되었습니다.");
      } else {
        const error = await response.json();
        alert(error.error || "템플릿 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Save template error:", error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (template: {
    title: string;
    description?: string;
    steps: TemplateStep[];
  }) => {
    // 미리보기 모달을 열거나 새 창에서 미리보기
    console.log("Preview template:", template);
    // TODO: 미리보기 기능 구현
    alert("미리보기 기능은 곧 추가됩니다!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">템플릿을 저장하는 중...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">새 템플릿 만들기</h1>
              <p className="text-gray-600">탐구 활동을 위한 단계별 템플릿을 설계하세요.</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="h-[calc(100vh-80px)]">
        <TemplateEditor 
          onSave={handleSave}
          onPreview={handlePreview}
        />
      </div>
    </div>
  );
}
