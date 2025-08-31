"use client";

import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, Eye } from "lucide-react";
import ComponentPalette from "./component-palette";
import TemplateStepComponent, { TemplateStep, TemplateComponent } from "./template-step";

interface TemplateEditorProps {
  onSave: (template: {
    title: string;
    description?: string;
    steps: TemplateStep[];
  }) => void;
  onPreview: (template: {
    title: string;
    description?: string;
    steps: TemplateStep[];
  }) => void;
  initialTemplate?: {
    title: string;
    description?: string;
    steps: TemplateStep[];
  };
}

export default function TemplateEditor({ 
  onSave, 
  onPreview, 
  initialTemplate 
}: TemplateEditorProps) {
  const [title, setTitle] = useState(initialTemplate?.title || "");
  const [description, setDescription] = useState(initialTemplate?.description || "");
  const [steps, setSteps] = useState<TemplateStep[]>(
    initialTemplate?.steps?.map(step => ({
      ...step,
      components: step.components || []
    })) || []
  );

  const addStep = () => {
    const newStep: TemplateStep = {
      id: `step-${Date.now()}`,
      title: "제목 입력",
      description: "",
      order: steps.length + 1,
      isRequired: false,
      components: [],
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (stepId: string, updates: Partial<TemplateStep>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const deleteStep = (stepId: string) => {
    const filteredSteps = steps.filter(step => step.id !== stepId);
    // 순서 재정렬
    const reorderedSteps = filteredSteps.map((step, index) => ({
      ...step,
      order: index + 1,
    }));
    setSteps(reorderedSteps);
  };



  const addComponent = (
    stepId: string, 
    component: Omit<TemplateComponent, "id" | "order">
  ) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        const newComponent: TemplateComponent = {
          ...component,
          id: `component-${Date.now()}`,
          order: step.components.length + 1,
        };
        return {
          ...step,
          components: [...step.components, newComponent],
        };
      }
      return step;
    }));
  };

  const updateComponent = (
    stepId: string, 
    componentId: string, 
    updates: Partial<TemplateComponent>
  ) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          components: step.components.map(component =>
            component.id === componentId 
              ? { ...component, ...updates }
              : component
          ),
        };
      }
      return step;
    }));
  };

  const deleteComponent = (stepId: string, componentId: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        const filteredComponents = step.components.filter(
          component => component.id !== componentId
        );
        // 순서 재정렬
        const reorderedComponents = filteredComponents.map((component, index) => ({
          ...component,
          order: index + 1,
        }));
        return {
          ...step,
          components: reorderedComponents,
        };
      }
      return step;
    }));
  };

  const handleSave = () => {
    // 제목 유효성 검사
    if (!title.trim()) {
      alert("템플릿 제목을 입력해주세요.");
      return;
    }
    
    // 단계 유효성 검사
    if (steps.length === 0) {
      alert("최소 하나의 단계를 추가해주세요.");
      return;
    }
    
    const template = {
      title,
      description: description || undefined,
      steps,
    };
    onSave(template);
  };

  const handlePreview = () => {
    const template = {
      title,
      description: description || undefined,
      steps,
    };
    onPreview(template);
  };

  const canPreview = title.trim() && steps.length > 0;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        {/* 헤더 */}
        <div className="flex-shrink-0 p-6 border-b bg-white">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-4 mr-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  템플릿 제목 *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 수학 탐구 활동 템플릿"
                  className="text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  템플릿 설명
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="이 템플릿에 대한 간단한 설명을 입력하세요"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handlePreview}
                disabled={!canPreview}
              >
                <Eye className="h-4 w-4 mr-2" />
                미리보기
              </Button>
              <Button 
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                저장
              </Button>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 컴포넌트 팔레트 */}
          <div className="w-80 flex-shrink-0 p-6 border-r bg-gray-50 overflow-y-auto">
            <ComponentPalette />
          </div>

          {/* 템플릿 편집 영역 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">탐구 단계 구성</h2>
                <Button onClick={addStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  단계 추가
                </Button>
              </div>

              {steps.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      첫 번째 단계를 추가해보세요
                    </h3>
                    <p className="text-gray-500 mb-4">
                      탐구 활동의 첫 번째 단계를 만들어 학생들의 학습 여정을 시작해보세요.
                    </p>
                    <Button onClick={addStep}>
                      <Plus className="h-4 w-4 mr-2" />
                      단계 추가
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {steps
                    .sort((a, b) => a.order - b.order)
                    .map((step) => (
                      <TemplateStepComponent
                        key={step.id}
                        step={step}
                        onUpdateStep={updateStep}
                        onDeleteStep={deleteStep}
                        onAddComponent={addComponent}
                        onUpdateComponent={updateComponent}
                        onDeleteComponent={deleteComponent}
                      />
                    ))}
                </div>
              )}

              {/* 저장 안내 */}
              {steps.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">
                          템플릿이 준비되었습니다!
                        </h4>
                        <p className="text-sm text-blue-700">
                          {steps.length}개의 단계와 {" "}
                          {steps.reduce((total, step) => total + step.components.length, 0)}개의 컴포넌트가 구성되었습니다. 저장해보세요.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handlePreview}
                          disabled={!canPreview}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          미리보기
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          저장
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
