import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { question, subject } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: '질문을 입력해주세요.' },
        { status: 400 }
      );
    }

    const subjectText = !subject || subject === '전체' ? '일반' : subject;
    console.log(`AI 개념 도우미 요청: ${question} (과목: ${subjectText})`);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
당신은 교육 전문가입니다. 학생의 궁금한 질문을 분석하여 다음을 제공해주세요:

학생 질문: "${question}"
과목: ${subjectText}

다음 형식으로 응답해주세요:

## 🔍 핵심 개념 분석
- 주요 개념 1: (개념명과 간단한 설명)
- 주요 개념 2: (개념명과 간단한 설명)
- 주요 개념 3: (개념명과 간단한 설명)

## 🎯 구체화된 탐구 질문
1. (구체적이고 실험 가능한 질문 1)
2. (구체적이고 실험 가능한 질문 2)
3. (구체적이고 실험 가능한 질문 3)

## 📋 탐구 방향 제안
- 실험/관찰 방법: (구체적인 실험이나 조사 방법)
- 필요한 도구/자료: (실험에 필요한 것들)
- 예상 결과: (어떤 결과를 얻을 수 있는지)

## 💡 심화 학습 키워드
- 관련 키워드 1, 관련 키워드 2, 관련 키워드 3

응답은 고등학생이 이해하기 쉽게 작성하고, 실제로 탐구 활동에 활용할 수 있도록 구체적으로 제시해주세요.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('AI 개념 도우미 응답 생성 완료');

    return NextResponse.json({
      success: true,
      analysis: text
    });

  } catch (error) {
    console.error('AI 개념 도우미 오류:', error);

    // Gemini API 오류 시 폴백 응답
    const fallbackAnalysis = `
## 🔍 핵심 개념 분석
- 과학적 탐구: 체계적인 관찰과 실험을 통한 지식 발견
- 가설 설정: 현상을 설명하기 위한 잠정적 설명
- 변인 통제: 실험에서 조건을 체계적으로 조작하고 통제

## 🎯 구체화된 탐구 질문
1. 어떤 조건에서 이 현상이 더 잘 일어날까?
2. 이 현상의 원인이 되는 주요 요인은 무엇일까?
3. 이 현상을 수치로 측정하고 분석할 수 있을까?

## 📋 탐구 방향 제안
- 실험/관찰 방법: 변인을 하나씩 바꿔가며 체계적으로 실험하기
- 필요한 도구/자료: 측정 도구, 기록지, 실험 재료
- 예상 결과: 조건에 따른 현상의 변화 패턴 발견

## 💡 심화 학습 키워드
- 과학적 방법, 실험 설계, 데이터 분석
`;

    return NextResponse.json({
      success: true,
      analysis: fallbackAnalysis,
      fallback: true
    });
  }
}
