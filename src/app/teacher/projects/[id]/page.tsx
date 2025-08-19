"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TextWithTables from "@/components/ui/text-with-tables";
import { 
  Users, 
  BookOpen, 
  Clock, 
  MessageSquare, 
  ArrowLeft,
  Eye,
  CheckCircle,
  Circle,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Edit
} from "lucide-react";

interface ProjectInput {
  id: string;
  stepId: string;
  componentId: string;
  value: string;
  fileUrl?: string;
  step: {
    title: string;
    order: number;
  };
  component: {
    label: string;
    type: string;
    required: boolean;
  };
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
  grade?: number;
  createdAt: string;
  updatedAt: string;
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
    description?: string;
    steps: Array<{
      id: string;
      title: string;
      description?: string;
      order: number;
      isRequired: boolean;
      components: Array<{
        id: string;
        type: string;
        label: string;
        placeholder?: string;
        required: boolean;
        order: number;
      }>;
    }>;
  };
  inputs: ProjectInput[];
  feedbacks: Feedback[];
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const getProjectProgress = () => {
    if (!project?.template.steps) return { completed: 0, total: 1 };

    const totalSteps = project.template.steps.length;
    const completedSteps = project.template.steps.filter(step => {
      const stepInputs = project.inputs.filter(input => input.stepId === step.id);
      const requiredComponents = step.components.filter(c => c.required);
      // 필수 컴포넌트가 없으면 전체 컴포넌트를 기준으로 계산
      const targetComponents = requiredComponents.length > 0 ? requiredComponents : step.components;
      
      const completedComponents = targetComponents.filter(component => {
        return stepInputs.some(input => 
          input.componentId === component.id && 
          input.value && 
          input.value.trim().length > 0
        );
      });
      return completedComponents.length === targetComponents.length && targetComponents.length > 0;
    }).length;

    return { completed: completedSteps, total: totalSteps };
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

  const getInputByComponent = (stepId: string, componentId: string) => {
    return project?.inputs.find(input => 
      input.stepId === stepId && input.componentId === componentId
    );
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

  const progress = getProjectProgress();
  const progressPercentage = (progress.completed / progress.total) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push("/teacher/projects")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                프로젝트 목록으로
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <p className="text-gray-600">{project.student.name}의 탐구 프로젝트</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link href={`/teacher/projects/${projectId}/feedback`}>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  피드백 작성
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 프로젝트 기본 정보 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              프로젝트 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <span className="text-sm text-gray-500">학생</span>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{project.student.name}</span>
                </div>
                <p className="text-xs text-gray-500">{project.student.email}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">클래스</span>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{project.class.name}</span>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">상태</span>
                <div className="mt-1">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusText(project.status)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">진행률</span>
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {progress.completed}/{progress.total} 단계 완료
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
              <div>
                <span className="text-sm text-gray-500">템플릿</span>
                <p className="font-medium">{project.template.title}</p>
                {project.template.description && (
                  <p className="text-sm text-gray-600 mt-1">{project.template.description}</p>
                )}
              </div>
              
              <div>
                <span className="text-sm text-gray-500">일정</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>시작일: {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span>수정일: {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 탐구 단계별 내용 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              탐구 단계별 내용
            </CardTitle>
            <CardDescription>
              학생이 작성한 각 단계별 내용을 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {project.template.steps
                .sort((a, b) => a.order - b.order)
                .map((step) => {
                  const stepInputs = project.inputs.filter(input => input.stepId === step.id);
                  const stepFeedbacks = project.feedbacks.filter(feedback => feedback.stepId === step.id);
                  const requiredComponents = step.components.filter(c => c.required);
                  const completedComponents = requiredComponents.filter(component => {
                    return stepInputs.some(input => 
                      input.componentId === component.id && 
                      input.value && 
                      input.value.trim().length > 0
                    );
                  });
                  const isStepCompleted = completedComponents.length === requiredComponents.length;

                  return (
                    <div key={step.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {isStepCompleted ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-400" />
                              )}
                              <h3 className="text-lg font-medium">{step.title}</h3>
                            </div>
                            <Badge variant={isStepCompleted ? "default" : "secondary"}>
                              {isStepCompleted ? "완료" : "미완료"}
                            </Badge>
                          </div>
                          {step.description && (
                            <p className="text-sm text-gray-600 mb-4">{step.description}</p>
                          )}
                        </div>
                      </div>

                      {/* 컴포넌트별 입력 내용 */}
                      <div className="space-y-4">
                        {step.components
                          .sort((a, b) => a.order - b.order)
                          .map((component) => {
                            const input = getInputByComponent(step.id, component.id);
                            const hasValue = input?.value && input.value.trim().length > 0;

                            return (
                              <div key={component.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-sm">{component.label}</span>
                                  {component.required && (
                                    <span className="text-red-500 text-xs">*필수</span>
                                  )}
                                  {hasValue ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                
                                {hasValue ? (
                                  <div className="bg-white rounded border p-3">
                                    {component.type === 'file' && input?.fileUrl ? (
                                      <div>
                                        <p className="text-sm text-gray-600 mb-2">첨부 파일:</p>
                                        <a 
                                          href={input.fileUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                          파일 보기
                                        </a>
                                      </div>
                                    ) : (
                                      <TextWithTables>{input?.value || ''}</TextWithTables>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">
                                    아직 작성되지 않았습니다.
                                  </p>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      {/* 단계별 피드백 */}
                      {stepFeedbacks.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            교사 피드백
                          </h4>
                          <div className="space-y-3">
                            {stepFeedbacks.map((feedback) => (
                              <div key={feedback.id} className="bg-blue-50 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs text-blue-600 font-medium">
                                    {feedback.teacher.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(feedback.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{feedback.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* 전체 피드백 요약 */}
        {project.feedbacks.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                전체 피드백 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                총 {project.feedbacks.length}개의 피드백이 작성되었습니다.
              </div>
              <div className="flex gap-2">
                <Link href={`/teacher/projects/${projectId}/feedback`}>
                  <Button size="sm">
                    <Edit className="h-3 w-3 mr-1" />
                    새 피드백 작성
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
