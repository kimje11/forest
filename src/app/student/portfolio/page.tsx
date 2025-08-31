"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TextWithTables from "@/components/ui/text-with-tables";
import { parseTextWithTables, sanitizeTableHtml } from "@/utils/table-renderer";
import { safeUserName } from "@/utils/text-utils";
import { 
  Trophy, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  Download,
  Eye,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Clock,
  CheckCircle,
  Send
} from "lucide-react";
import { BarChart, PieChart, useChartRegistration } from "@/components/charts/dynamic-chart";

interface Project {
  id: string;
  title?: string;
  status: string;
  grade?: string;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    title: string;
    description?: string;
    steps?: any[];
  };
  class?: {
    name: string;
    teacher: {
      name: string;
    };
  };
  feedbacks: any[];
  inputs?: any[];
}

export default function PortfolioPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const { registerChartJS } = useChartRegistration();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include"
      });
      if (!response.ok) {
        router.push("/auth/login");
        return;
      }
      
      const data = await response.json();
      if (data.user.role !== "STUDENT") {
        router.push("/auth/login");
        return;
      }
      
      setUser(data.user);
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/auth/login");
    }
  }, [router]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchProjects();
    registerChartJS(); // Chart.js 동적 등록
  }, [checkAuth, fetchProjects, registerChartJS]);

  // 텍스트를 HTML로 변환하는 헬퍼 함수 (표 지원)
  const convertTextToHtml = useCallback((text: string, isLongText: boolean = false): string => {
    if (!text) return '';
    
    const parsedContent = parseTextWithTables(text);
    let html = '';
    
    parsedContent.forEach(item => {
      if (item.type === 'text') {
        // 텍스트는 줄바꿈을 <br>로 변환
        html += item.content.replace(/\n/g, '<br>');
      } else if (item.type === 'table') {
        // 표는 안전하게 처리하여 삽입
        html += sanitizeTableHtml(item.content);
      }
    });
    
    return isLongText ? 
      `<div class="long-text-content">${html}</div>` : 
      `<div class="short-text-content">${html}</div>`;
  }, []);

  // 상태별 프로젝트 분류
  const projectStats = useMemo(() => {
    const stats = {
      inProgress: projects.filter(p => p.status === "DRAFT" || p.status === "IN_PROGRESS"),
      completed: projects.filter(p => p.status === "COMPLETED"),
      submitted: projects.filter(p => p.status === "SUBMITTED"),
      all: projects
    };
    return stats;
  }, [projects]);

  // 상태별 텍스트 및 색상
  const getStatusInfo = useCallback((status: string) => {
    switch (status) {
      case "DRAFT":
        return { text: "초안", color: "bg-gray-100 text-gray-800", icon: Clock };
      case "IN_PROGRESS":
        return { text: "진행중", color: "bg-blue-100 text-blue-800", icon: Target };
      case "COMPLETED":
        return { text: "완료", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "SUBMITTED":
        return { text: "제출됨", color: "bg-purple-100 text-purple-800", icon: Send };
      default:
        return { text: "알 수 없음", color: "bg-gray-100 text-gray-800", icon: Clock };
    }
  }, []);

  // 기존 함수들 (호환성을 위해 유지)
  const getStatusText = useCallback((status: string) => {
    return getStatusInfo(status).text;
  }, [getStatusInfo]);

  const getStatusColor = useCallback((status: string) => {
    return getStatusInfo(status).color;
  }, [getStatusInfo]);

  // 개별 프로젝트 출력
  const exportSingleProject = useCallback(async (project: Project) => {
    try {
      const projectData = {
        student: {
          name: user?.name || "학생",
          email: user?.email || "",
          exportDate: new Date().toLocaleDateString('ko-KR')
        },
        project: {
          ...project,
          status: getStatusText(project.status),
          title: project.title || project.template.title,
          templateTitle: project.template.title,
          description: project.template.description || "",
          grade: project.grade || "미평가",
          createdAt: new Date(project.createdAt).toLocaleDateString('ko-KR'),
          updatedAt: new Date(project.updatedAt).toLocaleDateString('ko-KR'),
          inputs: project.inputs || [],
          feedbacks: project.feedbacks || []
        }
      };

      // HTML 보고서 생성
      const htmlContent = generateSingleProjectHTML(projectData);
      
      // 새 창에서 PDF 인쇄 대화상자 열기
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // 인쇄 대화상자 열기
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error("프로젝트 출력 오류:", error);
      alert("프로젝트 출력 중 오류가 발생했습니다.");
    }
  }, [user, getStatusText]);

  // 월별 데이터 생성
  const monthlyData = useCallback(() => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const data = new Array(12).fill(0);
    
    projectStats.completed.forEach(project => {
      const month = new Date(project.updatedAt).getMonth();
      data[month]++;
    });
    
    return {
      labels: months,
      datasets: [{
        label: '완료된 탐구',
        data: data,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  }, [projectStats.completed]);

  // 분야별 데이터 생성
  const subjectData = useCallback(() => {
    const subjectCount: Record<string, number> = {};
    
    projectStats.completed.forEach(project => {
      const subject = project.template.title.split(" ")[0] || "기타";
      subjectCount[subject] = (subjectCount[subject] || 0) + 1;
    });
    
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(16, 185, 129, 0.8)',   // green
      'rgba(245, 158, 11, 0.8)',   // yellow
      'rgba(239, 68, 68, 0.8)',    // red
      'rgba(139, 92, 246, 0.8)',   // purple
      'rgba(236, 72, 153, 0.8)',   // pink
    ];
    
    return {
      labels: Object.keys(subjectCount),
      datasets: [{
        data: Object.values(subjectCount),
        backgroundColor: colors.slice(0, Object.keys(subjectCount).length),
        borderWidth: 1
      }]
    };
  }, [projectStats.completed]);

  // 템플릿별 그룹화
  const projectsByTemplate = useMemo(() => {
    const grouped = {
      inProgress: {} as Record<string, Project[]>,
      completed: {} as Record<string, Project[]>,
      submitted: {} as Record<string, Project[]>
    };

    projectStats.inProgress.forEach(project => {
      const templateId = project.template.id;
      if (!grouped.inProgress[templateId]) {
        grouped.inProgress[templateId] = [];
      }
      grouped.inProgress[templateId].push(project);
    });

    projectStats.completed.forEach(project => {
      const templateId = project.template.id;
      if (!grouped.completed[templateId]) {
        grouped.completed[templateId] = [];
      }
      grouped.completed[templateId].push(project);
    });

    projectStats.submitted.forEach(project => {
      const templateId = project.template.id;
      if (!grouped.submitted[templateId]) {
        grouped.submitted[templateId] = [];
      }
      grouped.submitted[templateId].push(project);
    });

    return grouped;
  }, [projectStats]);

  const exportPortfolio = useCallback(async () => {
    try {
      // 포트폴리오 데이터 준비
      const portfolioData = {
        student: {
          name: user?.name || "학생",
          email: user?.email || "",
          exportDate: new Date().toLocaleDateString('ko-KR')
        },
        summary: {
          totalProjects: projects.length,
          completedProjects: projectStats.completed.length,
          submittedProjects: projectStats.submitted.length,
          inProgressProjects: projectStats.inProgress.length,
        },
        projects: projects.map(project => ({
          title: project.title || project.template.title,
          status: getStatusInfo(project.status).text,
          templateTitle: project.template.title,
          description: project.template.description || "",
          grade: project.grade || "미평가",
          createdAt: new Date(project.createdAt).toLocaleDateString('ko-KR'),
          updatedAt: new Date(project.updatedAt).toLocaleDateString('ko-KR'),
          template: project.template,
          inputs: project.inputs || []
        }))
      };

      // HTML 보고서 생성
      const htmlContent = generatePortfolioHTML(portfolioData);
      
      // 새 창에서 PDF 인쇄 대화상자 열기
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // 인쇄 대화상자 열기
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error("포트폴리오 내보내기 오류:", error);
      alert("포트폴리오 내보내기 중 오류가 발생했습니다.");
    }
  }, [user, projects, projectStats, getStatusInfo]);

  const generateSingleProjectHTML = (data: any) => {
    const { student, project } = data;
    
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title} - 탐구 보고서</title>
    <style>
        body {
            font-family: 'Malgun Gothic', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 2.2em;
        }
        .header p {
            margin: 8px 0;
            color: #666;
        }
        .project-info {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .info-item {
            padding: 10px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
        }
        .info-label {
            font-weight: bold;
            color: #374151;
            font-size: 0.9em;
        }
        .info-value {
            color: #666;
            margin-top: 2px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-submitted { background: #e0e7ff; color: #3730a3; }
        .status-progress { background: #dbeafe; color: #1e40af; }
        .content-section {
            margin-bottom: 30px;
        }
        .content-section h2 {
            color: #1e40af;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .step-section {
            margin-bottom: 25px;
            padding: 20px;
            background: #fafafa;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .step-title {
            color: #374151;
            font-size: 1.1em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .step-description {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 15px;
            font-style: italic;
        }
        .component-section {
            margin-bottom: 15px;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .component-label {
            font-weight: bold;
            color: #374151;
            margin-bottom: 8px;
            font-size: 0.95em;
        }
        .component-content {
            color: #374151;
            line-height: 1.6;
        }
        .long-text-content {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            white-space: pre-wrap;
            word-wrap: break-word;
            min-height: 60px;
        }
        .short-text-content {
            background: #f9fafb;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        .feedback-section {
            margin-bottom: 30px;
        }
        .feedback-item {
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .feedback-content {
            color: #7c2d12;
            line-height: 1.5;
        }
        .feedback-date {
            color: #9a3412;
            font-size: 0.8em;
            margin-top: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #666;
            font-size: 0.9em;
        }
        @media print {
            body { margin: 0; padding: 15px; font-size: 12px; }
            .step-section { break-inside: avoid; page-break-inside: avoid; }
            .component-section { break-inside: avoid; }
            .feedback-item { break-inside: avoid; }
            .header { page-break-after: avoid; }
            .project-info { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 ${project.title}</h1>
        <p><strong>${student.name}</strong>님의 탐구 보고서</p>
        <p>출력일: ${student.exportDate}</p>
    </div>

    <div class="project-info">
        <h2 style="margin-top: 0; color: #1e40af;">📊 프로젝트 정보</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">상태</div>
                <div class="info-value">
                    <span class="status-badge status-${project.status === '완료' ? 'completed' : project.status === '제출됨' ? 'submitted' : 'progress'}">${project.status}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">템플릿</div>
                <div class="info-value">${project.templateTitle}</div>
            </div>
            <div class="info-item">
                <div class="info-label">평가</div>
                <div class="info-value">${project.grade}</div>
            </div>
            <div class="info-item">
                <div class="info-label">생성일</div>
                <div class="info-value">${project.createdAt}</div>
            </div>
        </div>
        ${project.description ? `<p style="margin: 15px 0 0 0; color: #666; font-style: italic;">${project.description}</p>` : ''}
    </div>

    ${project.template && project.template.steps ? `
        <div class="content-section">
            <h2>📝 탐구 내용</h2>
            ${project.template.steps.map((step: any, stepIndex: number) => {
                const stepInputs = project.inputs ? project.inputs.filter((input: any) => input.stepId === step.id) : [];
                return `
                    <div class="step-section">
                        <div class="step-title">
                            ${stepIndex + 1}단계: ${step.title || '제목 없음'}
                        </div>
                        ${step.description ? `<div class="step-description">${step.description}</div>` : ''}
                        
                        ${step.components && step.components.length > 0 ? step.components.map((component: any, compIndex: number) => {
                            const componentInput = stepInputs.find((input: any) => input.componentId === component.id);
                            const inputValue = componentInput?.value || '작성되지 않음';
                            
                            return `
                                <div class="component-section">
                                    <div class="component-label">${compIndex + 1}. ${component.label || component.type}</div>
                                    <div class="component-content">
                                        ${convertTextToHtml(inputValue, component.type === 'LONG_TEXT')}
                                    </div>
                                </div>
                            `;
                        }).join('') : '<p style="color: #999; font-style: italic;">입력 항목이 없습니다.</p>'}
                    </div>
                `;
            }).join('')}
        </div>
    ` : '<p style="color: #999; font-style: italic;">탐구 내용이 없습니다.</p>'}

    ${project.feedbacks && project.feedbacks.length > 0 ? `
        <div class="feedback-section">
            <h2>💬 받은 피드백</h2>
            ${project.feedbacks.map((feedback: any) => `
                <div class="feedback-item">
                    <div class="feedback-content">${feedback.content}</div>
                    <div class="feedback-date">
                        ${feedback.step ? `${feedback.step.title} 단계 · ` : ''}
                        ${new Date(feedback.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                </div>
            `).join('')}
        </div>
    ` : ''}

    <div class="footer">
        <p>🌲 Exploration Forest - 탐구의 숲에서 자라나는 지식의 나무</p>
        <p>본 보고서는 ${student.exportDate}에 생성되었습니다.</p>
    </div>
</body>
</html>
    `;
  };

  const generatePortfolioHTML = (data: any) => {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.student.name}님의 탐구 포트폴리오</title>
    <style>
        body {
            font-family: 'Malgun Gothic', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0;
            color: #666;
        }
        .summary {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }
        .summary h2 {
            color: #1e40af;
            margin-top: 0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .stat-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #3b82f6;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        .projects {
            margin-bottom: 30px;
        }
        .projects h2 {
            color: #1e40af;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        .project-item {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            background: white;
        }
        .project-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
        }
        .project-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 10px;
            font-size: 0.9em;
        }
        .meta-item {
            color: #666;
        }
        .meta-label {
            font-weight: bold;
            color: #374151;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-submitted { background: #e0e7ff; color: #3730a3; }
        .status-progress { background: #dbeafe; color: #1e40af; }
        .project-content {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
        }
        .step-section {
            margin-bottom: 20px;
            padding: 15px;
            background: #fafafa;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .component-section {
            margin-bottom: 15px;
            padding: 12px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        .component-label {
            font-weight: bold;
            color: #374151;
            margin-bottom: 8px;
            font-size: 0.9em;
        }
        .component-content {
            color: #374151;
            line-height: 1.5;
        }
        .long-text-content {
            background: #f9fafb;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .short-text-content {
            background: #f9fafb;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #666;
            font-size: 0.9em;
        }
        @media print {
            body { margin: 0; padding: 15px; font-size: 12px; }
            .project-item { break-inside: avoid; page-break-inside: avoid; }
            .step-section { break-inside: avoid; page-break-inside: avoid; }
            .component-section { break-inside: avoid; }
            .header { page-break-after: avoid; }
            .summary { page-break-after: avoid; }
            .project-title { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌲 탐구 포트폴리오</h1>
        <p><strong>${data.student.name}</strong>님의 학습 여정</p>
        <p>생성일: ${data.student.exportDate}</p>
    </div>

    <div class="summary">
        <h2>📊 학습 현황 요약</h2>
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">${data.summary.totalProjects}</div>
                <div class="stat-label">총 프로젝트</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.summary.submittedProjects}</div>
                <div class="stat-label">제출 완료</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.summary.completedProjects}</div>
                <div class="stat-label">완료</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.summary.inProgressProjects}</div>
                <div class="stat-label">진행 중</div>
            </div>
        </div>
    </div>

    <div class="projects">
        <h2>📚 프로젝트 상세 내용</h2>
        ${data.projects.map((project: any, index: number) => `
            <div class="project-item">
                <div class="project-title">${index + 1}. ${project.title}</div>
                <div class="project-meta">
                    <div class="meta-item">
                        <span class="meta-label">상태:</span> 
                        <span class="status-badge status-${project.status === '완료' ? 'completed' : project.status === '제출됨' ? 'submitted' : 'progress'}">${project.status}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">템플릿:</span> ${project.templateTitle}
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">평가:</span> ${project.grade}
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">생성일:</span> ${project.createdAt}
                    </div>
                </div>
                ${project.description ? `<p style="margin: 10px 0 0 0; color: #666; font-size: 0.9em;">${project.description}</p>` : ''}
                
                ${project.template && project.template.steps ? `
                    <div class="project-content">
                        <h4 style="color: #1e40af; margin: 20px 0 10px 0; font-size: 1.1em;">📝 탐구 내용</h4>
                        ${project.template.steps.map((step: any, stepIndex: number) => {
                            const stepInputs = project.inputs ? project.inputs.filter((input: any) => input.stepId === step.id) : [];
                            return `
                                <div class="step-section">
                                    <h5 style="color: #374151; margin: 15px 0 8px 0; font-size: 1em; font-weight: bold;">
                                        ${stepIndex + 1}단계: ${step.title || '제목 없음'}
                                    </h5>
                                    ${step.description ? `<p style="color: #666; font-size: 0.9em; margin: 5px 0 10px 0;">${step.description}</p>` : ''}
                                    
                                    ${step.components && step.components.length > 0 ? step.components.map((component: any, compIndex: number) => {
                                        const componentInput = stepInputs.find((input: any) => input.componentId === component.id);
                                        const inputValue = componentInput?.value || '작성되지 않음';
                                        
                                        return `
                                            <div class="component-section">
                                                <div class="component-label">${compIndex + 1}. ${component.label || component.type}</div>
                                                <div class="component-content">
                                                    ${convertTextToHtml(inputValue, component.type === 'LONG_TEXT')}
                                                </div>
                                            </div>
                                        `;
                                    }).join('') : '<p style="color: #999; font-style: italic;">입력 항목이 없습니다.</p>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : '<p style="color: #999; font-style: italic;">템플릿 정보가 없습니다.</p>'}
            </div>
        `).join('')}
    </div>

    <div class="footer">
        <p>🌲 Exploration Forest - 탐구의 숲에서 자라나는 지식의 나무</p>
        <p>본 포트폴리오는 ${data.student.exportDate}에 생성되었습니다.</p>
    </div>
</body>
</html>
    `;
  };

  const inProgressProjects = useMemo(() => 
    projects.filter(p => p.status === "IN_PROGRESS" || p.status === "DRAFT"), 
    [projects]
  );

  const filteredProjects = useMemo(() => 
    selectedFilter === "all" 
      ? projects 
      : projects.filter(p => p.status === selectedFilter),
    [projects, selectedFilter]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">포트폴리오를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">내 탐구 포트폴리오</h1>
              <p className="text-gray-600">지금까지의 탐구 여정을 확인해보세요, {safeUserName(user?.name)}님!</p>
            </div>
            <div className="flex gap-4">
              <Link href="/student/dashboard" prefetch={true}>
                <Button variant="outline">
                  대시보드로
                </Button>
              </Link>
              <Button onClick={exportPortfolio}>
                <Download className="h-4 w-4 mr-2" />
                포트폴리오 내보내기
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 개요 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 탐구 수</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행 중인 탐구</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{projectStats.inProgress.length}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료된 탐구</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{projectStats.completed.length}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">제출된 탐구</CardTitle>
              <Send className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{projectStats.submitted.length}</div>
              <p className="text-xs text-muted-foreground">개</p>
            </CardContent>
          </Card>
        </div>

        {/* 성장 시각화 */}
        {projectStats.completed.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  월별 탐구 완료 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart 
                  data={monthlyData()} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  분야별 탐구 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart 
                  data={subjectData()} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* 진행 중인 탐구 */}
        {projectStats.inProgress.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Target className="h-5 w-5" />
                진행 중인 탐구 ({projectStats.inProgress.length}개)
              </CardTitle>
              <CardDescription>
                현재 진행하고 있는 탐구 활동들을 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(projectsByTemplate.inProgress).map(([templateId, templateProjects]) => {
                  const template = templateProjects[0].template;
                  return (
                    <div key={templateId} className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-blue-900">{template.title}</h3>
                        <Badge className="bg-blue-100 text-blue-800">
                          {templateProjects.length}개 프로젝트
                        </Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-blue-700 mb-3">{template.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {templateProjects.map((project) => {
                          const statusInfo = getStatusInfo(project.status);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <div key={project.id} className="bg-white rounded-lg p-3 border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{project.title || template.title}</h4>
                                <Badge className={`${statusInfo.color} text-xs`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.text}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mb-2">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(project.updatedAt).toLocaleDateString()}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/student/projects/${project.id}`)}
                                  className="text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  계속하기
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 완료된 탐구 */}
        {projectStats.completed.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                완료된 탐구 ({projectStats.completed.length}개)
              </CardTitle>
              <CardDescription>
                성공적으로 완료한 탐구 활동들을 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(projectsByTemplate.completed).map(([templateId, templateProjects]) => {
                  const template = templateProjects[0].template;
                  return (
                    <div key={templateId} className="border rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-green-900">{template.title}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          {templateProjects.length}개 프로젝트
                        </Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-green-700 mb-3">{template.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {templateProjects.map((project) => {
                          const statusInfo = getStatusInfo(project.status);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <div key={project.id} className="bg-white rounded-lg p-3 border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{project.title || template.title}</h4>
                                <Badge className={`${statusInfo.color} text-xs`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.text}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mb-2">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(project.updatedAt).toLocaleDateString()}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    console.log("완료된 탐구 보기 버튼 클릭:", project.id, project.title);
                                    router.push(`/student/projects/${project.id}`);
                                  }}
                                  className="text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  보기
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => exportSingleProject(project)}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  출력
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 제출된 탐구 */}
        {projectStats.submitted.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Send className="h-5 w-5" />
                제출된 탐구 ({projectStats.submitted.length}개)
              </CardTitle>
              <CardDescription>
                교사에게 제출한 탐구 활동들을 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(projectsByTemplate.submitted).map(([templateId, templateProjects]) => {
                  const template = templateProjects[0].template;
                  return (
                    <div key={templateId} className="border rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-purple-900">{template.title}</h3>
                        <Badge className="bg-purple-100 text-purple-800">
                          {templateProjects.length}개 프로젝트
                        </Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-purple-700 mb-3">{template.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {templateProjects.map((project) => {
                          const statusInfo = getStatusInfo(project.status);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <div key={project.id} className="bg-white rounded-lg p-3 border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{project.title || template.title}</h4>
                                <Badge className={`${statusInfo.color} text-xs`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.text}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mb-2">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(project.updatedAt).toLocaleDateString()}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/student/projects/${project.id}`)}
                                  className="text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  보기
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => exportSingleProject(project)}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  출력
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 빈 상태 */}
        {projects.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                아직 탐구 프로젝트가 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                새로운 탐구 활동을 시작해보세요!
              </p>
              <Button onClick={() => router.push("/student/explore")}>
                탐구 시작하기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 성장 인사이트 */}
        {projectStats.completed.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">성장 인사이트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {Math.round((projectStats.completed.length / projects.length) * 100)}%
                  </div>
                  <p className="text-blue-700">완료율</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {projectStats.completed.length > 0 ? Math.round(
                      projectStats.completed.reduce((total, project) => total + project.feedbacks.length, 0) / projectStats.completed.length
                    ) : 0}
                  </div>
                  <p className="text-blue-700">평균 피드백 수</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {new Set(projectStats.completed.map(p => p.template.title.split(" ")[0])).size}
                  </div>
                  <p className="text-blue-700">탐구 분야 수</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
