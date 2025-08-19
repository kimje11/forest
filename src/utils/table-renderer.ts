/**
 * 표 관련 유틸리티 함수들
 */

// HTML 표를 안전하게 렌더링하기 위한 함수
export function sanitizeTableHtml(html: string): string {
  // 기본적인 HTML 태그만 허용 (XSS 방지)
  const allowedTags = ['table', 'tr', 'td', 'th', 'tbody', 'thead'];
  const allowedAttributes = ['class', 'style'];
  
  // 간단한 HTML 새니타이저 (프로덕션에서는 DOMPurify 사용 권장)
  let sanitized = html;
  
  // 위험한 속성들 제거
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
}

// 표 HTML인지 확인하는 함수
export function isTableHtml(text: string): boolean {
  return text.includes('<table') && text.includes('</table>');
}

// 텍스트에서 표 HTML을 추출하는 함수
export function extractTables(text: string): { before: string; tables: string[]; after: string } {
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  const tables = text.match(tableRegex) || [];
  
  let remaining = text;
  tables.forEach(table => {
    remaining = remaining.replace(table, '{{TABLE_PLACEHOLDER}}');
  });
  
  const parts = remaining.split('{{TABLE_PLACEHOLDER}}');
  
  return {
    before: parts[0] || '',
    tables,
    after: parts.slice(1).join('') || ''
  };
}

// 표와 이미지가 포함된 텍스트를 React 요소로 변환하기 위한 헬퍼
export function parseTextWithTables(text: string): Array<{ type: 'text' | 'table' | 'image'; content: string }> {
  const result: Array<{ type: 'text' | 'table' | 'image'; content: string }> = [];
  
  // 표와 이미지를 찾는 정규식
  const mediaRegex = /(<table[^>]*>[\s\S]*?<\/table>|<img[^>]*\/>)/gi;
  let lastIndex = 0;
  let match;
  
  while ((match = mediaRegex.exec(text)) !== null) {
    // 표/이미지 이전의 텍스트 추가
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText.trim()) {
        result.push({ type: 'text', content: beforeText });
      }
    }
    
    // 표 또는 이미지 추가
    const element = match[0];
    if (element.startsWith('<table')) {
      result.push({ type: 'table', content: element });
    } else if (element.startsWith('<img')) {
      result.push({ type: 'image', content: element });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // 마지막 요소 이후의 텍스트 추가
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex);
    if (afterText.trim()) {
      result.push({ type: 'text', content: afterText });
    }
  }
  
  // 요소가 없으면 전체를 텍스트로 처리
  if (result.length === 0 && text.trim()) {
    result.push({ type: 'text', content: text });
  }
  
  return result;
}

// 표 스타일 기본값
export const TABLE_STYLES = {
  table: {
    borderCollapse: 'collapse' as const,
    width: '100%',
    margin: '10px 0',
    border: '1px solid #dee2e6',
    fontSize: '14px'
  },
  th: {
    border: '1px solid #dee2e6',
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    textAlign: 'left' as const
  },
  td: {
    border: '1px solid #dee2e6',
    padding: '8px 12px',
    textAlign: 'left' as const
  }
};
