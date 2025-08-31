"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Calculator, Table, Image, Upload } from "lucide-react";
import TableEditor from "./table-editor";
import TextWithTables from "./text-with-tables";

interface TextExpansionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  initialText: string;
  title: string;
  placeholder?: string;
  maxLength?: number;
  isRichText?: boolean; // 리치 텍스트 모드 여부 (contentEditable)
}

export default function TextExpansionModal({
  isOpen,
  onClose,
  onSave,
  initialText,
  title,
  placeholder = "텍스트를 입력하세요...",
  maxLength,
  isRichText = false
}: TextExpansionModalProps) {
  const [text, setText] = useState(initialText);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const isComposingRef = useRef(false);
  
  // Math Editor 기능들
  const [isEditingMath, setIsEditingMath] = useState(false);
  const [editingMathContent, setEditingMathContent] = useState('');
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(initialText);
  }, [initialText, isOpen]);

  // 더 이상 contentEditable 초기화 필요 없음 (미리보기만 사용)

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  const handleCancel = () => {
    setText(initialText); // 원래 텍스트로 복원
    onClose();
  };

  // 리치 텍스트 모드에서는 HTML 태그를 제거하고 순수 텍스트로 계산
  const getPlainText = (htmlText: string) => {
    if (!isRichText) return htmlText;
    const div = document.createElement('div');
    div.innerHTML = htmlText;
    return div.textContent || div.innerText || '';
  };
  
  const plainText = getPlainText(text);
  const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = plainText.length;

  // Math Editor 기능 함수들
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const insertImage = async (file: File) => {
    if (!isRichText) return;
    
    setIsUploading(true);
    try {
      const base64 = await convertImageToBase64(file);
      const imageHtml = `<img src="${base64}" alt="삽입된 이미지" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      
      insertHtmlAtCursor(imageHtml);
      
      setTimeout(() => {
        if (contentEditableRef.current) {
          contentEditableRef.current.focus();
        }
      }, 100);
      
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      insertImage(file);
    }
    // input value 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTableInsert = (tableHtml: string) => {
    insertHtmlAtCursor(tableHtml);
    setIsEditingTable(false);
    
    setTimeout(() => {
      if (contentEditableRef.current) {
        contentEditableRef.current.focus();
      }
    }, 100);
  };

  const saveMathEdit = () => {
    if (!editingMathContent.trim()) return;
    
    const convertedMath = convertLatexToSymbols(editingMathContent);
    insertHtmlAtCursor(convertedMath);
    
    setIsEditingMath(false);
    setEditingMathContent('');
    
    setTimeout(() => {
      if (contentEditableRef.current) {
        contentEditableRef.current.focus();
      }
    }, 100);
  };

  const cancelMathEdit = () => {
    setIsEditingMath(false);
    setEditingMathContent('');
  };

  const insertMathSymbol = (symbol: string) => {
    setEditingMathContent(prev => prev + symbol);
  };

  // LaTeX를 실제 유니코드 수학 기호로 변환
  const convertLatexToSymbols = (latex: string) => {
    let result = latex;
    
    // 기본 수학 기호들
    const symbols: { [key: string]: string } = {
      '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
      '\\epsilon': 'ε', '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ',
      '\\pi': 'π', '\\sigma': 'σ', '\\phi': 'φ', '\\omega': 'ω',
      '\\infty': '∞', '\\pm': '±', '\\leq': '≤', '\\geq': '≥',
      '\\neq': '≠', '\\approx': '≈', '\\sqrt': '√', '\\sum': '∑',
      '\\int': '∫', '\\partial': '∂', '\\nabla': '∇', '\\times': '×',
      '\\div': '÷', '\\cdot': '⋅'
    };

    Object.entries(symbols).forEach(([latex, symbol]) => {
      result = result.replace(new RegExp(latex.replace('\\', '\\\\'), 'g'), symbol);
    });

    // 분수 처리: \frac{a}{b} → a/b 또는 유니코드 분수
    result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, numerator, denominator) => {
      const unicodeFractions: { [key: string]: string } = {
        '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
        '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙',
        '5/6': '⅚', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞'
      };
      
      const fractionKey = `${numerator}/${denominator}`;
      return unicodeFractions[fractionKey] || `${numerator}/${denominator}`;
    });

    // 지수 처리: ^{n} → 위첨자
    result = result.replace(/\^{(\d+)}/g, (match, exp) => {
      const superscripts: { [key: string]: string } = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      let converted = '';
      for (const char of exp) {
        converted += superscripts[char] || char;
      }
      return converted;
    });

    // 하첨자 처리: _{n} → 아래첨자
    result = result.replace(/_{(\d+)}/g, (match, sub) => {
      const subscripts: { [key: string]: string } = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
      };
      let converted = '';
      for (const char of sub) {
        converted += subscripts[char] || char;
      }
      return converted;
    });

    return result;
  };

  // 현재 커서 위치에 HTML 삽입 (textarea 기반)
  const insertHtmlAtCursor = (html: string) => {
    if (!isRichText || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = text.substring(0, start) + html + text.substring(end);
    setText(newText);
    
    // 커서 위치를 삽입된 HTML 뒤로 이동
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = start + html.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 리치 텍스트 툴바 */}
        {isRichText && (
          <div className="flex gap-2 items-center px-4 py-2 border-b bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingMath(true)}
              disabled={isUploading}
              className="flex items-center gap-1"
            >
              <Calculator className="h-4 w-4" />
              수식 입력
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingTable(true)}
              disabled={isUploading}
              className="flex items-center gap-1"
            >
              <Table className="h-4 w-4" />
              표 삽입
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <Image className="h-4 w-4" />
              )}
              이미지 첨부
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {isRichText ? (
            <div className="flex-1 flex gap-4">
              {/* 편집 영역 (왼쪽) - 일반 textarea */}
              <div className="flex-1 flex flex-col">
                <div className="text-sm font-medium mb-2 text-gray-700">편집</div>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed font-mono"
                  style={{ minHeight: '300px' }}
                />
              </div>
              
              {/* 미리보기 영역 (오른쪽) */}
              <div className="flex-1 flex flex-col">
                <div className="text-sm font-medium mb-2 text-gray-700">미리보기</div>
                <div className="flex-1 w-full p-3 border border-gray-200 rounded-lg text-sm leading-relaxed overflow-y-auto bg-gray-50" style={{ minHeight: '300px' }}>
                  {text ? (
                    <TextWithTables content={text} />
                  ) : (
                    <span className="text-gray-400">{placeholder}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              className="flex-1 w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed"
              style={{ minHeight: '300px' }}
            />
          )}
          
          {/* Stats */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <div className="flex gap-4">
              <span>단어: {wordCount}개</span>
              <span>글자: {charCount}개</span>
              {maxLength && (
                <span className={charCount > maxLength * 0.9 ? 'text-orange-500' : ''}>
                  {maxLength - charCount}자 남음
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              Ctrl+Enter로 저장
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="min-w-[80px]"
          >
            저장
          </Button>
        </div>
      </div>

      {/* 수식 편집 모달 */}
      {isEditingMath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">수식 입력</h3>
            
            {/* 수학 기호 버튼들 */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">자주 사용하는 기호:</div>
              <div className="grid grid-cols-8 gap-2">
                {[
                  { symbol: 'π', latex: '\\pi' },
                  { symbol: '∞', latex: '\\infty' },
                  { symbol: '±', latex: '\\pm' },
                  { symbol: '≤', latex: '\\leq' },
                  { symbol: '≥', latex: '\\geq' },
                  { symbol: '≠', latex: '\\neq' },
                  { symbol: '≈', latex: '\\approx' },
                  { symbol: '√', latex: '\\sqrt{}' },
                  { symbol: '∑', latex: '\\sum' },
                  { symbol: '∫', latex: '\\int' },
                  { symbol: '∂', latex: '\\partial' },
                  { symbol: '∇', latex: '\\nabla' },
                  { symbol: '×', latex: '\\times' },
                  { symbol: '÷', latex: '\\div' },
                  { symbol: '⋅', latex: '\\cdot' },
                  { symbol: 'α', latex: '\\alpha' }
                ].map(({ symbol, latex }) => (
                  <Button
                    key={symbol}
                    variant="outline"
                    size="sm"
                    onClick={() => insertMathSymbol(latex)}
                    className="h-8 w-8 p-0 text-sm"
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                LaTeX 수식 (예: x^{2} + y^{2} = r^{2})
              </label>
              <textarea
                value={editingMathContent}
                onChange={(e) => setEditingMathContent(e.target.value)}
                placeholder="수학 수식을 LaTeX 형식으로 입력하세요..."
                className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">미리보기:</div>
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 min-h-[40px]">
                {convertLatexToSymbols(editingMathContent) || '수식을 입력하면 여기에 미리보기가 표시됩니다.'}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelMathEdit}>
                취소
              </Button>
              <Button onClick={saveMathEdit}>
                삽입
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 표 편집 모달 */}
      {isEditingTable && (
        <TableEditor
          onInsert={handleTableInsert}
          onClose={() => setIsEditingTable(false)}
        />
      )}
    </div>
  );
}

// 키보드 단축키 훅
export function useTextExpansionShortcuts(
  onSave: () => void,
  onCancel: () => void,
  isModalOpen: boolean
) {
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter로 저장
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        onSave();
      }
      // Escape로 취소
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onCancel, isModalOpen]);
}
