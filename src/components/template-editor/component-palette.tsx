"use client";

import { useDrag } from "react-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Type, 
  FileText, 
  Upload, 
  CheckSquare, 
  Circle, 
  Brain,
  GripVertical,
  Calculator,
  Table
} from "lucide-react";
export type ComponentType = "TEXT" | "TEXTAREA" | "FILE_UPLOAD" | "MULTIPLE_CHOICE" | "CHECKBOX" | "AI_TOPIC_HELPER";

interface ComponentItem {
  type: ComponentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultProps: {
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string;
  };
}

const componentItems: ComponentItem[] = [
  {
    type: "TEXT",
    label: "텍스트 입력",
    description: "한 줄 텍스트 입력 필드",
    icon: Type,
    defaultProps: {
      label: "텍스트 입력",
      placeholder: "텍스트를 입력하세요",
      required: false,
    },
  },
  {
    type: "TEXTAREA",
    label: "긴 텍스트 입력",
    description: "여러 줄 텍스트 입력",
    icon: FileText,
    defaultProps: {
      label: "내용 입력",
      placeholder: "자세한 내용을 입력하세요",
      required: false,
    },
  },
  {
    type: "TEXTAREA",
    label: "수식 및 표 입력",
    description: "수학 수식, 표, 이미지가 포함된 내용 입력",
    icon: Calculator,
    defaultProps: {
      label: "수식 및 표 입력",
      placeholder: "수학 수식, 표, 이미지 등을 입력하세요 (Math Editor)",
      required: false,
    },
  },
  {
    type: "FILE_UPLOAD",
    label: "파일 업로드",
    description: "파일 첨부 필드",
    icon: Upload,
    defaultProps: {
      label: "파일 첨부",
      required: false,
    },
  },
  {
    type: "MULTIPLE_CHOICE",
    label: "객관식 선택",
    description: "여러 선택지 중 하나 선택",
    icon: Circle,
    defaultProps: {
      label: "선택해주세요",
      required: false,
      options: JSON.stringify(["선택지 1", "선택지 2", "선택지 3"]),
    },
  },
  {
    type: "CHECKBOX",
    label: "체크박스",
    description: "예/아니오 또는 동의 확인",
    icon: CheckSquare,
    defaultProps: {
      label: "확인해주세요",
      required: false,
    },
  },
  {
    type: "AI_TOPIC_HELPER",
    label: "AI 주제 도우미",
    description: "AI 기반 주제 추천 모듈",
    icon: Brain,
    defaultProps: {
      label: "AI 주제 추천",
      required: false,
    },
  },
];

interface DraggableComponentProps {
  item: ComponentItem;
}

function DraggableComponent({ item }: DraggableComponentProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "component",
    item: { 
      type: item.type,
      ...item.defaultProps 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const Icon = item.icon;

  return (
    <div
      ref={drag}
      className={`cursor-move transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ComponentPalette() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>컴포넌트 팔레트</CardTitle>
        <CardDescription>
          원하는 컴포넌트를 드래그하여 단계에 추가하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {componentItems.map((item) => (
          <DraggableComponent key={item.type} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
