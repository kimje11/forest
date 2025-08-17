"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Copy, Check } from "lucide-react";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateClassModal({ isOpen, onClose, onSuccess }: CreateClassModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdClass, setCreatedClass] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/classes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setCreatedClass(result.class);
      } else {
        setError(result.error || "클래스 생성에 실패했습니다.");
      }
    } catch (error) {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (createdClass?.classCode) {
      await navigator.clipboard.writeText(createdClass.classCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", description: "" });
    setError("");
    setCreatedClass(null);
    setCopied(false);
    onClose();
    if (createdClass) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {createdClass ? "클래스 생성 완료" : "새 클래스 개설"}
              </CardTitle>
              <CardDescription>
                {createdClass 
                  ? "학생들에게 참여 코드를 공유하세요." 
                  : "새로운 클래스를 개설합니다."
                }
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!createdClass ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="className" className="text-sm font-medium">
                  클래스명 *
                </label>
                <Input
                  id="className"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 고1 수학 탐구반"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="classDescription" className="text-sm font-medium">
                  클래스 설명 (선택)
                </label>
                <Input
                  id="classDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="클래스에 대한 간단한 설명을 입력하세요"
                />
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
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "생성 중..." : "클래스 개설"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">
                  {createdClass.name}
                </h3>
                <p className="text-sm text-green-600 mb-4">
                  클래스가 성공적으로 생성되었습니다!
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">참여 코드</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-white border rounded-lg font-mono text-lg font-bold text-center">
                      {createdClass.classCode}
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyCode}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600">참여 코드가 복사되었습니다!</p>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>• 학생들은 이 참여 코드로 클래스에 참여할 수 있습니다.</p>
                <p>• 참여 코드는 대시보드에서 언제든지 확인할 수 있습니다.</p>
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
