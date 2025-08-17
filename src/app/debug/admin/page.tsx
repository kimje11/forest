"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminDebugPage() {
  const [adminStatus, setAdminStatus] = useState<any>(null);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/setup', {
        method: 'GET'
      });
      const data = await response.json();
      setAdminStatus(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupAdmin = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      const data = await response.json();
      setSetupResult(data);
      // 설정 후 상태 다시 확인
      await checkAdminStatus();
    } catch (error) {
      console.error('Error setting up admin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>관리자 계정 디버그 페이지</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={checkAdminStatus} disabled={loading}>
                관리자 상태 확인
              </Button>
              <Button onClick={setupAdmin} disabled={loading} variant="outline">
                관리자 계정 설정
              </Button>
            </div>

            {loading && (
              <div className="text-center py-4">
                <p>로딩 중...</p>
              </div>
            )}

            {adminStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">현재 관리자 계정 상태</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">📧 로그인 정보</h3>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p><strong>이메일:</strong> {adminStatus.credentials?.email}</p>
                      <p><strong>비밀번호:</strong> {adminStatus.credentials?.password}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">🗄️ 데이터베이스 상태</h3>
                    {adminStatus.database ? (
                      <div className="bg-green-50 p-3 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">존재함</Badge>
                        </div>
                        <p><strong>ID:</strong> {adminStatus.database.id}</p>
                        <p><strong>이메일:</strong> {adminStatus.database.email}</p>
                        <p><strong>이름:</strong> {adminStatus.database.name}</p>
                        <p><strong>역할:</strong> {adminStatus.database.role}</p>
                        <p><strong>생성일:</strong> {new Date(adminStatus.database.createdAt).toLocaleString()}</p>
                      </div>
                    ) : (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <Badge variant="destructive">없음</Badge>
                        <p className="mt-2">데이터베이스에 관리자 계정이 없습니다.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">🔐 Supabase Auth 상태</h3>
                    {adminStatus.supabase ? (
                      <div className="bg-green-50 p-3 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">존재함</Badge>
                        </div>
                        <p><strong>ID:</strong> {adminStatus.supabase.id}</p>
                        <p><strong>이메일:</strong> {adminStatus.supabase.email}</p>
                        <p><strong>생성일:</strong> {new Date(adminStatus.supabase.created_at).toLocaleString()}</p>
                        <p><strong>메타데이터:</strong> {JSON.stringify(adminStatus.supabase.user_metadata, null, 2)}</p>
                      </div>
                    ) : (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <Badge variant="destructive">없음</Badge>
                        <p className="mt-2">Supabase Auth에 관리자 계정이 없습니다.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {setupResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">설정 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(setupResult, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-yellow-800 mb-2">💡 문제 해결 방법</h3>
                <div className="text-yellow-700 space-y-2">
                  <p><strong>1. 환경변수 확인:</strong> NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 설정되어 있는지 확인</p>
                  <p><strong>2. 계정 설정:</strong> 위의 "관리자 계정 설정" 버튼을 클릭하여 계정 생성</p>
                  <p><strong>3. 로그인 시도:</strong> http://localhost:3000/auth/login 에서 위 계정 정보로 로그인</p>
                  <p><strong>4. 관리자 페이지:</strong> 성공하면 http://localhost:3000/admin/dashboard 로 이동</p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
