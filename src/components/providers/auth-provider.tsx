"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
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
  const supabase = createClient();

  useEffect(() => {
    // 초기 사용자 상태 확인
    const getUser = async () => {
      // 먼저 데모 계정 확인
      const demoUser = localStorage.getItem('demoUser');
      if (demoUser) {
        try {
          const demoUserData = JSON.parse(demoUser);
          setUser(demoUserData as any);
          setLoading(false);
          return;
        } catch (e) {
          // 데모 유저 파싱 실패 시 localStorage 정리
          localStorage.removeItem('demoUser');
        }
      }
      
      // 일반 Supabase 계정 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    // 데모 계정 확인
    const demoUser = localStorage.getItem('demoUser');
    
    if (demoUser) {
      // 데모 계정 로그아웃 - localStorage와 쿠키 정리
      localStorage.removeItem('demoUser');
      document.cookie = 'demoUser=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      setUser(null);
      return;
    }
    
    // 일반 Supabase 계정 로그아웃
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
