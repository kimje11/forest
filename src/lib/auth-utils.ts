/**
 * 모든 인증 관련 데이터를 완전히 정리하는 함수
 */
export const clearAllAuthData = () => {
  console.log('Clearing all auth data...');
  
  // localStorage 정리
  const keysToRemove = [
    'demoUser',
    'supabase.auth.token',
    'sb-auth-token',
    'supabase.auth.expires_at',
    'supabase.auth.refresh_token',
    'supabase.auth.access_token'
  ];
  
  // Supabase 관련 키들도 정리
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const projectRef = supabaseUrl.replace(/https?:\/\//, '').replace(/\.supabase\.co/, '');
    keysToRemove.push(`sb-${projectRef}-auth-token`);
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed localStorage key: ${key}`);
  });
  
  // sessionStorage 정리
  sessionStorage.clear();
  console.log('Cleared sessionStorage');
  
  // 모든 쿠키 정리
  document.cookie.split(";").forEach(function(c) { 
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    if (name) {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      console.log(`Removed cookie: ${name}`);
    }
  });
  
  console.log('All auth data cleared successfully');
};

/**
 * 현재 인증 상태를 확인하는 함수
 */
export const checkAuthStatus = () => {
  console.log('=== Auth Status Check ===');
  
  // localStorage 확인
  const demoUser = localStorage.getItem('demoUser');
  console.log('Demo user in localStorage:', demoUser ? 'exists' : 'not found');
  
  // Supabase 관련 키들 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const projectRef = supabaseUrl.replace(/https?:\/\//, '').replace(/\.supabase\.co/, '');
    const supabaseToken = localStorage.getItem(`sb-${projectRef}-auth-token`);
    console.log('Supabase token in localStorage:', supabaseToken ? 'exists' : 'not found');
  }
  
  // 쿠키 확인
  const cookies = document.cookie.split(';').map(c => c.trim());
  console.log('Cookies:', cookies);
  
  console.log('=== End Auth Status Check ===');
};
