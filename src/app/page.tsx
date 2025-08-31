import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Brain, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">탐구의 숲</h1>
            </div>
            <div className="flex gap-4">
              <Link href="/auth/login">
                <Button variant="outline">로그인</Button>
              </Link>
              <Link href="/auth/register">
                <Button>회원가입</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 섹션 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 히어로 섹션 */}
        <section className="text-center py-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            AI기반 자기주도 주제탐구학습 플랫폼
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            학생들의 호기심을 체계적인 탐구로, 교사들의 지도를 효과적인 피드백으로.
            탐구의 숲에서 지식의 나무를 키워보세요.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="px-8">
                로그인
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="px-8">
                회원가입
              </Button>
            </Link>
          </div>
        </section>

        {/* 기능 소개 */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              탐구의 숲이 제공하는 기능
            </h3>
            <p className="text-lg text-gray-600">
              체계적인 탐구 학습을 위한 모든 도구가 준비되어 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>AI 주제 추천</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  학생의 관심사와 교과목을 분석하여 맞춤형 탐구 주제를 추천합니다.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>체계적 탐구 과정</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  단계별 템플릿을 통해 체계적이고 논리적인 탐구 과정을 경험할 수 있습니다.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>실시간 피드백</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  교사의 실시간 피드백과 AI 도구를 통해 탐구 과정을 개선해 나갑니다.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>성장 시각화</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  탐구 활동 데이터를 분석하여 학생의 성장 과정을 시각적으로 보여줍니다.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 역할별 안내 */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              역할별 맞춤 기능
            </h3>
            <p className="text-lg text-gray-600">
              학생과 교사, 각각의 필요에 맞는 최적화된 기능을 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="p-8">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-600">학생을 위한 기능</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold">AI 주제 도우미</h4>
                    <p className="text-gray-600">관심사 기반 맞춤 주제 추천</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold">단계별 탐구</h4>
                    <p className="text-gray-600">체계적인 템플릿 기반 탐구 수행</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold">포트폴리오 관리</h4>
                    <p className="text-gray-600">완성된 탐구들의 체계적 관리</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold">성장 리포트</h4>
                    <p className="text-gray-600">탐구 활동 데이터 시각화</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8">
              <CardHeader>
                <CardTitle className="text-2xl text-green-600">교사를 위한 기능</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold">템플릿 편집기</h4>
                    <p className="text-gray-600">드래그 앤 드롭으로 탐구 과정 설계</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold">실시간 모니터링</h4>
                    <p className="text-gray-600">학생들의 탐구 진행 상황 추적</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold">피드백 기능</h4>
                    <p className="text-gray-600">학생 탐구 활동에 대한 개별 피드백 제공</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold">클래스 관리</h4>
                    <p className="text-gray-600">간편한 코드 기반 클래스 운영</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">탐구의 숲</span>
          </div>
          <div className="text-center text-gray-600">
            <p>&copy; 2025 탐구의 숲. AI기반 자기주도 주제탐구학습 플랫폼</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
