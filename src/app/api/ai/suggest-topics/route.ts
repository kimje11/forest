import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

const suggestTopicsSchema = z.object({
  subject: z.string().min(1, "교과목을 선택해주세요."),
  interest: z.string().min(1, "관심 유형을 선택해주세요."),
  keywords: z.string().optional(),
  gradeLevel: z.string().optional(),
});

// Gemini API를 사용한 주제 생성
const generateTopicsWithGemini = async (subject: string, interest: string, keywords?: string, gradeLevel?: string) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  // 프롬프트 구성
  let prompt = `고등학생을 위한 ${subject} 교과 탐구 주제를 추천해주세요.

요구사항:
- 교과목: ${subject}
- 관심 유형: ${interest}`;

  if (keywords) {
    prompt += `\n- 관심 키워드: ${keywords}`;
  }

  if (gradeLevel) {
    prompt += `\n- 학년: ${gradeLevel}`;
  }

  prompt += `

다음 형식으로 정확히 5개의 주제를 JSON 배열로 응답해주세요:
[
  {
    "id": "unique_id_1",
    "title": "탐구 주제 제목",
    "description": "주제에 대한 자세한 설명 (2-3문장)",
    "subject": "${subject}",
    "estimatedDuration": 예상 소요 시간(주),
    "difficulty": "초급" | "중급" | "고급",
    "keywords": ["키워드1", "키워드2", "키워드3"]
  }
]

JSON 형식만 응답하고 다른 텍스트는 포함하지 마세요.`;

  try {
    // Google Generative AI SDK 사용
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No response from Gemini API");
    }

    // JSON 파싱
    try {
      // 응답에서 JSON 부분만 추출 (마크다운 코드 블록 제거)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      const topics = JSON.parse(jsonText);
      return topics;
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", text);
      // 파싱 실패시 기본 주제 반환
      return generateFallbackTopics(subject, interest, keywords);
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    // API 실패시 기본 주제 반환
    return generateFallbackTopics(subject, interest, keywords);
  }
};

// 백업용 주제 생성 함수
const generateFallbackTopics = (subject: string, interest: string, keywords?: string) => {
  const topicSets: Record<string, string[]> = {
    "수학": [
      "피보나치 수열과 황금비의 자연 속 발견",
      "확률론을 통한 게임 전략 분석",
      "기하학적 패턴을 이용한 건축 설계",
      "통계를 활용한 소셜미디어 트렌드 분석",
      "미분을 이용한 최적화 문제 해결"
    ],
    "과학": [
      "식물의 광합성 효율 최적화 실험",
      "화학 반응을 이용한 친환경 에너지 개발",
      "물의 순환과 기후 변화의 상관관계",
      "DNA 추출과 유전자 분석 실험",
      "신재생 에너지의 효율성 비교 연구"
    ],
    "사회": [
      "지역 문화유산의 보존과 활용 방안",
      "도시화가 환경에 미치는 영향 분석",
      "다문화 사회의 통합 정책 연구",
      "경제 불평등 해결을 위한 정책 제안",
      "미디어가 여론 형성에 미치는 영향"
    ],
    "국어": [
      "고전 문학 작품의 현대적 재해석",
      "방언과 표준어의 변화 과정 연구",
      "디지털 시대의 언어 변화 분석",
      "문학 작품 속 사회상 비교 연구",
      "창작 활동을 통한 표현 능력 향상"
    ],
    "영어": [
      "K-pop이 영어 학습에 미치는 영향",
      "영어권 문화와 한국 문화 비교 분석",
      "글로벌 커뮤니케이션 전략 연구",
      "영어 문학 작품의 번역과 해석",
      "언어 교환을 통한 문화 이해 증진"
    ]
  };

  const baseTopics = topicSets[subject] || [
    "주제 기반 탐구 활동 설계",
    "창의적 문제 해결 프로젝트",
    "실생활 연계 연구 프로젝트",
    "협업을 통한 탐구 활동",
    "미래 사회 예측 프로젝트"
  ];

  // 키워드가 있으면 관련된 주제로 조정
  let topics = [...baseTopics];
  if (keywords) {
    const keywordTopics = topics.map(topic => 
      `${keywords}와 연관된 ${topic.toLowerCase()}`
    );
    topics = [...topics.slice(0, 3), ...keywordTopics.slice(0, 2)];
  }

  // 올바른 객체 형태로 반환
  return topics.slice(0, 5).map((topic, index) => ({
    id: `fallback-${Date.now()}-${index}`,
    title: topic,
    description: `${subject} 분야의 ${interest} 관련 탐구 주제입니다. ${keywords ? `키워드: ${keywords}` : ''}`,
    subject: subject,
    estimatedDuration: Math.floor(Math.random() * 4) + 2, // 2-5주
    difficulty: ["초급", "중급", "고급"][Math.floor(Math.random() * 3)],
    keywords: keywords ? keywords.split(',').map(k => k.trim()) : [subject, interest]
  }));
};

export async function POST(request: NextRequest) {
  try {
    // Supabase Auth를 통한 인증
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = suggestTopicsSchema.parse(body);

    // Gemini API를 사용하여 주제 생성
    const suggestedTopics = await generateTopicsWithGemini(
      validatedData.subject,
      validatedData.interest,
      validatedData.keywords,
      validatedData.gradeLevel
    );

    return NextResponse.json(
      { 
        topics: suggestedTopics,
        prompt: `${validatedData.subject} 분야에서 ${validatedData.interest}에 관심이 있는 학생을 위한 주제를 AI가 추천했습니다.${validatedData.keywords ? ` 키워드: ${validatedData.keywords}` : ''}`
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("AI topic suggestion error:", error);
    return NextResponse.json(
      { error: "AI 주제 추천 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 실제 Gemini API 호출 함수 (구현 예정)
async function callGeminiAPI(data: any) {
  // TODO: 실제 Gemini API 연동
  const prompt = `
    고등학생의 탐구활동을 위해 ${data.subject}과 ${data.interest}을 연결하는 탐구 주제 5개를 추천해줘.
    ${data.keywords ? `학생의 관심 키워드는 '${data.keywords}'야.` : ""}
    ${data.gradeLevel ? `학년은 ${data.gradeLevel}이야.` : ""}
    
    각 주제는 다음 조건을 만족해야 해:
    - 학생이 실제로 수행 가능한 수준
    - 창의적이고 흥미로운 내용
    - 실생활과 연관성이 높은 주제
    - 탐구 과정이 명확한 주제
    
    JSON 형태로 다음과 같이 반환해줘:
    {
      "topics": [
        {
          "title": "주제 제목",
          "description": "주제 설명",
          "difficulty": "초급|중급|고급",
          "estimatedDuration": "예상 소요 기간(주)",
          "keywords": ["관련", "키워드"]
        }
      ]
    }
  `;

  // 실제 구현시 Gemini API 호출
  // const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     contents: [{ parts: [{ text: prompt }] }],
  //   }),
  // });

  // return await response.json();
}
