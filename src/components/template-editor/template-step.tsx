"use client";

import { useState } from "react";
import { useDrop } from "react-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trash2, 
  Edit, 
  GripVertical, 
  Plus,
  Settings,
  Check,
  X,
  Maximize2
} from "lucide-react";
import { ComponentType } from "./component-palette";
import TextExpansionModal, { useTextExpansionShortcuts } from "@/components/ui/text-expansion-modal";

export interface TemplateComponent {
  id: string;
  type: ComponentType;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: string;
}

export interface TemplateStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  components: TemplateComponent[];
}

interface TemplateStepProps {
  step: TemplateStep;
  onUpdateStep: (stepId: string, updates: Partial<TemplateStep>) => void;
  onDeleteStep: (stepId: string) => void;
  onAddComponent: (stepId: string, component: Omit<TemplateComponent, "id" | "order">) => void;
  onUpdateComponent: (stepId: string, componentId: string, updates: Partial<TemplateComponent>) => void;
  onDeleteComponent: (stepId: string, componentId: string) => void;
}

function ComponentEditor({ 
  component, 
  onSave, 
  onCancel 
}: { 
  component: TemplateComponent;
  onSave: (updates: Partial<TemplateComponent>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    label: component.label,
    placeholder: component.placeholder || "",
    required: component.required,
    options: component.options || "",
  });
  
  const [showExpansionModal, setShowExpansionModal] = useState(false);
  const [expandingField, setExpandingField] = useState<'label' | 'placeholder' | 'options' | null>(null);

  const handleSave = () => {
    const updates: Partial<TemplateComponent> = {
      label: formData.label,
      required: formData.required,
    };

    if (component.type === "TEXT" || component.type === "TEXTAREA") {
      updates.placeholder = formData.placeholder;
    }

    if (component.type === "MULTIPLE_CHOICE") {
      updates.options = formData.options;
    }

    onSave(updates);
  };

  const openExpansionModal = (field: 'label' | 'placeholder' | 'options') => {
    setExpandingField(field);
    setShowExpansionModal(true);
  };

  const handleExpansionSave = (text: string) => {
    if (expandingField) {
      setFormData({ ...formData, [expandingField]: text });
    }
    setShowExpansionModal(false);
    setExpandingField(null);
  };

  const getExpansionModalData = () => {
    if (!expandingField) return { text: '', title: '', placeholder: '' };
    
    const data = {
      label: {
        text: formData.label,
        title: '컴포넌트 라벨 편집',
        placeholder: '컴포넌트의 라벨을 입력하세요...'
      },
      placeholder: {
        text: formData.placeholder,
        title: '플레이스홀더 편집', 
        placeholder: '사용자에게 보여줄 입력 힌트를 작성하세요...'
      },
      options: {
        text: formData.options ? JSON.parse(formData.options).join('\n') : '',
        title: '선택지 편집',
        placeholder: '각 선택지를 새 줄에 입력하세요...\n예시:\n선택지 1\n선택지 2\n선택지 3'
      }
    };
    
    return data[expandingField];
  };

  return (
    <div className="p-3 border-2 border-blue-200 bg-blue-50 rounded-lg space-y-3">
      <div className="space-y-2">
        <label className="text-xs font-medium">라벨</label>
        <div className="flex gap-2">
          <Input
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="컴포넌트 라벨"
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openExpansionModal('label')}
            title="확대하여 편집"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {(component.type === "TEXT" || component.type === "TEXTAREA" || component.type === "MATH_EDITOR") && (
        <div className="space-y-2">
          <label className="text-xs font-medium">플레이스홀더</label>
          <div className="flex gap-2">
            <Input
              value={formData.placeholder}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              placeholder="입력 힌트"
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openExpansionModal('placeholder')}
              title="확대하여 편집"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {component.type === "MULTIPLE_CHOICE" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">선택지 (한 줄에 하나씩)</label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openExpansionModal('options')}
              title="확대하여 편집"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
          <textarea
            value={formData.options ? JSON.parse(formData.options).join("\n") : ""}
            onChange={(e) => {
              const options = e.target.value.split("\n").filter(option => option.trim());
              setFormData({ ...formData, options: JSON.stringify(options) });
            }}
            className="w-full p-2 text-sm border rounded resize-none"
            rows={3}
            placeholder="선택지 1&#10;선택지 2&#10;선택지 3"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`required-${component.id}`}
          checked={formData.required}
          onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
          className="h-4 w-4"
        />
        <label htmlFor={`required-${component.id}`} className="text-xs font-medium">
          필수 입력
        </label>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>
          <Check className="h-3 w-3 mr-1" />
          저장
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="h-3 w-3 mr-1" />
          취소
        </Button>
      </div>

      {/* 텍스트 확대 모달 */}
      <TextExpansionModal
        isOpen={showExpansionModal}
        onClose={() => {
          setShowExpansionModal(false);
          setExpandingField(null);
        }}
        onSave={(text) => {
          if (expandingField === 'options') {
            // 선택지의 경우 줄바꿈으로 분할하여 JSON 배열로 저장
            const options = text.split('\n').filter(option => option.trim());
            handleExpansionSave(JSON.stringify(options));
          } else {
            handleExpansionSave(text);
          }
        }}
        initialText={getExpansionModalData().text}
        title={getExpansionModalData().title}
        placeholder={getExpansionModalData().placeholder}
        maxLength={expandingField === 'label' ? 100 : expandingField === 'placeholder' ? 200 : undefined}
      />
    </div>
  );
}

function ComponentItem({ 
  component, 
  onEdit, 
  onDelete 
}: { 
  component: TemplateComponent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const getComponentTypeLabel = (type: ComponentType) => {
    const labels: Record<ComponentType, string> = {
      TEXT: "텍스트",
      TEXTAREA: "긴 텍스트",
      FILE_UPLOAD: "파일 업로드",
      MULTIPLE_CHOICE: "객관식",
      CHECKBOX: "체크박스",
      AI_TOPIC_HELPER: "AI 도우미",
    };
    return labels[type];
  };

  return (
    <div className="p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <GripVertical className="h-4 w-4 text-gray-400" />
        <div>
          <p className="text-sm font-medium">{component.label}</p>
          <p className="text-xs text-gray-500">
            {getComponentTypeLabel(component.type)}
            {component.required && " (필수)"}
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Edit className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function TemplateStepComponent({
  step,
  onUpdateStep,
  onDeleteStep,
  onAddComponent,
  onUpdateComponent,
  onDeleteComponent,
}: TemplateStepProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [stepTitle, setStepTitle] = useState(step.title);
  const [stepDescription, setStepDescription] = useState(step.description || "");
  const [showStepExpansionModal, setShowStepExpansionModal] = useState(false);
  const [expandingStepField, setExpandingStepField] = useState<'title' | 'description' | null>(null);

  const [{ isOver }, drop] = useDrop({
    accept: "component",
    drop: (item: any) => {
      const newComponent: Omit<TemplateComponent, "id" | "order"> = {
        type: item.type,
        label: item.label,
        placeholder: item.placeholder,
        required: item.required,
        options: item.options,
      };
      onAddComponent(step.id, newComponent);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleSaveTitle = () => {
    onUpdateStep(step.id, { 
      title: stepTitle, 
      description: stepDescription 
    });
    setIsEditingTitle(false);
  };

  const openStepExpansionModal = (field: 'title' | 'description') => {
    setExpandingStepField(field);
    setShowStepExpansionModal(true);
  };

  const handleStepExpansionSave = (text: string) => {
    if (expandingStepField === 'title') {
      setStepTitle(text);
    } else if (expandingStepField === 'description') {
      setStepDescription(text);
    }
    setShowStepExpansionModal(false);
    setExpandingStepField(null);
  };

  const getStepExpansionModalData = () => {
    if (!expandingStepField) return { text: '', title: '', placeholder: '' };
    
    const data = {
      title: {
        text: stepTitle,
        title: '단계 제목 편집',
        placeholder: '이 단계의 제목을 입력하세요...'
      },
      description: {
        text: stepDescription,
        title: '단계 설명 편집',
        placeholder: '이 단계에 대한 상세한 설명을 작성하세요...\n\n학생들이 이 단계에서 무엇을 해야 하는지, 어떤 목표를 달성해야 하는지 명확하게 안내해주세요.'
      }
    };
    
    return data[expandingStepField];
  };

  return (
    <Card className={`${isOver ? "ring-2 ring-blue-500" : ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">단계 제목</label>
                  <div className="flex gap-2">
                    <Input
                      value={stepTitle}
                      onChange={(e) => setStepTitle(e.target.value)}
                      placeholder="단계 제목"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openStepExpansionModal('title')}
                      title="확대하여 편집"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">단계 설명 (선택사항)</label>
                  <div className="flex gap-2">
                    <Input
                      value={stepDescription}
                      onChange={(e) => setStepDescription(e.target.value)}
                      placeholder="단계 설명"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openStepExpansionModal('description')}
                      title="확대하여 편집"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveTitle}>
                    <Check className="h-3 w-3 mr-1" />
                    저장
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditingTitle(false);
                      setStepTitle(step.title);
                      setStepDescription(step.description || "");
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <CardTitle className="flex items-center gap-2">
                  <span>단계 {step.order}: {step.title}</span>
                  {step.isRequired && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                      필수
                    </span>
                  )}
                </CardTitle>
                {step.description && (
                  <CardDescription>{step.description}</CardDescription>
                )}
              </>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingTitle(true)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteStep(step.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent ref={drop} className="space-y-3">
        {step.components.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              여기에 컴포넌트를 드래그하여 추가하세요
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {step.components
              .sort((a, b) => a.order - b.order)
              .map((component) => (
                <div key={component.id}>
                  {editingComponent === component.id ? (
                    <ComponentEditor
                      component={component}
                      onSave={(updates) => {
                        onUpdateComponent(step.id, component.id, updates);
                        setEditingComponent(null);
                      }}
                      onCancel={() => setEditingComponent(null)}
                    />
                  ) : (
                    <ComponentItem
                      component={component}
                      onEdit={() => setEditingComponent(component.id)}
                      onDelete={() => onDeleteComponent(step.id, component.id)}
                    />
                  )}
                </div>
              ))}
          </div>
        )}
      </CardContent>

      {/* 단계 텍스트 확대 모달 */}
      <TextExpansionModal
        isOpen={showStepExpansionModal}
        onClose={() => {
          setShowStepExpansionModal(false);
          setExpandingStepField(null);
        }}
        onSave={handleStepExpansionSave}
        initialText={getStepExpansionModalData().text}
        title={getStepExpansionModalData().title}
        placeholder={getStepExpansionModalData().placeholder}
        maxLength={expandingStepField === 'title' ? 100 : undefined}
      />
    </Card>
  );
}
