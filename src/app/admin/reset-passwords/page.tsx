"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const resetPasswords = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/auth/reset-demo-passwords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: '요청 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>데모 계정 비밀번호 재설정</CardTitle>
            <CardDescription>
              모든 데모 계정의 비밀번호를 "123"으로 재설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={resetPasswords} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "재설정 중..." : "비밀번호 재설정"}
            </Button>

            {result && (
              <Card className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className={`text-sm font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                      {result.success ? "✅ 성공" : "❌ 실패"}
                    </div>
                    
                    <div className="text-sm text-gray-700">
                      {result.message}
                    </div>

                    {result.accounts && (
                      <div>
                        <div className="font-medium text-sm mb-2">로그인 계정 정보:</div>
                        <div className="bg-white p-3 rounded border text-xs font-mono space-y-1">
                          {result.accounts.map((account: string, index: number) => (
                            <div key={index}>{account}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.results && (
                      <div>
                        <div className="font-medium text-sm mb-2">처리 결과:</div>
                        <div className="space-y-1">
                          {result.results.map((item: any, index: number) => (
                            <div key={index} className="text-xs">
                              {item.name} ({item.email}): {item.success ? "✅" : "❌"}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.error && (
                      <div className="text-red-600 text-sm">
                        오류: {result.error}
                        {result.details && (
                          <div className="text-xs mt-1 text-red-500">
                            {result.details}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-2">사용 방법:</div>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>위 버튼을 클릭하여 비밀번호를 재설정합니다</li>
                    <li>재설정 완료 후 로그인 페이지로 이동합니다</li>
                    <li>모든 데모 계정의 비밀번호는 "123"입니다</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
