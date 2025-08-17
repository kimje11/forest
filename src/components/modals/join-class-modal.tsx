"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Users } from "lucide-react";

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinClassModal({ isOpen, onClose, onSuccess }: JoinClassModalProps) {
  const [classCode, setClassCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [joinedClass, setJoinedClass] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/classes/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classCode: classCode.toUpperCase() }),
      });

      const result = await response.json();

      if (response.ok) {
        setJoinedClass(result.class);
      } else {
        setError(result.error || "클래스 참여에 실패했습니다.");
      }
    } catch (error) {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setClassCode("");
    setError("");
    setJoinedClass(null);
    onClose();
    if (joinedClass) {
      onSuccess();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length <= 6) {
      setClassCode(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {joinedClass ? "클래스 참여 완료" : "클래스 참여하기"}
              </CardTitle>
              <CardDescription>
                {joinedClass 
                  ? "클래스에 성공적으로 참여했습니다." 
                  : "교사가 제공한 6자리 참여 코드를 입력하세요."
                }
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!joinedClass ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="classCode" className="text-sm font-medium">
                  참여 코드 *
                </label>
                <Input
                  id="classCode"
                  value={classCode}
                  onChange={handleCodeChange}
                  placeholder="ABC123"
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-wider"
                  style={{ textTransform: "uppercase" }}
                />
                <p className="text-xs text-gray-500">
                  영문자와 숫자 조합 6자리 코드입니다.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  취소
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || classCode.length !== 6} 
                  className="flex-1"
                >
                  {isLoading ? "참여 중..." : "클래스 참여"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-blue-800 mb-2">
                  {joinedClass.name}
                </h3>
                <p className="text-sm text-blue-600 mb-2">
                  교사: {joinedClass.teacher.name}
                </p>
                <p className="text-sm text-blue-600">
                  클래스에 성공적으로 참여했습니다!
                </p>
              </div>

              {joinedClass.description && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">{joinedClass.description}</p>
                </div>
              )}

              <div className="text-sm text-gray-600 space-y-1">
                <p>• 이제 이 클래스의 탐구 활동에 참여할 수 있습니다.</p>
                <p>• 대시보드에서 클래스 정보를 확인하세요.</p>
              </div>

              <Button onClick={handleClose} className="w-full">
                확인
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
