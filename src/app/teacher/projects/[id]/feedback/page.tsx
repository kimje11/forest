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
    steps: ProjectStep[];
  };
  feedbacks: Feedback[];
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 사이드바: 단계 선택 */}
          <div className="space-y-6">
            {/* 프로젝트 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  프로젝트 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>

            {/* 단계 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  피드백 대상 선택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* 전체 피드백 */}
                  <button
                    onClick={() => setSelectedStep("general")}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedStep === "general"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">전체 피드백</p>
                        <p className="text-xs text-gray-500">프로젝트 전반에 대한 피드백</p>
                      </div>
                      <Badge variant="outline">
                        {getStepFeedbacks(null).length}개
                      </Badge>
                    </div>
                  </button>

                  {/* 단계별 피드백 */}
                  {project.template.steps
                    .sort((a, b) => a.order - b.order)
                    .map((step) => (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStep(step.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedStep === step.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{step.title}</p>
                            <p className="text-xs text-gray-500">단계 {step.order}</p>
                          </div>
                          <Badge variant="outline">
                            {getStepFeedbacks(step.id).length}개
                          </Badge>
                        </div>
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 메인 컨텐츠: 피드백 작성 및 목록 */}
          <div className="lg:col-span-2 space-y-6">
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      피드백 내용 *
                    </label>
                    <textarea
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="학생에게 도움이 될 수 있는 구체적이고 건설적인 피드백을 작성해주세요..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={6}
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
                          <p className="whitespace-pre-wrap text-sm">{feedback.content}</p>
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
