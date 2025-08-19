"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Lightbulb, Loader2, Search } from "lucide-react";

interface ConceptHelperProps {
  className?: string;
}

export default function ConceptHelper({ className }: ConceptHelperProps) {
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!question.trim()) {
      setError("질문을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");
    setAnalysis("");

    try {
      const response = await fetch('/api/ai/concept-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          subject: subject
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '분석에 실패했습니다.');
      }

      setAnalysis(data.analysis);
      
      if (data.fallback) {
        setError("AI 서비스에 일시적 문제가 있어 기본 가이드를 제공합니다.");
      }

    } catch (err) {
      console.error('개념 분석 오류:', err);
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };



  // 분석 결과를 단순 텍스트로 표시
  const parseAnalysisForDisplay = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // 주요 개념 라인 감지
      if (line.match(/^-\s+(.+?):\s*(.+)$/)) {
        const match = line.match(/^-\s+(.+?):\s*(.+)$/);
        if (match) {
          return (
            <div key={index} className="mb-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <span className="font-semibold text-blue-700">{match[1].trim()}</span>
              <span className="text-gray-600">: {match[2]}</span>
            </div>
          );
        }
      }
      
      // 탐구 질문 라인 감지 (숫자로 시작)
      if (line.match(/^\d+\.\s+(.+)$/)) {
        return (
          <div key={index} className="mb-2 p-2 bg-green-50 rounded border-l-4 border-green-400">
            <span className="text-green-700">{line}</span>
          </div>
        );
      }
      
      // 일반 텍스트
      if (line.trim()) {
        if (line.startsWith('##')) {
          return (
            <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-gray-800">
              {line.replace('##', '').trim()}
            </h3>
          );
        }
        return (
          <p key={index} className="mb-1 text-gray-700">
            {line}
          </p>
        );
      }
      
      return <br key={index} />;
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI 개념 탐구 도우미
        </CardTitle>
        <CardDescription>
          궁금한 것을 입력하면 핵심 개념을 찾아주고 구체적인 탐구 질문을 제안해드립니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 입력 영역 */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="question">궁금한 것을 자유롭게 입력하세요</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 왜 물방울이 둥글게 될까? 식물이 빛을 향해 자라는 이유는?"
              disabled={isLoading}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            />
          </div>

          <div>
            <Label htmlFor="subject">과목 (선택사항)</Label>
            <Select value={subject} onValueChange={setSubject} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="과목을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체</SelectItem>
                <SelectItem value="물리">물리</SelectItem>
                <SelectItem value="화학">화학</SelectItem>
                <SelectItem value="생물">생물</SelectItem>
                <SelectItem value="지구과학">지구과학</SelectItem>
                <SelectItem value="수학">수학</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={isLoading || !question.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                개념 분석하기
              </>
            )}
          </Button>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <p className="text-yellow-800 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* 분석 결과 */}
        {analysis && (
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                분석 결과
              </CardTitle>
              <CardDescription className="text-xs text-gray-600">
                AI가 분석한 주요 개념과 탐구 질문을 참고하여 활용해보세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {parseAnalysisForDisplay(analysis)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 사용법 안내 */}
        {!analysis && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">💡 사용 팁:</p>
                <ul className="space-y-1 text-xs">
                  <li>• 일상 궁금증부터 과학적 현상까지 자유롭게 질문하세요</li>
                  <li>• "왜 ~일까?", "어떻게 ~할까?" 형태의 질문이 좋습니다</li>
                  <li>• 과목을 선택하면 더 정확한 분석을 받을 수 있습니다</li>
                  <li>• AI가 제공하는 개념과 질문을 참고하여 탐구를 계획해보세요</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
