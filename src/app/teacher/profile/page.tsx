"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Save, Eye, EyeOff } from "lucide-react";
import AuthHeader from "@/components/layout/auth-header";
import FeatureNote from "@/components/ui/feature-note";

interface Profile {
  id: string;
  email: string;
  name: string;
  studentId?: string;
  role: string;
  createdAt: string;
}

export default function TeacherProfilePage() {
  const router = useRouter();
  const { refreshDemoUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 에러 및 성공 메시지
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile", {
        credentials: "include",
      });

      console.log("Profile fetch response:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("Profile data received:", data);
        setProfile(data.profile);
        setFormData({
          name: data.profile.name || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const errorData = await response.text();
        console.error("Profile fetch error:", response.status, errorData);
        setMessage({ type: "error", text: "프로필을 불러올 수 없습니다. 다시 로그인해주세요." });
        setTimeout(() => router.push("/teacher/dashboard"), 2000);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setMessage({ type: "error", text: "서버 연결에 실패했습니다." });
      setTimeout(() => router.push("/teacher/dashboard"), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      // 비밀번호 변경 시 확인 검증
      if (formData.newPassword) {
        if (!formData.confirmPassword) {
          setMessage({ type: "error", text: "새 비밀번호 확인을 입력해주세요." });
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setMessage({ type: "error", text: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다." });
          return;
        }
        if (formData.newPassword.length < 4) {
          setMessage({ type: "error", text: "새 비밀번호는 최소 4자리여야 합니다." });
          return;
        }
      }

      const updateData: any = {
        name: formData.name,
      };

      // 비밀번호 변경 시에만 추가
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        setProfile(data.profile);
        
        // 데모 계정인 경우 localStorage 업데이트
        if (data.profile.email?.includes("@demo.com")) {
          const demoUser = localStorage.getItem('demoUser');
          if (demoUser) {
            try {
              const demoUserData = JSON.parse(demoUser);
              const updatedDemoUser = {
                ...demoUserData,
                name: data.profile.name,
              };
              localStorage.setItem('demoUser', JSON.stringify(updatedDemoUser));
              // AuthProvider에게 업데이트 알림
              refreshDemoUser();
            } catch (e) {
              console.error('Failed to update localStorage:', e);
            }
          }
        }
        
        // 비밀번호 필드 초기화
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        setMessage({ type: "error", text: data.error || "업데이트에 실패했습니다." });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({ type: "error", text: "서버 오류가 발생했습니다." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader 
        title="개인정보 수정"
        subtitle="내 정보를 관리하고 업데이트하세요"
      />
      
      {/* 뒤로 가기 버튼 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Button 
          variant="outline" 
          onClick={() => router.push("/teacher/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          대시보드로 돌아가기
        </Button>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                기본 정보
              </CardTitle>
              <CardDescription>
                이름 정보를 관리할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 이메일 (읽기 전용) */}
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">이메일은 변경할 수 없습니다.</p>
                </div>

                {/* 이름 */}
                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="이름을 입력하세요"
                    required
                    maxLength={50}
                  />
                </div>

                {/* 비밀번호 변경 섹션 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">비밀번호 변경</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    비밀번호를 변경하지 않으려면 아래 필드를 비워두세요.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 현재 비밀번호 */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">현재 비밀번호</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                          placeholder="현재 비밀번호"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* 새 비밀번호 */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">새 비밀번호</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={(e) => handleInputChange("newPassword", e.target.value)}
                          placeholder="새 비밀번호 (최소 4자)"
                          minLength={4}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* 새 비밀번호 확인 */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          placeholder="새 비밀번호를 다시 입력"
                          className={
                            formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : formData.confirmPassword && formData.newPassword === formData.confirmPassword
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                              : ""
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {/* 실시간 비밀번호 일치 검사 */}
                      {formData.confirmPassword && (
                        <p className={`text-xs ${
                          formData.newPassword === formData.confirmPassword 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          {formData.newPassword === formData.confirmPassword 
                            ? "✓ 비밀번호가 일치합니다" 
                            : "✗ 비밀번호가 일치하지 않습니다"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 메시지 표시 */}
                {message && (
                  <div className={`p-3 rounded-md ${
                    message.type === "success" 
                      ? "bg-green-50 text-green-800 border border-green-200" 
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* 저장 버튼 */}
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSaving || !formData.name.trim()}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        변경사항 저장
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 계정 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>계정 정보</CardTitle>
              <CardDescription>
                읽기 전용 계정 정보입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">계정 유형</Label>
                  <p className="text-sm font-medium">{profile?.role === "TEACHER" ? "교사" : "학생"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">가입일</Label>
                  <p className="text-sm font-medium">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 기능 안내 */}
          <FeatureNote title="개인정보 수정 기능">
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 이름을 언제든지 수정할 수 있습니다</li>
              <li>• 비밀번호 변경 시 현재 비밀번호 확인이 필요합니다</li>
              <li>• 모든 변경사항은 즉시 적용됩니다</li>
              <li>• 학번은 학생 계정에서만 관리할 수 있습니다</li>
            </ul>
          </FeatureNote>
        </div>
      </main>
    </div>
  );
}
