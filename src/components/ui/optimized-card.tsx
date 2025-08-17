import React, { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface OptimizedCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

// 메모이제이션된 카드 컴포넌트
export const OptimizedCard = memo(function OptimizedCard({
  title,
  description,
  children,
  className
}: OptimizedCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
});

OptimizedCard.displayName = 'OptimizedCard';
