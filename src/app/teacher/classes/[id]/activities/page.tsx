"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BookOpen, 
  Plus, 
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  Clock
} from "lucide-react";

interface Template {
  id: string;
  title: string;
  description?: string;
  steps: any[];
}

interface ClassActivity {
  id: string;
  title: string;
  description?: string;
  template: Template;
  isActive: boolean;
  dueDate?: string;
  createdAt: string;
}

interface ClassInfo {
  id: string;
  name: string;
  description?: string;
  activities: ClassActivity[];
}

export default function TeacherClassActivitiesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [classId, setClassId] = useState<string>("");
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    templateId: "",
    dueDate: "",
  });

  useEffect(() => {
    params.then(({ id }) => {
      setClassId(id);
      fetchClassInfo(id);
      fetchTemplates();
    });
  }, []);

  const fetchClassInfo = async (id: string) => {
    try {
      const response = await fetch(`/api/teacher/classes/${id}/activities`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setClassInfo(data.class);
      }
    } catch (error) {
      console.error("Failed to fetch class info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const handleCreateActivity = async () => {
    if (!newActivity.title || !newActivity.templateId) {
      alert("활동 제목과 템플릿을 선택해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/classes/${classId}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newActivity),
      });

      if (response.ok) {
        alert("클래스 활동이 생성되었습니다.");
        setShowCreateForm(false);
        setNewActivity({ title: "", description: "", templateId: "", dueDate: "" });
        fetchClassInfo(classId);
      } else {
        const error = await response.json();
        alert(error.error || "활동 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Create activity error:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">클래스 정보를 불러오는 중...</p>
        </div>
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
                onClick={() => router.push("/teacher/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                대시보드로
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">클래스 활동 관리</h1>
                <p className="text-gray-600">{classInfo?.name}</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              활동 추가
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 활동 생성 폼 */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>새 활동 만들기</CardTitle>
              <CardDescription>
                학생들에게 할당할 탐구 활동을 만드세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">활동 제목 *</label>
                  <Input
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                    placeholder="탐구 활동 제목을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">템플릿 선택 *</label>
                  <select
                    value={newActivity.templateId}
                    onChange={(e) => setNewActivity({ ...newActivity, templateId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">템플릿을 선택하세요</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.title} ({template.steps?.length || 0}단계)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">활동 설명</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  placeholder="활동에 대한 설명을 입력하세요"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">마감일 (선택사항)</label>
                <Input
                  type="datetime-local"
                  value={newActivity.dueDate}
                  onChange={(e) => setNewActivity({ ...newActivity, dueDate: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCreateActivity}>활동 생성</Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 활동 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              클래스 활동 목록
            </CardTitle>
            <CardDescription>
              학생들에게 할당된 탐구 활동들을 관리하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!classInfo?.activities || classInfo.activities.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  아직 등록된 활동이 없습니다
                </h3>
                <p className="text-gray-500 mb-4">
                  학생들을 위한 첫 번째 탐구 활동을 만들어보세요.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  활동 추가하기
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classInfo.activities.map((activity) => (
                  <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{activity.title}</CardTitle>
                          <CardDescription className="mt-1">
                            템플릿: {activity.template.title}
                          </CardDescription>
                        </div>
                        <Badge variant={activity.isActive ? "default" : "secondary"}>
                          {activity.isActive ? "활성" : "비활성"}
                        </Badge>
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
                            {activity.template.steps?.length || 0}단계
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

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            수정
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="h-3 w-3 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
