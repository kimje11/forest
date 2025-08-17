"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  CheckCircle, 
  Circle, 
  FileText, 
  Upload,
  MessageSquare,
  Brain,
  Clock,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import TopicSuggestion from "@/components/ai/topic-suggestion";
import MathEditor from "@/components/ui/math-editor";

interface ProjectInput {
  stepId: string;
  componentId: string;
  value?: string;
  fileUrl?: string;
}

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

interface Project {
  id: string;
  title?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  template: {
    title: string;
    description?: string;
    steps: Step[];
  };
  class?: {
    name: string;
    teacher: {
      name: string;
    };
  };
  inputs: ProjectInput[];
  feedbacks: any[];
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  // Debounced inputs for auto-save
  const debouncedInputs = useDebounce(inputs, 1000);

  useEffect(() => {
    params.then(({ id }) => {
      setProjectId(id);
      fetchProject(id);
    });
  }, []);

  useEffect(() => {
    if (projectId && Object.keys(debouncedInputs).length > 0) {
      saveInputs();
    }
  }, [debouncedInputs, projectId]);

  const fetchProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        
        // 기존 입력값들을 로드
        const inputMap: Record<string, string> = {};
        data.project.inputs.forEach((input: ProjectInput) => {
          const key = `${input.stepId}-${input.componentId}`;
          inputMap[key] = input.value || "";
        });
        setInputs(inputMap);
      } else {
        router.push("/student/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
      router.push("/student/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const saveInputs = useCallback(async () => {
    if (!projectId) return;

    setSaveStatus("saving");
    
    try {
      const savePromises = Object.entries(debouncedInputs).map(([key, value]) => {
        const [stepId, componentId] = key.split("-");
        return fetch(`/api/projects/${projectId}/inputs`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            stepId,
            componentId,
            value,
          }),
        });
      });

      await Promise.all(savePromises);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
    }
  }, [projectId, debouncedInputs]);

  const handleSaveProject = async (status: "DRAFT" | "SUBMITTED") => {
    if (!projectId) return;

    setSaveStatus("saving");
    
    try {
      // 먼저 현재 입력값들을 저장
      if (Object.keys(inputs).length > 0) {
        const savePromises = Object.entries(inputs).map(([key, value]) => {
          const [stepId, componentId] = key.split("-");
          return fetch(`/api/projects/${projectId}/inputs`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              stepId,
              componentId,
              value,
            }),
          });
        });

        await Promise.all(savePromises);
      }
      
      // 프로젝트 상태 업데이트
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status,
        }),
      });

      if (response.ok) {
        const message = status === "DRAFT" ? "임시저장되었습니다." : "탐구 보고서가 제출되었습니다.";
        alert(message);
        
        // 프로젝트 상태 업데이트
        setProject(prev => prev ? { ...prev, status } : null);
        
        // 제출 후에는 페이지를 유지하고 읽기 전용으로 표시
        if (status === "SUBMITTED") {
          // 페이지 새로고침하여 최신 상태 반영
          window.location.reload();
        }
      } else {
        const error = await response.json();
        console.error("Server error details:", error);
        alert(error.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Save project error:", error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setSaveStatus("saved");
    }
  };

  const handleInputChange = (stepId: string, componentId: string, value: string) => {
    const key = `${stepId}-${componentId}`;
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const getInputValue = (stepId: string, componentId: string) => {
    const key = `${stepId}-${componentId}`;
    return inputs[key] || "";
  };

  const renderComponent = (step: Step, component: Component) => {
    const inputValue = getInputValue(step.id, component.id);
    const isSubmitted = project?.status === "SUBMITTED";

    switch (component.type) {
      case "TEXT":
        return (
          <Input
            value={inputValue}
            onChange={isSubmitted ? undefined : (e) => handleInputChange(step.id, component.id, e.target.value)}
            placeholder={component.placeholder}
            className={`w-full ${isSubmitted ? "bg-gray-50 cursor-not-allowed" : ""}`}
            readOnly={isSubmitted}
          />
        );

      case "TEXTAREA":
        return (
          <MathEditor
            value={inputValue}
            onChange={isSubmitted ? () => {} : (value) => handleInputChange(step.id, component.id, value)}
            placeholder={component.placeholder || "수학 식을 포함한 텍스트를 입력하세요..."}
            disabled={isSubmitted}
            className={isSubmitted ? "opacity-60" : ""}
          />
        );

      case "FILE_UPLOAD":
        return (
          <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center ${isSubmitted ? "bg-gray-50" : ""}`}>
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {isSubmitted ? "파일 업로드 불가 (제출됨)" : "파일을 드래그하거나 클릭하여 업로드"}
            </p>
            {!isSubmitted && (
              <input
                type="file"
                className="mt-2"
                onChange={(e) => {
                  // TODO: 파일 업로드 처리
                  console.log("File upload:", e.target.files);
                }}
              />
            )}
          </div>
        );

      case "MULTIPLE_CHOICE":
        const options = component.options ? JSON.parse(component.options) : [];
        return (
          <select
            value={inputValue}
            onChange={isSubmitted ? undefined : (e) => handleInputChange(step.id, component.id, e.target.value)}
            className={`w-full p-2 border rounded-md ${isSubmitted ? "bg-gray-50 cursor-not-allowed" : ""}`}
            disabled={isSubmitted}
          >
            <option value="">선택해주세요</option>
            {options.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "CHECKBOX":
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inputValue === "true"}
              onChange={(e) => handleInputChange(step.id, component.id, e.target.checked.toString())}
              className="h-4 w-4"
            />
            <span className="text-sm">{component.label}</span>
          </label>
        );

      case "AI_TOPIC_HELPER":
        return (
          <TopicSuggestion
            onSelectTopic={(topic) => {
              // 다음 컴포넌트에 주제 자동 입력
              const nextComponent = step.components.find(c => c.order === component.order + 1);
              if (nextComponent) {
                handleInputChange(step.id, nextComponent.id, topic.title);
              }
            }}
          />
        );

      default:
        return <div className="text-gray-500">지원하지 않는 컴포넌트 타입입니다.</div>;
    }
  };

  const getStepProgress = (step: Step) => {
    const requiredComponents = step.components.filter(c => c.required);
    // 필수 컴포넌트가 없으면 전체 컴포넌트를 기준으로 계산
    const targetComponents = requiredComponents.length > 0 ? requiredComponents : step.components;
    
    const completedComponents = targetComponents.filter(c => {
      const value = getInputValue(step.id, c.id);
      return value && value.trim().length > 0;
    });
    
    return {
      completed: completedComponents.length,
      total: targetComponents.length,
      isComplete: completedComponents.length === targetComponents.length
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              프로젝트를 찾을 수 없습니다
            </h3>
            <Button onClick={() => router.push("/student/dashboard")}>
              대시보드로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = project.template.steps[currentStepIndex];
  const stepProgress = getStepProgress(currentStep);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600">{project.template.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === "saving" && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-blue-600">자동 저장 중...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">자동 저장됨</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <Circle className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">저장 실패</span>
                  </>
                )}
              </div>
              <Button variant="outline" onClick={() => router.push("/student/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                대시보드로
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 제출 상태 안내 */}
      {project.status === "SUBMITTED" && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <div>
                <p className="text-green-700 font-medium">
                  탐구 보고서가 제출되었습니다.
                </p>
                <p className="text-green-600 text-sm">
                  제출된 내용은 더 이상 수정할 수 없습니다. 교사의 피드백을 기다려주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 단계 목록 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">탐구 단계</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.template.steps.map((step, index) => {
                  const progress = getStepProgress(step);
                  const isActive = index === currentStepIndex;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStepIndex(index)}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        isActive 
                          ? "bg-blue-50 border-blue-200 text-blue-900" 
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {progress.isComplete ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium">
                            단계 {step.order}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {progress.completed}/{progress.total}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{step.title}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* 현재 단계 내용 */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      단계 {currentStep.order}: {currentStep.title}
                      {currentStep.isRequired && (
                        <Badge variant="destructive" className="text-xs">필수</Badge>
                      )}
                    </CardTitle>
                    {currentStep.description && (
                      <CardDescription className="mt-2">
                        {currentStep.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={stepProgress.isComplete ? "default" : "secondary"}>
                    {stepProgress.completed}/{stepProgress.total} 완료
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentStep.components
                  .sort((a, b) => a.order - b.order)
                  .map((component) => (
                    <div key={component.id} className="space-y-2">
                      <label className="block text-sm font-medium">
                        {component.label}
                        {component.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {renderComponent(currentStep, component)}
                    </div>
                  ))}

                {/* 단계 네비게이션 */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                    disabled={currentStepIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    이전 단계
                  </Button>
                  
                  <div className="flex gap-2">
                    {project.status === "SUBMITTED" ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-md">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">제출 완료</span>
                      </div>
                    ) : (
                      <>
                        {currentStepIndex === project.template.steps.length - 1 ? (
                          <Button
                            onClick={() => {
                              const confirmed = confirm(
                                "정말로 제출하시겠습니까?\n\n⚠️ 제출 후에는 수정이 불가능합니다.\n모든 내용을 확인하신 후 제출해주세요."
                              );
                              if (confirmed) {
                                handleSaveProject("SUBMITTED");
                              }
                            }}
                            disabled={saveStatus === "saving"}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            제출하기
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setCurrentStepIndex(Math.min(project.template.steps.length - 1, currentStepIndex + 1))}
                          >
                            다음 단계
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
