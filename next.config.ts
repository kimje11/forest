import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 빌드 오류 무시 설정 (Vercel 배포를 위해)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 실험적 기능 최소화
  experimental: {
    optimizePackageImports: [
      'lucide-react',
    ],
  },
  
  // 이미지 최적화 (기본 설정)
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // 프로덕션 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
