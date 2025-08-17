"use client";

import dynamic from 'next/dynamic';
import { memo } from 'react';

// MathEditor를 동적으로 로드
const DynamicMathEditor = dynamic(
  () => import('./math-editor').then((mod) => ({ default: mod.default })),
  {
    loading: () => (
      <div className="space-y-4">
        {/* 도구 모음 스켈레톤 */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-px bg-gray-300" />
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* 입력 영역 스켈레톤 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-64 bg-gray-100 rounded-md animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-64 bg-gray-50 rounded-md animate-pulse"></div>
          </div>
        </div>
        
        {/* 팔레트 스켈레톤 */}
        <div className="border rounded-lg p-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// 메모이제이션된 MathEditor
export const MathEditor = memo(DynamicMathEditor);

MathEditor.displayName = 'MathEditor';

export default MathEditor;
