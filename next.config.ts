import type { NextConfig } from "next";

// 번들 분석기 설정
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // 패키지 import 최적화
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'chart.js',
      'react-chartjs-2',
      'katex',
      'react-katex',
      '@radix-ui/react-tabs',
      '@supabase/auth-ui-react',
      'react-dnd',
      'react-dnd-html5-backend'
    ],
  },
  
  // 프로덕션 빌드 최적화
  swcMinify: true,
  
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // webpack 최적화
  webpack: (config) => {
    // Tree shaking 개선
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };
    
    return config;
  },

  // 불필요한 polyfill 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default withBundleAnalyzer(nextConfig);
