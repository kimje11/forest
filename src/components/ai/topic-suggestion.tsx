"use client";

import { useState, memo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Brain, 
  Sparkles, 
  Clock, 
  Target, 
  BookOpen,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";

interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  subject: string;
  estimatedDuration: number;
  difficulty: string;
  keywords: string[];
}

interface TopicSuggestionProps {
  onSelectTopic?: (topic: TopicSuggestion) => void;
  className?: string;
}

const TopicSuggestion = memo(function TopicSuggestion({ onSelectTopic, className }: TopicSuggestionProps) {
  const [formData, setFormData] = useState({
    subject: "",
    interest: "",
    keywords: "",
    gradeLevel: "",
  });
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedTopicId, setCopiedTopicId] = useState<string | null>(null);

  const subjects = [
    "수학", "과학", "사회", "국어", "영어", "음악", "미술", "체육", "기술가정", "한국사"
  ];

  const interests = [
    "실생활 응용", "창의적 사고", "문제 해결", "협업 활동", "실험 및 관찰", 
    "데이터 분석", "문화 탐구", "환경 보호", "기술 혁신", "사회 이슈"
  ];

  const gradeLevels = ["고1", "고2", "고3"];

  const handleSuggest = useCallback(async () => {
    if (!formData.subject || !formData.interest) {
      alert("교과목과 관심 유형을 선택해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/suggest-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // 안전한 데이터 처리
        if (data.topics && Array.isArray(data.topics)) {
          setSuggestions(data.topics);
        } else {
          console.error("Invalid response format:", data);
          alert("응답 형식이 올바르지 않습니다.");
        }
      } else {
        const error = await response.json().catch(() => ({ error: "알 수 없는 오류" }));
        alert(error.error || "주제 추천에 실패했습니다.");
      }
    } catch (error) {
      console.error("Topic suggestion error:", error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const handleCopyTopic = useCallback(async (topic: TopicSuggestion) => {
    await navigator.clipboard.writeText(topic.title);
    setCopiedTopicId(topic.id);
    setTimeout(() => setCopiedTopicId(null), 2000);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "초급": return "bg-green-100 text-green-800";
      case "중급": return "bg-yellow-100 text-yellow-800";
      case "고급": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI 주제 추천 도우미
        </CardTitle>
        <CardDescription>
          AI가 여러분의 관심사를 분석하여 맞춤형 탐구 주제를 추천해드립니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 입력 폼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">교과목 *</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="">교과목을 선택하세요</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">관심 유형 *</label>
            <select
              value={formData.interest}
              onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="">관심 유형을 선택하세요</option>
              {interests.map((interest) => (
                <option key={interest} value={interest}>
                  {interest}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">학년 (선택)</label>
            <select
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="">학년을 선택하세요</option>
              {gradeLevels.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">관심 키워드 (선택)</label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="예: 환경보호, 인공지능, 전통문화, 데이터분석, 게임이론 등 (쉼표로 구분)"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              💡 구체적인 키워드를 입력하면 더 맞춤형 주제를 추천받을 수 있습니다.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSuggest} 
          disabled={isLoading || !formData.subject || !formData.interest}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "🤖 Gemini AI가 맞춤 주제 생성 중..." : "🤖 Gemini AI로 주제 추천받기"}
        </Button>

        {/* 추천 결과 */}
        {suggestions && suggestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h3 className="font-medium">추천 주제</h3>
              <span className="text-sm text-gray-500">
                ({suggestions.length}개)
              </span>
            </div>

            <div className="space-y-3">
              {suggestions.map((topic) => (
                <Card key={topic.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 flex-1 mr-4">
                        {topic?.title || "제목 없음"}
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyTopic(topic)}
                        >
                          {copiedTopicId === topic.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        {onSelectTopic && (
                          <Button
                            size="sm"
                            onClick={() => onSelectTopic(topic)}
                          >
                            선택
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {topic?.description || "설명이 없습니다."}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${getDifficultyColor(topic?.difficulty || "중급")}`}>
                        {topic?.difficulty || "중급"}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {topic?.estimatedDuration || 3}주
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {topic?.subject || "일반"}
                      </span>
                      {topic?.keywords && Array.isArray(topic.keywords) ? topic.keywords.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                          #{keyword}
                        </span>
                      )) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={handleSuggest}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                다른 주제 추천받기
              </Button>
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p>💡 <strong>팁:</strong> 관심 키워드를 입력하면 더 구체적인 주제를 추천받을 수 있습니다.</p>
          <p>🤖 <strong>AI 안내:</strong> 추천된 주제는 참고용이며, 여러분의 창의적인 아이디어로 더욱 발전시킬 수 있습니다.</p>
        </div>
      </CardContent>
    </Card>
  );
});

export default TopicSuggestion;
