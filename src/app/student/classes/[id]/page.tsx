"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BookOpen, 
  Clock, 
  ArrowLeft,
  Play,
  CheckCircle,
  Calendar,
  User,
  Eye,
  RotateCcw
} from "lucide-react";

interface ClassActivity {
  id: string;
  title: string;
  description?: string;
  template: {
    id: string;
    title: string;
    description?: string;
    steps: any[];
  };
  dueDate?: string;
  status: string;
  createdAt: string;
}

interface StudentProject {
  id: string;
  title: string;
  status: string;
  templateId: string;
  classId: string;
  activityId?: string;
  updatedAt: string;
  template?: {
    title: string;
  };
}

interface ClassInfo {
  id: string;
  name: string;
  description?: string;
  teacher: {
    name: string;
  };
  activities: ClassActivity[];
}

export default function ClassActivitiesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [classId, setClassId] = useState<string>("");
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [studentProjects, setStudentProjects] = useState<StudentProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setClassId(id);
      fetchClassActivities(id);
      fetchStudentProjects(id);
    });
  }, []);

  const fetchClassActivities = async (id: string) => {
    try {
      const response = await fetch(`/api/classes/${id}/activities`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setClassInfo(data.class);
      } else {
        router.push("/student/explore");
      }
    } catch (error) {
      console.error("Failed to fetch class activities:", error);
      router.push("/student/explore");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentProjects = async (id: string) => {
    try {
      const response = await fetch(`/api/projects?classId=${id}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudentProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to fetch student projects:", error);
    }
  };

  const handleStartActivity = async (templateId: string) => {
    // 해당 템플릿과 클래스로 기존 프로젝트가 있는지 확인
    const existingProject = studentProjects.find(
      project => project.templateId === templateId && project.classId === classId
    );

    if (existingProject) {
      // 기존 프로젝트가 있으면 해당 프로젝트로 이동
      router.push(`/student/projects/${existingProject.id}`);
    } else {
      // 기존 프로젝트가 없으면 바로 새 프로젝트 생성
      try {
        // 먼저 템플릿 정보를 가져와서 프로젝트 제목 생성
        const templateResponse = await fetch(`/api/templates/${templateId}`, {
          credentials: "include"
        });
        
        if (!templateResponse.ok) {
          alert("템플릿을 찾을 수 없습니다.");
          return;
        }
        
        const templateData = await templateResponse.json();
        const template = templateData.template;
        
        // 프로젝트 생성
        const createResponse = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: `${template.title} - ${new Date().toLocaleDateString()}`,
            templateId: templateId,
            classId: classId,
          }),
        });

        if (createResponse.ok) {
          const projectData = await createResponse.json();
          // 생성된 프로젝트로 바로 이동
          router.push(`/student/projects/${projectData.project.id}`);
        } else {
          const error = await createResponse.json();
          alert(error.error || "프로젝트 생성에 실패했습니다.");
        }
      } catch (error) {
        console.error("Project creation error:", error);
        alert("프로젝트 생성 중 오류가 발생했습니다.");
      }
    }
  };

  // 특정 활동에 대한 기존 프로젝트 찾기 헬퍼 함수
  const getExistingProject = (templateId: string) => {
    return studentProjects.find(
      project => project.templateId === templateId && project.classId === classId
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">클래스 활동을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              클래스를 찾을 수 없습니다
            </h3>
            <Button onClick={() => router.push("/student/explore")}>
              탐구 페이지로 돌아가기
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
                onClick={() => router.push("/student/explore")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                탐구 페이지로
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classInfo.name}</h1>
                <p className="text-gray-600">담당: {classInfo.teacher.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 클래스 정보 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              클래스 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">클래스명:</span> {classInfo.name}
              </div>
              <div>
                <span className="font-medium">담당교사:</span> {classInfo.teacher.name}
              </div>
              {classInfo.description && (
                <div>
                  <span className="font-medium">설명:</span> {classInfo.description}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 탐구 활동 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              탐구 활동 목록
            </CardTitle>
            <CardDescription>
              교사가 제공한 탐구 활동들을 확인하고 참여하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classInfo.activities && classInfo.activities.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  아직 등록된 탐구 활동이 없습니다
                </h3>
                <p className="text-gray-500">
                  교사가 탐구 활동을 등록할 때까지 기다려주세요.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classInfo.activities?.map((activity) => (
                  <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{activity.title}</CardTitle>
                          {activity.title !== activity.template.title && (
                            <CardDescription className="mt-1">
                              템플릿: {activity.template.title}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            선생님 제공
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {activity.description && (
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.template.steps.length}단계
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {activity.dueDate && (
                          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                            마감일: {new Date(activity.dueDate).toLocaleDateString()}
                          </div>
                        )}

                        <div className="pt-2">
                          {(() => {
                            const existingProject = getExistingProject(activity.template.id);
                            const isDisabled = activity.status !== "ACTIVE";
                            
                            if (existingProject) {
                              return (
                                <div className="space-y-2">
                                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3" />
                                    진행 중인 프로젝트: {existingProject.title}
                                    <Badge variant="outline" className="ml-auto">
                                      {existingProject.status === "COMPLETED" ? "완료" : 
                                       existingProject.status === "SUBMITTED" ? "제출됨" : "진행중"}
                                    </Badge>
                                  </div>
                                  <Button 
                                    className="w-full"
                                    onClick={() => handleStartActivity(activity.template.id)}
                                    disabled={isDisabled}
                                    variant={existingProject.status === "COMPLETED" || existingProject.status === "SUBMITTED" ? "outline" : "default"}
                                  >
                                    {existingProject.status === "COMPLETED" ? (
                                      <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        완료된 탐구 보기
                                      </>
                                    ) : existingProject.status === "SUBMITTED" ? (
                                      <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        탐구 내용보기
                                      </>
                                    ) : (
                                      <>
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        탐구 계속하기
                                      </>
                                    )}
                                  </Button>
                                </div>
                              );
                            } else {
                              return (
                                <Button 
                                  className="w-full"
                                  onClick={() => handleStartActivity(activity.template.id)}
                                  disabled={isDisabled}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  탐구 시작하기
                                </Button>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 내 전체 프로젝트 목록 */}
        {studentProjects.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                이 클래스에서 내가 작성한 모든 프로젝트 ({studentProjects.length}개)
              </CardTitle>
              <CardDescription>
                현재 제공된 활동 외에도 이전에 작성한 프로젝트들을 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentProjects
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((project) => (
                    <div key={project.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{project.title}</h4>
                          <p className="text-sm text-gray-600">템플릿: {project.template?.title || "알 수 없음"}</p>
                          <p className="text-xs text-gray-500">
                            수정일: {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={project.status === "SUBMITTED" ? "default" : "secondary"}
                            className={
                              project.status === "SUBMITTED" 
                                ? "bg-green-600" 
                                : project.status === "COMPLETED"
                                ? "bg-orange-600"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {project.status === "SUBMITTED" ? "제출완료" : 
                             project.status === "COMPLETED" ? "완료" : 
                             project.status === "IN_PROGRESS" ? "진행중" : "초안"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/student/projects/${project.id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            보기
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 참고사항 */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 탐구 활동 참여 안내</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 각 탐구 활동은 단계별로 진행됩니다</li>
              <li>• 입력 내용은 자동으로 저장되어 나중에 계속할 수 있습니다</li>
              <li>• 완료된 탐구는 교사의 피드백을 받을 수 있습니다</li>
              <li>• 마감일이 있는 활동은 기한 내에 완료해주세요</li>
              <li>• 위의 "내가 작성한 모든 프로젝트" 섹션에서 이전 작업도 확인할 수 있습니다</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
