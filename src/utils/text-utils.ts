/**
 * 사용자 이름을 안전하게 표시하기 위한 유틸리티 함수
 */
export function safeUserName(name: string | null | undefined, defaultName: string = '사용자'): string {
  if (!name) return defaultName;
  
  try {
    // 이미 정상적인 한글이면 그대로 반환
    if (/^[가-힣a-zA-Z0-9\s]+$/.test(name)) {
      return name;
    }
    
    // UTF-8 디코딩 시도
    try {
      // Base64로 인코딩된 경우 디코딩 시도
      const decoded = decodeURIComponent(name);
      if (decoded !== name && /^[가-힣a-zA-Z0-9\s]+$/.test(decoded)) {
        return decoded;
      }
    } catch {
      // 디코딩 실패 시 무시
    }
    
    // 특수 문자가 포함된 경우 기본 이름 반환
    return defaultName;
  } catch {
    return defaultName;
  }
}

/**
 * 텍스트가 깨져있는지 확인하는 함수
 */
export function isCorruptedText(text: string): boolean {
  if (!text) return false;
  
  // 일반적인 깨진 문자 패턴 검사
  const corruptedPatterns = [
    /ë°/, // 박 -> ë°
    /ì/, // 이, 아 등 -> ì
    /í/, // 한글 자음/모음 깨짐
    /[^\x00-\x7F가-힣a-zA-Z0-9\s]/g // ASCII가 아니면서 한글도 아닌 문자
  ];
  
  return corruptedPatterns.some(pattern => pattern.test(text));
}
