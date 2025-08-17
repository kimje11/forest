"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import 'katex/dist/katex.min.css';

interface MathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
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
  className = ""
}: MathEditorProps) {
  const [isEditingMath, setIsEditingMath] = useState(false);
  const [editingMathContent, setEditingMathContent] = useState("");
  const [editingMathType, setEditingMathType] = useState<'inline' | 'block'>('inline');

  const insertMathExpression = (type: 'inline' | 'block') => {
    if (disabled) return;
    
    // 수식 편집 모달 열기
    setEditingMathType(type);
    setEditingMathContent('');
    setIsEditingMath(true);
  };

  const saveMathEdit = () => {
    if (!editingMathContent.trim()) return;
    
    const textarea = document.querySelector('textarea[data-math-editor]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // LaTeX 수식을 실제 수학 기호로 변환
      const convertedMath = convertLatexToSymbols(editingMathContent);
      
      const newValue = value.substring(0, start) + convertedMath + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + convertedMath.length, start + convertedMath.length);
      }, 0);
    }
    
    setIsEditingMath(false);
    setEditingMathContent('');
  };

  const cancelMathEdit = () => {
    setIsEditingMath(false);
    setEditingMathContent('');
  };

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

  return (
    <div className={`space-y-4 ${className}`}>
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
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">텍스트 입력</label>
        <textarea
          data-math-editor
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-64 p-3 border rounded-md resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        <div className="text-xs text-gray-500">
          수식 입력 버튼을 클릭하여 수학 기호를 입력하세요.
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
    </div>
  );
}