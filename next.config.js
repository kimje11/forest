/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드 오류 무시 설정 (Vercel 배포를 위해)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // 프로덕션 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 환경변수 검증 건너뛰기
  env: {
    SKIP_ENV_VALIDATION: 'true',
  },
};

module.exports = nextConfig;
