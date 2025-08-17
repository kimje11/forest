import { prisma } from "./prisma";

export const defaultTemplates = [
  {
    title: "기본 탐구 활동 템플릿",
    description: "모든 교과목에 활용할 수 있는 기본적인 탐구 활동 템플릿입니다.",
    steps: [
      {
        title: "탐구 주제 설정",
        description: "탐구하고 싶은 주제를 명확히 설정합니다.",
        order: 1,
        isRequired: true,
        components: [
          {
            type: "AI_TOPIC_HELPER" as const,
            label: "AI 주제 추천",
            required: false,
            order: 1,
          },
          {
            type: "TEXT" as const,
            label: "탐구 주제",
            placeholder: "탐구하고 싶은 주제를 입력하세요",
            required: true,
            order: 2,
          },
          {
            type: "TEXTAREA" as const,
            label: "주제 선택 이유",
            placeholder: "이 주제를 선택한 이유를 설명해주세요",
            required: true,
            order: 3,
          },
        ],
      },
      {
        title: "탐구 계획 수립",
        description: "체계적인 탐구를 위한 계획을 세웁니다.",
        order: 2,
        isRequired: true,
        components: [
          {
            type: "TEXTAREA" as const,
            label: "탐구 목표",
            placeholder: "이 탐구를 통해 무엇을 알아내고 싶은지 작성하세요",
            required: true,
            order: 1,
          },
          {
            type: "TEXTAREA" as const,
            label: "탐구 방법",
            placeholder: "어떤 방법으로 탐구할 것인지 구체적으로 작성하세요",
            required: true,
            order: 2,
          },
          {
            type: "TEXT" as const,
            label: "예상 소요 시간",
            placeholder: "예: 4주",
            required: false,
            order: 3,
          },
        ],
      },
      {
        title: "자료 수집 및 분석",
        description: "탐구에 필요한 자료를 수집하고 분석합니다.",
        order: 3,
        isRequired: true,
        components: [
          {
            type: "TEXTAREA" as const,
            label: "수집한 자료",
            placeholder: "어떤 자료를 수집했는지 설명하고, 출처를 명시하세요",
            required: true,
            order: 1,
          },
          {
            type: "FILE_UPLOAD" as const,
            label: "자료 첨부",
            required: false,
            order: 2,
          },
          {
            type: "TEXTAREA" as const,
            label: "자료 분석",
            placeholder: "수집한 자료를 어떻게 분석했는지 설명하세요",
            required: true,
            order: 3,
          },
        ],
      },
      {
        title: "결론 및 성찰",
        description: "탐구 결과를 정리하고 과정을 성찰합니다.",
        order: 4,
        isRequired: true,
        components: [
          {
            type: "TEXTAREA" as const,
            label: "탐구 결과",
            placeholder: "탐구를 통해 알아낸 내용을 정리해주세요",
            required: true,
            order: 1,
          },
          {
            type: "TEXTAREA" as const,
            label: "느낀 점과 배운 점",
            placeholder: "이번 탐구를 통해 느낀 점과 배운 점을 작성하세요",
            required: true,
            order: 2,
          },
          {
            type: "TEXTAREA" as const,
            label: "추후 탐구 계획",
            placeholder: "앞으로 더 탐구해보고 싶은 내용이 있다면 작성하세요",
            required: false,
            order: 3,
          },
        ],
      },
    ],
  },
  {
    title: "수학 탐구 활동 템플릿",
    description: "수학적 개념과 원리를 탐구하는 활동을 위한 템플릿입니다.",
    steps: [
      {
        title: "수학적 문제 발견",
        description: "일상 속에서 수학적 문제나 패턴을 발견합니다.",
        order: 1,
        isRequired: true,
        components: [
          {
            type: "TEXT" as const,
            label: "탐구 주제",
            placeholder: "예: 피보나치 수열과 자연 속 황금비",
            required: true,
            order: 1,
          },
          {
            type: "TEXTAREA" as const,
            label: "문제 상황",
            placeholder: "어떤 상황에서 이 수학적 문제를 발견했는지 설명하세요",
            required: true,
            order: 2,
          },
          {
            type: "MULTIPLE_CHOICE" as const,
            label: "수학 영역",
            required: true,
            order: 3,
            options: JSON.stringify(["대수", "기하", "확률과 통계", "미적분", "수학적 모델링"]),
          },
        ],
      },
      {
        title: "수학적 모델링",
        description: "문제를 수학적으로 모델링하고 가설을 세웁니다.",
        order: 2,
        isRequired: true,
        components: [
          {
            type: "TEXTAREA" as const,
            label: "수학적 가설",
            placeholder: "수학적으로 어떤 결과가 나올 것이라고 예상하는지 작성하세요",
            required: true,
            order: 1,
          },
          {
            type: "TEXTAREA" as const,
            label: "수식 및 공식",
            placeholder: "사용할 수식이나 공식을 LaTeX 형식으로 작성하세요 (예: $a^2 + b^2 = c^2$)",
            required: false,
            order: 2,
          },
        ],
      },
      {
        title: "계산 및 검증",
        description: "실제 계산을 수행하고 결과를 검증합니다.",
        order: 3,
        isRequired: true,
        components: [
          {
            type: "TEXTAREA" as const,
            label: "계산 과정",
            placeholder: "단계별 계산 과정을 자세히 작성하세요",
            required: true,
            order: 1,
          },
          {
            type: "FILE_UPLOAD" as const,
            label: "계산 자료 첨부",
            required: false,
            order: 2,
          },
          {
            type: "TEXTAREA" as const,
            label: "검증 결과",
            placeholder: "계산 결과가 가설과 일치하는지 확인한 결과를 작성하세요",
            required: true,
            order: 3,
          },
        ],
      },
      {
        title: "수학적 의미 해석",
        description: "결과의 수학적 의미를 해석하고 응용 방안을 제시합니다.",
        order: 4,
        isRequired: true,
        components: [
          {
            type: "TEXTAREA" as const,
            label: "결과 해석",
            placeholder: "탐구 결과의 수학적 의미를 설명하세요",
            required: true,
            order: 1,
          },
          {
            type: "TEXTAREA" as const,
            label: "실생활 연결",
            placeholder: "이 수학적 개념이 실생활에 어떻게 활용될 수 있는지 설명하세요",
            required: true,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    title: "과학 실험 탐구 템플릿",
    description: "과학적 방법을 통한 실험 탐구 활동을 위한 템플릿입니다.",
    steps: [
      {
        title: "과학적 문제 설정",
        description: "탐구할 과학적 문제를 명확히 설정합니다.",
        order: 1,
        isRequired: true,
        components: [
          {
            type: "TEXT" as const,
            label: "탐구 질문",
            placeholder: "예: 식물의 성장에 음악이 미치는 영향은?",
            required: true,
            order: 1,
          },
          {
            type: "MULTIPLE_CHOICE" as const,
            label: "과학 분야",
            required: true,
            order: 2,
            options: JSON.stringify(["물리", "화학", "생물", "지구과학", "환경과학"]),
          },
          {
            type: "TEXTAREA" as const,
            label: "배경 이론",
            placeholder: "관련된 과학적 배경 이론을 설명하세요",
            required: true,
            order: 3,
          },
        ],
      },
      {
        title: "가설 설정 및 실험 설계",
        description: "과학적 가설을 세우고 실험을 설계합니다.",
        order: 2,
        isRequired: true,
        components: [
          {
            type: "TEXTAREA" as const,
            label: "가설",
            placeholder: "실험을 통해 검증하고자 하는 가설을 작성하세요",
            required: true,
            order: 1,
          },
          {
            type: "TEXTAREA" as const,
            label: "변인 설정",
            placeholder: "독립변인, 종속변인, 통제변인을 명확히 구분하여 작성하세요",
            required: true,
            order: 2,
          },
          {
            type: "TEXTAREA" as const,
            label: "실험 방법",
            placeholder: "실험 과정을 단계별로 상세히 작성하세요",
            required: true,
            order: 3,
          },
        ],
      },
      {
        title: "실험 수행 및 결과",
        description: "실험을 수행하고 결과를 기록합니다.",
        order: 3,
        isRequired: true,
        components: [
          {
            type: "TEXTAREA" as const,
            label: "실험 결과",
            placeholder: "관찰한 현상과 측정한 데이터를 자세히 기록하세요",
            required: true,
            order: 1,
          },
          {
            type: "FILE_UPLOAD" as const,
            label: "실험 사진/동영상",
            required: false,
            order: 2,
          },
          {
            type: "TEXTAREA" as const,
            label: "데이터 분석",
            placeholder: "수집한 데이터를 분석하고 그래프나 표로 정리하세요",
            required: true,
            order: 3,
          },
        ],
      },
      {
        title: "결론 및 평가",
        description: "실험 결과를 바탕으로 결론을 도출하고 평가합니다.",
        order: 4,
        isRequired: true,
        components: [
          {
            type: "TEXTAREA" as const,
            label: "결론",
            placeholder: "가설이 맞는지 틀린지 판단하고 그 이유를 설명하세요",
            required: true,
            order: 1,
          },
          {
            type: "TEXTAREA" as const,
            label: "오차 및 개선점",
            placeholder: "실험 과정에서 발생한 오차와 개선점을 분석하세요",
            required: true,
            order: 2,
          },
          {
            type: "TEXTAREA" as const,
            label: "추가 연구 방향",
            placeholder: "이 실험을 발전시킬 수 있는 방향을 제시하세요",
            required: false,
            order: 3,
          },
        ],
      },
    ],
  },
];

export async function seedDefaultTemplates() {
  try {
    console.log("기본 템플릿 시드 데이터 생성 중...");

    // 기본 템플릿을 생성할 시스템 교사 계정 확인 또는 생성
    let systemTeacher = await prisma.user.findFirst({
      where: { 
        email: "system@exploration-forest.com",
        role: "TEACHER"
      }
    });

    if (!systemTeacher) {
      systemTeacher = await prisma.user.create({
        data: {
          name: "시스템 관리자",
          email: "system@exploration-forest.com",
          password: "system", // 실제로는 사용하지 않음
          role: "TEACHER",
        },
      });
    }

    // 기존 기본 템플릿 삭제
    await prisma.template.deleteMany({
      where: { isDefault: true }
    });

    // 새 기본 템플릿 생성
    for (const templateData of defaultTemplates) {
      await prisma.$transaction(async (tx) => {
        const template = await tx.template.create({
          data: {
            title: templateData.title,
            description: templateData.description,
            teacherId: systemTeacher.id,
            isDefault: true,
          },
        });

        for (const stepData of templateData.steps) {
          const step = await tx.templateStep.create({
            data: {
              templateId: template.id,
              title: stepData.title,
              description: stepData.description,
              order: stepData.order,
              isRequired: stepData.isRequired,
            },
          });

          for (const componentData of stepData.components) {
            await tx.templateComponent.create({
              data: {
                stepId: step.id,
                type: componentData.type,
                label: componentData.label,
                placeholder: componentData.placeholder,
                required: componentData.required,
                order: componentData.order,
                options: componentData.options,
              },
            });
          }
        }
      });
    }

    console.log(`${defaultTemplates.length}개의 기본 템플릿이 생성되었습니다.`);
  } catch (error) {
    console.error("기본 템플릿 시드 데이터 생성 실패:", error);
    throw error;
  }
}
