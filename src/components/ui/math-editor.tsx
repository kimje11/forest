"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, Table, Image, Upload, Eye, Edit3, Maximize2, X, Minimize2 } from "lucide-react";
import TableEditor from "./table-editor";
import TextWithTables from "./text-with-tables";

import 'katex/dist/katex.min.css';

interface MathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  title?: string;
  className?: string;
}

// 수학 미리보기 컴포넌트
function MathPreview({ content, displayMode = false }: { content: string; displayMode?: boolean }) {
  const [rendered, setRendered] = useState('');

  useEffect(() => {
    const renderMath = async () => {
      if (!content.trim()) {
        setRendered('<span class="text-gray-400">수식을 입력하면 여기에 미리보기가 표시됩니다</span>');
        return;
      }

      try {
        const katex = (await import('katex')).default;
        const result = katex.renderToString(content, {
          throwOnError: false,
          displayMode
        });
        setRendered(result);
      } catch {
        setRendered('<span class="text-red-500">수식 오류</span>');
      }
    };

    renderMath();
  }, [content, displayMode]);

  return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
}

export default function MathEditor({ 
  value, 
  onChange, 
  placeholder = "텍스트를 입력하세요...",
  disabled = false,
  readOnly = false,
  title,
  className = ""
}: MathEditorProps) {
  const [isEditingMath, setIsEditingMath] = useState(false);
  const [editingMathContent, setEditingMathContent] = useState("");
  const [editingMathType, setEditingMathType] = useState<'inline' | 'block'>('inline');
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true); // 기본값을 편집 모드로 변경
  
  // readOnly 상태 변경 시 모드 조정
  useEffect(() => {
    if (readOnly) {
      setIsEditMode(false);
    }
  }, [readOnly]);

  // contentEditable div의 내용을 외부 value와 동기화 (조합 중이 아닐 때만)
  useEffect(() => {
    if (!isEditMode && contentEditableRef.current && !isComposingRef.current) {
      const currentContent = contentEditableRef.current.innerHTML;
      const newContent = value || `<span class="text-gray-400">${placeholder}</span>`;
      
      // 내용이 실제로 다를 때만 업데이트
      if (currentContent !== newContent && currentContent !== value) {
        const focusedElement = document.activeElement;
        const wasFocused = focusedElement === contentEditableRef.current;
        
        contentEditableRef.current.innerHTML = newContent;
        
        // 포커스가 있었다면 복원
        if (wasFocused) {
          contentEditableRef.current.focus();
        }
      }
    }
  }, [value, isEditMode, placeholder]);
  const [isUploading, setIsUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const isComposingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertMathExpression = (type: 'inline' | 'block') => {
    if (disabled || readOnly) return;
    
    // 수식 편집 모달 열기 (모드 전환 없음)
    setEditingMathType(type);
    setEditingMathContent('');
    setIsEditingMath(true);
  };

  const insertTable = () => {
    if (disabled || readOnly) return;
    // 표 편집 모달 열기 (모드 전환 없음)
    setIsEditingTable(true);
  };

  // 이미지를 Base64로 변환하는 함수
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 이미지 삽입 함수
  const insertImage = async (file: File) => {
    if (disabled || readOnly) return;
    
    setIsUploading(true);
    try {
      const base64 = await convertImageToBase64(file);
      const imageHtml = `<img src="${base64}" alt="삽입된 이미지" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      
      insertHtmlAtCursor(imageHtml);
      
      // 이미지 삽입 후 contentEditable에 포커스 복원
      setTimeout(() => {
        if (!isEditMode && contentEditableRef.current) {
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

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      insertImage(file);
    } else {
      alert('이미지 파일만 업로드할 수 있습니다.');
    }
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 클립보드 붙여넣기 핸들러
  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await insertImage(file);
        }
        break;
      }
    }
  };

  const handleTableInsert = (tableHtml: string) => {
    insertHtmlAtCursor(tableHtml);
    setIsEditingTable(false);
    
    // 표 삽입 후 contentEditable에 포커스 복원
    setTimeout(() => {
      if (!isEditMode && contentEditableRef.current) {
        contentEditableRef.current.focus();
      }
    }, 100);
  };

  const saveMathEdit = () => {
    if (!editingMathContent.trim()) return;
    
    // LaTeX 수식을 실제 수학 기호로 변환
    const convertedMath = convertLatexToSymbols(editingMathContent);
    
    insertHtmlAtCursor(convertedMath);
    
    setIsEditingMath(false);
    setEditingMathContent('');
    
    // 수식 삽입 후 contentEditable에 포커스 복원
    setTimeout(() => {
      if (!isEditMode && contentEditableRef.current) {
        contentEditableRef.current.focus();
      }
    }, 100);
  };

  const cancelMathEdit = () => {
    setIsEditingMath(false);
    setEditingMathContent('');
  };

  const handleMathInsert = () => {
    if (editingMathContent.trim()) {
      insertHtmlAtCursor(`<span class="math-expression">\\(${editingMathContent}\\)</span>`);
    }
    setIsEditingMath(false);
    setEditingMathContent('');
  };

  const toggleExpansion = () => {
    if (disabled || readOnly) return;
    setIsExpanded(!isExpanded);
  };

  // ESC 키로 확대 모드 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isExpanded]);

  // 내용 동기화 (확대 모드 전환 시 및 모드 변경 시)
  useEffect(() => {
    // 편집 모드에서 textarea 동기화
    if (isEditMode && textareaRef.current && textareaRef.current.value !== (value || '')) {
      textareaRef.current.value = value || '';
    }
    
    // 미리보기 모드에서 contentEditable 동기화
    if (!isEditMode && contentEditableRef.current) {
      const currentContent = contentEditableRef.current.innerHTML;
      const shouldUpdate = value && value.trim() !== '' ? 
        currentContent !== value : 
        !currentContent.includes(placeholder || '');
        
      if (shouldUpdate) {
        if (value && value.trim() !== '') {
          contentEditableRef.current.innerHTML = value;
        } else if (placeholder) {
          contentEditableRef.current.innerHTML = `<span class="text-gray-400">${placeholder}</span>`;
        }
      }
    }
  }, [isExpanded, isEditMode, value, placeholder]);

  const insertMathSymbol = (symbol: string) => {
    setEditingMathContent(prev => prev + symbol);
  };

  // LaTeX를 실제 유니코드 수학 기호로 변환
  const convertLatexToSymbols = (latex: string): string => {
    const conversions: { [key: string]: string } = {
      // 기본 연산자
      '\\pm': '±',
      '\\times': '×',
      '\\div': '÷',
      '\\cdot': '·',
      
      // 관계 기호
      '\\leq': '≤',
      '\\geq': '≥',
      '\\neq': '≠',
      '\\approx': '≈',
      '\\equiv': '≡',
      '\\in': '∈',
      '\\subset': '⊂',
      '\\cup': '∪',
      '\\cap': '∩',
      
      // 그리스 문자
      '\\alpha': 'α',
      '\\beta': 'β',
      '\\gamma': 'γ',
      '\\delta': 'δ',
      '\\epsilon': 'ε',
      '\\pi': 'π',
      '\\lambda': 'λ',
      '\\mu': 'μ',
      '\\sigma': 'σ',
      '\\omega': 'ω',
      '\\theta': 'θ',
      '\\phi': 'φ',
      
      // 특수 기호
      '\\infty': '∞',
      '\\partial': '∂',
      '\\Delta': 'Δ',
      '\\to': '→',
    };

    let result = latex;
    
    // 적분 처리: \int_{a}^{b} → ∫ᵃᵇ
    result = result.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, (match, lower, upper) => {
      const convertedLower = convertToSubscript(lower);
      const convertedUpper = convertToSuperscript(upper);
      return `∫${convertedLower}${convertedUpper}`;
    });
    
    // 적분 (범위 없음): \int → ∫
    result = result.replace(/\\int(?![_^])/g, '∫');
    
    // 합 기호 처리: \sum_{i=1}^{n} → Σᵢ₌₁ⁿ
    result = result.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, (match, lower, upper) => {
      const convertedLower = convertToSubscript(lower);
      const convertedUpper = convertToSuperscript(upper);
      return `Σ${convertedLower}${convertedUpper}`;
    });
    
    // 합 기호 (범위 없음): \sum → Σ
    result = result.replace(/\\sum(?![_^])/g, 'Σ');
    
    // 곱 기호 처리: \prod_{i=1}^{n} → Π_{i=1}^{n}
    result = result.replace(/\\prod_\{([^}]+)\}\^\{([^}]+)\}/g, (match, lower, upper) => {
      const convertedLower = convertToSubscript(lower);
      const convertedUpper = convertToSuperscript(upper);
      return `Π${convertedLower}${convertedUpper}`;
    });
    
    // 극한 처리: \lim_{x \to 0} → lim(x→0)
    result = result.replace(/\\lim_\{([^}]+)\}/g, (match, condition) => {
      const convertedCondition = condition.replace(/\\to/g, '→');
      return `lim(${convertedCondition})`;
    });
    
    // 분수 처리: \frac{a}{b} → 실제 분수 기호 또는 a/b
    result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, numerator, denominator) => {
      // 일반적인 분수들을 유니코드 분수 기호로 변환
      const unicodeFractions: { [key: string]: string } = {
        '1/2': '½',
        '1/3': '⅓',
        '2/3': '⅔',
        '1/4': '¼',
        '3/4': '¾',
        '1/5': '⅕',
        '2/5': '⅖',
        '3/5': '⅗',
        '4/5': '⅘',
        '1/6': '⅙',
        '5/6': '⅚',
        '1/7': '⅐',
        '1/8': '⅛',
        '3/8': '⅜',
        '5/8': '⅝',
        '7/8': '⅞',
        '1/9': '⅑',
        '1/10': '⅒'
      };
      
      const fractionKey = `${numerator}/${denominator}`;
      
      // 유니코드 분수가 있으면 사용
      if (unicodeFractions[fractionKey]) {
        return unicodeFractions[fractionKey];
      }
      
      // 단순한 분수인 경우 분수 슬래시 사용
      if (/^[0-9a-zA-Z]+$/.test(numerator) && /^[0-9a-zA-Z]+$/.test(denominator)) {
        // 분수 슬래시 (⁄) 사용 - 일반 슬래시보다 좀 더 분수처럼 보임
        return `${numerator}⁄${denominator}`;
      }
      
      // 복잡한 분수는 일반 형태로
      const isSimpleNum = /^[0-9a-zA-Z]$/.test(numerator);
      const isSimpleDen = /^[0-9a-zA-Z]$/.test(denominator);
      
      const num = isSimpleNum ? numerator : `(${numerator})`;
      const den = isSimpleDen ? denominator : `(${denominator})`;
      
      return `${num}/${den}`;
    });
    
    // 제곱근 처리: \sqrt{x} → √x
    result = result.replace(/\\sqrt\{([^}]+)\}/g, (match, content) => {
      // 단순한 경우 괄호 생략
      const isSimple = /^[0-9a-zA-Z]$/.test(content);
      return isSimple ? `√${content}` : `√(${content})`;
    });
    
    // 지수 처리: x^{n} → xⁿ
    result = result.replace(/\^\{([^}]+)\}/g, (match, exp) => {
      return convertToSuperscript(exp);
    });
    
    // 아래첨자 처리: x_{n} → xₙ
    result = result.replace(/_{([^}]+)}/g, (match, sub) => {
      return convertToSubscript(sub);
    });
    
    // 기타 LaTeX 명령어를 유니코드로 변환
    for (const [latexCmd, unicode] of Object.entries(conversions)) {
      result = result.replace(new RegExp(latexCmd.replace(/\\/g, '\\\\'), 'g'), unicode);
    }
    
    return result;
  };

  // 위첨자 변환 함수
  const convertToSuperscript = (text: string): string => {
    const superscripts: { [key: string]: string } = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
      'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'a': 'ᵃ', 'b': 'ᵇ'
    };
    
    let converted = '';
    for (const char of text) {
      converted += superscripts[char] || char;
    }
    return converted;
  };

  // 아래첨자 변환 함수
  const convertToSubscript = (text: string): string => {
    const subscripts: { [key: string]: string } = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
      'a': 'ₐ', 'e': 'ₑ', 'i': 'ᵢ', 'o': 'ₒ', 'u': 'ᵤ',
      'x': 'ₓ', 'n': 'ₙ', 'm': 'ₘ', 'k': 'ₖ'
    };
    
    let converted = '';
    for (const char of text) {
      converted += subscripts[char] || char;
    }
    return converted;
  };

  // 현재 커서 위치에 HTML 삽입 (모든 모드에서 작동)
  const insertHtmlAtCursor = (html: string) => {
    if (isEditMode && textareaRef.current) {
      // 편집 모드에서 textarea 사용
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = (value || '').substring(0, start) + html + (value || '').substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + html.length, start + html.length);
      }, 0);
    } else if (!isEditMode && contentEditableRef.current) {
      // 미리보기 모드에서 contentEditable 사용
      const contentDiv = contentEditableRef.current;
      
      // placeholder 제거
      const placeholderSpan = contentDiv.querySelector('span.text-gray-400');
      if (placeholderSpan) {
        placeholderSpan.remove();
      }
      
      // contentEditable이 포커스되어 있지 않으면 포커스를 맞춤
      if (document.activeElement !== contentDiv) {
        contentDiv.focus();
      }
      
      // execCommand를 사용하여 안전하게 HTML 삽입
      try {
        const success = document.execCommand('insertHTML', false, html);
        if (success) {
          onChange(contentDiv.innerHTML);
        } else {
          // execCommand 실패 시 끝에 추가
          contentDiv.innerHTML += html;
          onChange(contentDiv.innerHTML);
        }
      } catch (error) {
        console.warn('HTML insertion failed, using fallback:', error);
        // 모든 DOM 조작이 실패할 경우 안전한 fallback
        contentDiv.innerHTML += html;
        onChange(contentDiv.innerHTML);
      }
    } else {
      // 기본적으로 끝에 추가
      const currentValue = value || '';
      onChange(currentValue + html);
    }
  };

  // 확대 모드와 일반 모드를 완전히 분리
  if (isExpanded) {
    return (
      <div key="expanded-mode" className="fixed inset-0 z-40">
        {/* 배경 오버레이 */}
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        
        {/* 확대된 에디터 */}
        <div className="fixed inset-2 z-50 bg-white rounded-lg shadow-2xl border p-4 flex flex-col h-[calc(100vh-1rem)] overflow-hidden">
          {/* 확대 모드 헤더 */}
          <div className="flex items-center justify-between pb-4 border-b">
            <h2 className="text-lg font-semibold">수식 및 표 입력 - 확대 편집</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pt-4 items-center">
        {!readOnly && (
        <div className="flex gap-2 items-center justify-center flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertMathExpression('inline')}
            disabled={disabled}
          >
            <Calculator className="h-4 w-4 mr-1" />
            수식 입력
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={insertTable}
            disabled={disabled}
          >
            <Table className="h-4 w-4 mr-1" />
            표 삽입
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Upload className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Image className="h-4 w-4 mr-1" />
            )}
            {isUploading ? "업로드 중..." : "이미지 첨부"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={toggleExpansion}
            disabled={disabled}
            title="축소"
          >
            <Minimize2 className="h-4 w-4 mr-1" />
            축소
          </Button>
          <Button
            size="sm"
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode(!isEditMode)}
            disabled={disabled || readOnly}
          >
            {isEditMode ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                미리보기
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-1" />
                편집
              </>
            )}
          </Button>
        </div>
      )}

      <div className="space-y-2 flex flex-col items-center">
        <label className="text-sm font-medium">내용 입력 (텍스트, 수식, 표, 이미지)</label>
        {isEditMode ? (
          <>
            <textarea
              ref={textareaRef}
              data-math-editor
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              className="w-[700px] h-[calc(100vh-220px)] p-3 border rounded-md resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed read-only:bg-gray-50 read-only:cursor-not-allowed"
            />
            <div className="text-xs text-gray-500 text-center">
              편집 모드: 텍스트 입력 후 수식/표/이미지 버튼으로 추가 요소를 삽입할 수 있습니다. Ctrl+V로 이미지를 붙여넣을 수 있습니다.
            </div>
          </>
        ) : (
          <>
            <div 
              ref={contentEditableRef}
              contentEditable={!disabled && !readOnly}
              suppressContentEditableWarning={true}
              className={`w-[700px] h-[calc(100vh-220px)] p-3 border rounded-md overflow-y-auto text-sm ${
                disabled || readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-text'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
              onCompositionStart={(e) => {
                setIsComposing(true);
                isComposingRef.current = true;
                
                if (!disabled && !readOnly) {
                  // placeholder가 있으면 미리 제거하여 조합 시작 전에 정리
                  const target = e.target as HTMLDivElement;
                  const placeholderSpan = target.querySelector('span.text-gray-400');
                  if (placeholderSpan) {
                    placeholderSpan.remove();
                    // 빈 콘텐츠로 설정하여 조합이 올바른 위치에서 시작되도록 함
                    if (!target.textContent?.trim()) {
                      target.innerHTML = '';
                    }
                  }
                }
              }}
              onCompositionEnd={(e) => {
                setIsComposing(false);
                isComposingRef.current = false;
                
                if (!disabled && !readOnly) {
                  const target = e.target as HTMLDivElement;
                  // placeholder span이 있으면 제거
                  const placeholderSpan = target.querySelector('span.text-gray-400');
                  if (placeholderSpan && target.textContent?.trim()) {
                    placeholderSpan.remove();
                  }
                  // 조합 완료 후 즉시 업데이트
                  onChange(target.innerHTML);
                }
              }}
              onInput={(e) => {
                // 조합 중이 아닐 때만 실시간 업데이트
                if (!disabled && !readOnly && !isComposingRef.current) {
                  const target = e.target as HTMLDivElement;
                  // placeholder span이 있으면 제거
                  const placeholderSpan = target.querySelector('span.text-gray-400');
                  if (placeholderSpan && target.textContent?.trim()) {
                    placeholderSpan.remove();
                  }
                  onChange(target.innerHTML);
                }
              }}
              onPaste={(e) => {
                if (!disabled && !readOnly) {
                  handlePaste(e);
                }
              }}
              onFocus={(e) => {
                if (!disabled && !readOnly) {
                  const target = e.target as HTMLDivElement;
                  const placeholderSpan = target.querySelector('span.text-gray-400');
                  if (placeholderSpan && target.textContent?.trim() === placeholder) {
                    target.innerHTML = '';
                  }
                }
              }}
              onBlur={(e) => {
                if (!disabled && !readOnly) {
                  const target = e.target as HTMLDivElement;
                  if (!target.textContent?.trim() && !target.querySelector('img, table')) {
                    target.innerHTML = `<span class="text-gray-400">${placeholder}</span>`;
                    onChange('');
                  }
                }
              }}
            />
            <div className="text-xs text-gray-500">
              미리보기 모드: 표와 수식, 이미지가 실제 모습으로 표시됩니다. 직접 클릭하여 텍스트를 입력하거나 "편집" 버튼으로 HTML 편집이 가능합니다.
            </div>
          </>
        )}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* 수식 편집 모달 */}
      {isEditingMath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">수식 입력</h3>
              <Button variant="outline" size="sm" onClick={cancelMathEdit}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">수식 입력 (LaTeX 형식)</label>
                <textarea
                  value={editingMathContent}
                  onChange={(e) => setEditingMathContent(e.target.value)}
                  placeholder="x^{2} + 2x + 1 = 0"
                  className="w-full h-32 p-3 border rounded-md resize-none font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  예시: x^{"{2}"} (지수), x_{"{1}"} (아래첨자), \frac{"{a}"}{"{b}"} (분수), \sqrt{"{x}"} (제곱근)
                </div>
              </div>

              {/* 실시간 미리보기 */}
              <div>
                <label className="text-sm font-medium block mb-2">미리보기</label>
                <div className="w-full p-3 border rounded-md bg-gray-50 min-h-[60px] flex items-center justify-center">
                  <MathPreview content={editingMathContent} displayMode={false} />
                </div>
              </div>

              {/* 빠른 입력 버튼들 */}
              <div>
                <label className="text-sm font-medium block mb-2">빠른 입력</label>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('^{}')} className="text-xs">
                    x^n
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('_{}')} className="text-xs">
                    x_n
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\frac{}{}')} className="text-xs">
                    분수
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\sqrt{}')} className="text-xs">
                    √
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\pm')} className="text-xs">
                    ±
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\times')} className="text-xs">
                    ×
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\div')} className="text-xs">
                    ÷
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\leq')} className="text-xs">
                    ≤
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\pi')} className="text-xs">
                    π
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\alpha')} className="text-xs">
                    α
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\beta')} className="text-xs">
                    β
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\infty')} className="text-xs">
                    ∞
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\int_{0}^{1}')} className="text-xs">
                    적분
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\lim_{x \\to 0}')} className="text-xs">
                    극한
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\sum_{i=1}^{n}')} className="text-xs">
                    합
                  </Button>
                </div>
              </div>

              {/* 변환 결과 미리보기 */}
              <div>
                <label className="text-sm font-medium block mb-2">텍스트에 삽입될 내용</label>
                <div className="w-full p-3 border rounded-md bg-blue-50 min-h-[40px] font-mono text-sm">
                  {editingMathContent ? convertLatexToSymbols(editingMathContent) : '수식을 입력하면 변환된 기호가 표시됩니다'}
                </div>
              </div>

              {/* 저장/취소 버튼 */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={cancelMathEdit}>
                  취소
                </Button>
                <Button onClick={saveMathEdit} disabled={!editingMathContent.trim()}>
                  텍스트에 삽입
                </Button>
              </div>
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
        </div>
      </div>
    );
  }

  // 일반 모드 렌더링
  return (
    <div key="normal-mode" className={`space-y-4 ${className || ''}`}>
      {!readOnly && (
        <div className="flex gap-2 items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertMathExpression('inline')}
            disabled={disabled}
          >
            <Calculator className="h-4 w-4 mr-1" />
            수식 입력
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={insertTable}
            disabled={disabled}
          >
            <Table className="h-4 w-4 mr-1" />
            표 삽입
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Upload className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Image className="h-4 w-4 mr-1" />
            )}
            {isUploading ? "업로드 중..." : "이미지 첨부"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={toggleExpansion}
            disabled={disabled}
            title="확대하여 편집"
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            확대 편집
          </Button>
          <Button
            size="sm"
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode(!isEditMode)}
            disabled={disabled}
          >
            {isEditMode ? <Eye className="h-4 w-4 mr-1" /> : <Edit3 className="h-4 w-4 mr-1" />}
            {isEditMode ? '미리보기' : '편집'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* 메인 편집 영역 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">내용 입력 (텍스트, 수식, 표, 이미지)</label>
        <div className="relative">
          {isEditMode ? (
            <>
              <textarea
                ref={textareaRef}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                onPaste={handlePaste}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                className="w-[700px] h-64 p-3 border rounded-md resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed read-only:bg-gray-50 read-only:cursor-not-allowed"
              />
              <div className="text-xs text-gray-500">
                편집 모드: 텍스트 입력 후 수식/표/이미지 버튼으로 추가 요소를 삽입할 수 있습니다. Ctrl+V로 이미지를 붙여넣을 수 있습니다.
              </div>
            </>
          ) : (
          <>
            <div 
              ref={contentEditableRef}
              contentEditable={!disabled && !readOnly}
              suppressContentEditableWarning={true}
              className={`w-[700px] h-64 p-3 border rounded-md overflow-y-auto text-sm ${
                disabled || readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-text'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
              onCompositionStart={(e) => {
                setIsComposing(true);
                isComposingRef.current = true;
              }}
              onCompositionEnd={(e) => {
                setIsComposing(false);
                isComposingRef.current = false;
                onChange(contentEditableRef.current?.innerHTML || '');
              }}
              onInput={(e) => {
                if (!isComposingRef.current) {
                  onChange(contentEditableRef.current?.innerHTML || '');
                }
              }}
              onFocus={(e) => {
                if (!value || value.trim() === '') {
                  const placeholderSpan = e.currentTarget.querySelector('span.text-gray-400');
                  if (placeholderSpan) {
                    placeholderSpan.remove();
                  }
                }
              }}
              onBlur={(e) => {
                if (!value || value.trim() === '') {
                  e.currentTarget.innerHTML = `<span class="text-gray-400">${placeholder}</span>`;
                }
              }}
            />
            <div className="text-xs text-gray-500 text-center">
              미리보기 모드: 실시간으로 결과를 확인할 수 있습니다. 텍스트 입력 및 수식/표 삽입이 가능합니다.
            </div>
          </>
          )}
        </div>
      </div>

      {/* 수식 편집 모달 */}
      {isEditingMath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">수식 입력</h3>
              <Button variant="outline" size="sm" onClick={cancelMathEdit}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">수식 입력 (LaTeX 형식)</label>
                <textarea
                  value={editingMathContent}
                  onChange={(e) => setEditingMathContent(e.target.value)}
                  placeholder="x^{2} + 2x + 1 = 0"
                  className="w-full h-32 p-3 border rounded-md resize-none font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  예시: x^{"{2}"} (지수), x_{"{1}"} (아래첨자), \frac{"{a}"}{"{b}"} (분수), \sqrt{"{x}"} (제곱근)
                </div>
              </div>

              {/* 실시간 미리보기 */}
              <div>
                <label className="text-sm font-medium block mb-2">미리보기</label>
                <div className="w-full p-3 border rounded-md bg-gray-50 min-h-[60px] flex items-center justify-center">
                  <MathPreview content={editingMathContent} displayMode={false} />
                </div>
              </div>

              {/* 빠른 입력 버튼들 */}
              <div>
                <label className="text-sm font-medium block mb-2">빠른 입력</label>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('^{}')} className="text-xs">
                    x^n
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('_{}')} className="text-xs">
                    x_n
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\frac{}{}')} className="text-xs">
                    분수
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\sqrt{}')} className="text-xs">
                    √
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\sum_{i=1}^{n}')} className="text-xs">
                    ∑
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\int_{a}^{b}')} className="text-xs">
                    ∫
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\lim_{x \\to 0}')} className="text-xs">
                    lim
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\alpha')} className="text-xs">
                    α
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\beta')} className="text-xs">
                    β
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\gamma')} className="text-xs">
                    γ
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\theta')} className="text-xs">
                    θ
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\pi')} className="text-xs">
                    π
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\leq')} className="text-xs">
                    ≤
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\geq')} className="text-xs">
                    ≥
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\neq')} className="text-xs">
                    ≠
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => insertMathSymbol('\\pm')} className="text-xs">
                    ±
                  </Button>
                </div>
              </div>

              {/* 변환 결과 미리보기 */}
              <div>
                <label className="text-sm font-medium block mb-2">텍스트에 삽입될 내용</label>
                <div className="w-full p-3 border rounded-md bg-blue-50 min-h-[40px] font-mono text-sm">
                  {editingMathContent ? convertLatexToSymbols(editingMathContent) : '수식을 입력하면 변환된 기호가 표시됩니다'}
                </div>
              </div>

              {/* 저장/취소 버튼 */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={cancelMathEdit}>
                  취소
                </Button>
                <Button onClick={saveMathEdit} disabled={!editingMathContent.trim()}>
                  텍스트에 삽입
                </Button>
              </div>
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