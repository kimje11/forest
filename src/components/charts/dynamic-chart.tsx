"use client";

import dynamic from 'next/dynamic';
import { memo } from 'react';

// Chart.js를 동적으로 로드하는 컴포넌트들
const DynamicBar = dynamic(
  () => import('react-chartjs-2').then((mod) => ({ default: mod.Bar })),
  {
    loading: () => (
      <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-500">차트 로딩 중...</div>
      </div>
    ),
    ssr: false,
  }
);

const DynamicPie = dynamic(
  () => import('react-chartjs-2').then((mod) => ({ default: mod.Pie })),
  {
    loading: () => (
      <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-500">차트 로딩 중...</div>
      </div>
    ),
    ssr: false,
  }
);

const DynamicLine = dynamic(
  () => import('react-chartjs-2').then((mod) => ({ default: mod.Line })),
  {
    loading: () => (
      <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-500">차트 로딩 중...</div>
      </div>
    ),
    ssr: false,
  }
);

// Chart.js 설정을 동적으로 등록하는 hook
export const useChartRegistration = () => {
  const registerChartJS = async () => {
    const chartModule = await import('chart.js');
    const {
      Chart: ChartJS,
      CategoryScale,
      LinearScale,
      BarElement,
      LineElement,
      PointElement,
      ArcElement,
      Title,
      Tooltip,
      Legend,
    } = chartModule;
    
    ChartJS.register(
      CategoryScale,
      LinearScale,
      BarElement,
      LineElement,
      PointElement,
      ArcElement,
      Title,
      Tooltip,
      Legend
    );
  };

  return { registerChartJS };
};

// 메모이제이션된 차트 컴포넌트들
export const BarChart = memo(DynamicBar);
export const PieChart = memo(DynamicPie);
export const LineChart = memo(DynamicLine);

BarChart.displayName = 'BarChart';
PieChart.displayName = 'PieChart';
LineChart.displayName = 'LineChart';
