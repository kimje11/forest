"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { clearAllAuthData, checkAuthStatus } from "@/lib/auth-utils";

// 간단한 User 타입 정의
interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshDemoUser: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const userRef = useRef<User | null>(null);

  // userRef를 항상 최신 상태로 유지
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 데모 사용자 정보를 새로고침하는 함수
  const refreshDemoUser = () => {
    console.log("Refreshing demo user...");
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
      try {
        const demoUserData = JSON.parse(demoUser);
        console.log("Refreshed demo user:", demoUserData);
        setUser(demoUserData as any);
        setLoading(false);
      } catch (e) {
        console.error("Error refreshing demo user:", e);
        localStorage.removeItem('demoUser');
        setUser(null);
        setLoading(false);
      }
    } else {
      console.log("No demo user to refresh");
      setUser(null);
      setLoading(false);
    }
  };

  // 사용자 상태를 체크하는 함수
  const checkUserStatus = async () => {
    console.log("Checking user status...");
    
    // 1. 데모 사용자 확인
    const demoUser = localStorage.getItem('demoUser');
    console.log("Demo user check:", demoUser ? "found" : "not found");
    
    if (demoUser) {
      try {
        const demoUserData = JSON.parse(demoUser);
        console.log("Setting demo user:", demoUserData.email);
        setUser(demoUserData as any);
        setLoading(false);
        return;
      } catch (e) {
        console.error("Error parsing demo user:", e);
        localStorage.removeItem('demoUser');
      }
    }
    
    // 2. Supabase 사용자 확인
    try {
      console.log("Checking Supabase user...");
      const supabase = createClient();
      
      // 안전한 세션 확인 (implicit flow 사용)
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Supabase session error:", sessionError);
          // AuthSessionMissingError는 정상적인 상황이므로 무시
          if (sessionError.name === 'AuthSessionMissingError') {
            console.log("No session found (normal for unauthenticated users)");
            setUser(null);
            setLoading(false);
            setIsInitialized(true);
            return;
          }
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
          return;
        }
        
        if (session?.user) {
          console.log("Supabase session found:", session.user.email);
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "사용자",
            role: session.user.user_metadata?.role || "STUDENT"
          };
          setUser(userData);
          setLoading(false);
          setIsInitialized(true);
          return;
        }
      } catch (sessionError) {
        console.error("Session check failed:", sessionError);
        // AuthSessionMissingError는 정상적인 상황이므로 무시
        if (sessionError instanceof Error && sessionError.name === 'AuthSessionMissingError') {
          console.log("No session found (normal for unauthenticated users)");
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
          return;
        }
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
        return;
      }
      
      // 세션이 없으면 로그아웃 상태로 설정
      console.log("No session found, setting user to null");
      setUser(null);
      setLoading(false);
      setIsInitialized(true);
      
    } catch (supabaseError) {
      console.error("Supabase connection error:", supabaseError);
      // Supabase 연결 실패 시에도 로딩 상태 해제
      setUser(null);
      setLoading(false);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    console.log("AuthProvider useEffect started");
    
    // 초기 사용자 상태 확인 (비동기)
    checkUserStatus();

    // 2초 후 안전장치 (더 빠른 응답)
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.warn("AuthProvider safety timeout - ensuring loading is false");
        setLoading(false);
        setIsInitialized(true);
      }
    }, 2000);

    // Supabase 인증 상태 변경 감지
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Supabase auth state changed:", event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "사용자",
            role: session.user.user_metadata?.role || "STUDENT"
          };
          setUser(userData);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // 토큰이 새로고침되었을 때도 사용자 상태 업데이트
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "사용자",
            role: session.user.user_metadata?.role || "STUDENT"
          };
          setUser(userData);
          setLoading(false);
        } else if (event === 'USER_UPDATED' && session?.user) {
          // 사용자 정보가 업데이트되었을 때
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "사용자",
            role: session.user.user_metadata?.role || "STUDENT"
          };
          setUser(userData);
          setLoading(false);
        }
      }
    );

    // 세션 복구 로직 제거 - 더 안전한 접근 방식 사용

    // 주기적으로 localStorage 확인 (데모 계정 로그인 후 변경사항 감지)
    const intervalId = setInterval(() => {
      const currentUser = userRef.current;
      const demoUser = localStorage.getItem('demoUser');
      
      // 현재 사용자 상태와 localStorage가 다르면 업데이트
      if (!currentUser && demoUser) {
        console.log("Detected new demo login, updating user state");
        refreshDemoUser();
      } else if (currentUser && !demoUser && currentUser.email?.includes('@demo.com')) {
        console.log("Detected demo logout, clearing user state");
        setUser(null);
      }
    }, 500); // 0.5초마다 확인

    // localStorage 변경 감지 (다른 탭에서 변경된 경우)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demoUser') {
        console.log("Demo user changed in another tab, refreshing...");
        refreshDemoUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      subscription?.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // 의존성 제거 - 한 번만 실행

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // 데모 계정 확인
      const demoUser = localStorage.getItem('demoUser');
      
      if (demoUser) {
        console.log('Logging out demo user...');
        // 데모 계정 로그아웃 - localStorage와 쿠키 정리
        localStorage.removeItem('demoUser');
        
        // 쿠키 삭제 (모든 브라우저에서 확실히 삭제되도록)
        const cookiesToDelete = [
          'demoUser',
          'sb-access-token',
          'sb-refresh-token',
          'supabase-auth-token'
        ];
        
        cookiesToDelete.forEach(cookieName => {
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0`;
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0; domain=${window.location.hostname}`;
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0; domain=.${window.location.hostname}`;
        });
        
        // 사용자 상태 즉시 초기화
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
        
        // 서버에 로그아웃 요청도 보내기
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          console.log('Server logout request failed, but local logout succeeded');
        }
        
        // 페이지 새로고침으로 모든 상태 초기화
        window.location.href = '/auth/login';
        return;
      }
      
      // Supabase 계정 로그아웃
      console.log('Logging out Supabase user...');
      try {
        const supabase = createClient();
        
        // 먼저 현재 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Found active session, signing out...');
        }
        
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Supabase signOut error:', error);
        } else {
          console.log('Supabase user signed out successfully');
        }
        
        // 강제로 모든 인증 데이터 정리
        clearAllAuthData();
        
      } catch (supabaseError) {
        console.error('Supabase signOut connection error:', supabaseError);
      }
      
      setUser(null);
      console.log('Sign out process completed');
      
    } catch (error) {
      console.error('Sign out error:', error);
      // 에러가 발생해도 로컬 상태 초기화
      localStorage.removeItem('demoUser');
      document.cookie = 'demoUser=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0';
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
}
