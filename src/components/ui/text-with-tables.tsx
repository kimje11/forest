"use client";

import { parseTextWithTables, sanitizeTableHtml, TABLE_STYLES } from "@/utils/table-renderer";

interface TextWithTablesProps {
  children: string;
  className?: string;
}

export default function TextWithTables({ children, className = "" }: TextWithTablesProps) {
  if (!children) return null;
  
  const parsedContent = parseTextWithTables(children);
  
  if (parsedContent.length === 0) return null;
  
  return (
    <div className={className}>
      {parsedContent.map((item, index) => {
        if (item.type === 'text') {
          // 텍스트는 줄바꿈을 유지하면서 렌더링
          return (
            <div key={index} className="whitespace-pre-wrap">
              {item.content}
            </div>
          );
        } else if (item.type === 'table') {
          // 표는 HTML로 렌더링 (안전하게 처리)
          const sanitizedHtml = sanitizeTableHtml(item.content);
          return (
            <div key={index} className="my-4">
              <div
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                style={{
                  // 기본 표 스타일 적용
                  ...({
                    '& table': TABLE_STYLES.table,
                    '& th': TABLE_STYLES.th,
                    '& td': TABLE_STYLES.td
                  } as any)
                }}
                className="table-container"
              />
            </div>
          );
        } else if (item.type === 'image') {
          // 이미지는 안전하게 렌더링
          return (
            <div key={index} className="my-4">
              <div
                dangerouslySetInnerHTML={{ __html: item.content }}
                className="image-container"
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
