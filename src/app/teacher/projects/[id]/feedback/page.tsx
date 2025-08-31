"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BookOpen, 
  Clock, 
  MessageSquare, 
  ArrowLeft,
  Send,
  CheckCircle,
  Circle,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Plus,
  Trash2
} from "lucide-react";
import TextWithTables from "@/components/ui/text-with-tables";
import MathEditor from "@/components/ui/math-editor";

interface ProjectStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
}

interface Feedback {
  id: string;
  stepId: string;
  content: string;
  createdAt: string;
  teacher: {
    name: string;
  };
}

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
}

interface Project {
  id: string;
  title: string;
  status: string;
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
    id: string;
    title: string;
    steps: (ProjectStep & { components: Component[] })[];
  };
  feedbacks: Feedback[];
  inputs: ProjectInput[];
}

export default function ProjectFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<string>("general");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setProjectId(id);
      fetchProject(id);
    });
  }, []);

  const fetchProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        router.push("/teacher/projects");
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
      router.push("/teacher/projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) {
      alert("피드백 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          stepId: selectedStep === "general" ? null : selectedStep,
          content: feedbackContent,
        }),
      });

      if (response.ok) {
        alert("피드백이 성공적으로 작성되었습니다.");
        setFeedbackContent("");
        fetchProject(projectId); // 새로고침
      } else {
        const error = await response.json();
        alert(error.error || "피드백 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Submit feedback error:", error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm("이 피드백을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/feedback/${feedbackId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        alert("피드백이 삭제되었습니다.");
        fetchProject(projectId); // 새로고침
      } else {
        const error = await response.json();
        alert(error.error || "피드백 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete feedback error:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const getStepFeedbacks = (stepId: string | null) => {
    if (!project) return [];
    
    if (stepId === null) {
      // 전체 피드백 (stepId가 null인 것들)
      return project.feedbacks.filter(feedback => !feedback.stepId);
    }
    
    return project.feedbacks.filter(feedback => feedback.stepId === stepId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "SUBMITTED": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED": return "완료";
      case "IN_PROGRESS": return "진행중";
      case "SUBMITTED": return "제출됨";
      case "DRAFT": return "초안";
      default: return status;
    }
  };

  const renderStudentContent = (stepId: string) => {
    if (!project) return null;

    const step = project.template.steps.find(s => s.id === stepId);
    if (!step) return <p className="text-gray-500">해당 단계를 찾을 수 없습니다.</p>;

    const stepInputs = project.inputs.filter(input => input.stepId === stepId);
    
    if (stepInputs.length === 0) {
      return (
        <p className="text-gray-500 italic">학생이 아직 이 단계를 작성하지 않았습니다.</p>
      );
    }

    return (
      <div className="space-y-4">
        {step.components
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((component) => {
            const input = stepInputs.find(inp => inp.componentId === component.id);
            const value = input?.value || "";

            if (!value.trim()) {
              return (
                <div key={component.id} className="p-3 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {component.label}
                    {component.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <p className="text-gray-500 italic text-sm">작성되지 않음</p>
                </div>
              );
            }

            return (
              <div key={component.id} className="p-3 border rounded-lg bg-white">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {component.label}
                  {component.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {component.type === "FILE_UPLOAD" ? (
                  renderFileContent(value)
                ) : component.type === "TEXTAREA" ? (
                  // Math Editor 감지를 위한 플레이스홀더 확인
                  component.placeholder?.includes("Math Editor") || 
                  component.placeholder?.includes("수학 수식, 표, 이미지") ? (
                    <div className="bg-gray-50 p-4 rounded border min-h-[300px] max-h-[600px] overflow-y-auto">
                      <MathEditor
                        value={value}
                        onChange={() => {}} // 읽기 전용이므로 변경 불가
                        placeholder={component.placeholder || "내용이 없습니다."}
                        title={component.label}
                        readOnly={true}
                        className="bg-transparent"
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded border min-h-[200px] max-h-[500px] overflow-y-auto">
                      <TextWithTables className="text-sm text-gray-700">
                        {value}
                      </TextWithTables>
                    </div>
                  )
                ) : (
                  <div className="bg-gray-50 p-3 rounded border min-h-[150px] max-h-[400px] overflow-y-auto">
                    <TextWithTables className="text-sm text-gray-700">
                      {value}
                    </TextWithTables>
                  </div>
                )}

              </div>
            );
          })}
      </div>
    );
  };

  const renderFileContent = (value: string) => {
    try {
      const fileData = JSON.parse(value);
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {fileData.type?.startsWith('image/') ? (
                <img 
                  src={fileData.data} 
                  alt={fileData.name}
                  className="h-16 w-16 object-cover rounded"
                />
              ) : (
                <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileData.name}
              </p>
              <p className="text-xs text-gray-500">
                {(fileData.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-xs text-gray-400">
                업로드: {new Date(fileData.uploadedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className="bg-gray-50 p-2 rounded border">
          <p className="text-sm text-gray-700">{value}</p>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로젝트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              프로젝트를 찾을 수 없습니다
            </h3>
            <Button onClick={() => router.push("/teacher/projects")}>
              프로젝트 목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepFeedbacks = getStepFeedbacks(selectedStep === "general" ? null : selectedStep);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/teacher/projects/${projectId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                프로젝트로 돌아가기
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">피드백 작성</h1>
                <p className="text-gray-600">{project.student.name} - {project.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-screen">
          {/* 왼쪽: 학생 프로젝트 내용 */}
          <div className="space-y-4">
            {/* 단계 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  단계 선택
                </CardTitle>
                <CardDescription>
                  피드백을 작성할 단계를 선택하세요. 선택한 단계의 학생 작성 내용이 아래 표시됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {/* 전체 피드백 */}
                  <button
                    onClick={() => setSelectedStep("general")}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedStep === "general"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    전체 프로젝트 ({getStepFeedbacks(null).length})
                  </button>

                  {/* 단계별 피드백 */}
                  {project.template.steps
                    .sort((a, b) => a.order - b.order)
                    .map((step) => (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStep(step.id)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                          selectedStep === step.id
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {step.title} ({getStepFeedbacks(step.id).length})
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* 학생이 작성한 내용 */}
            {selectedStep !== "general" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    학생이 작성한 내용
                  </CardTitle>
                  <CardDescription>
                    {project.template.steps.find(s => s.id === selectedStep)?.title} 단계
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderStudentContent(selectedStep)}
                </CardContent>
              </Card>
            )}

            {selectedStep === "general" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    프로젝트 전체 내용
                  </CardTitle>
                  <CardDescription>
                    학생이 작성한 모든 단계의 내용입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {project.template.steps
                      .sort((a, b) => a.order - b.order)
                      .map((step) => (
                        <div key={step.id} className="border-l-4 border-blue-200 pl-4">
                          <h4 className="font-medium text-blue-700 mb-3">{step.title}</h4>
                          {renderStudentContent(step.id)}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 오른쪽: 피드백 작성 */}
          <div className="space-y-4">
            {/* 프로젝트 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  프로젝트 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">학생</span>
                    <p className="font-medium">{project.student.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">클래스</span>
                    <p className="font-medium">{project.class.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">상태</span>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">템플릿</span>
                    <p className="font-medium">{project.template.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* 피드백 작성 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-600" />
                  새 피드백 작성
                </CardTitle>
                <CardDescription>
                  {selectedStep === "general" 
                    ? "프로젝트 전반에 대한 피드백을 작성하세요."
                    : `"${project.template.steps.find(s => s.id === selectedStep)?.title}" 단계에 대한 피드백을 작성하세요.`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      피드백 내용 *
                    </label>
                    <MathEditor
                      value={feedbackContent}
                      onChange={setFeedbackContent}
                      placeholder="학생에게 도움이 될 수 있는 구체적이고 건설적인 피드백을 작성해주세요..."
                      title="피드백 작성"
                      className="min-h-[400px]"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmitFeedback}
                      disabled={isSubmitting || !feedbackContent.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          작성 중...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          피드백 작성
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 기존 피드백 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-600" />
                  기존 피드백 목록
                </CardTitle>
                <CardDescription>
                  {selectedStep === "general" 
                    ? "프로젝트 전반에 대한 피드백"
                    : `"${project.template.steps.find(s => s.id === selectedStep)?.title}" 단계 피드백`
                  } ({currentStepFeedbacks.length}개)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentStepFeedbacks.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">아직 작성된 피드백이 없습니다.</p>
                    <p className="text-sm text-gray-400">위에서 첫 번째 피드백을 작성해보세요.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentStepFeedbacks
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((feedback) => (
                        <div key={feedback.id} className="border rounded-lg p-4 bg-orange-50">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-orange-700">
                                {feedback.teacher.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {new Date(feedback.createdAt).toLocaleString()}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteFeedback(feedback.id)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm">
                            <TextWithTables text={feedback.content} />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
