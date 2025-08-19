"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, X } from "lucide-react";

interface FeatureNoteProps {
  title: string;
  description: string;
  details: string[];
  className?: string;
}

export default function FeatureNote({ title, description, details, className }: FeatureNoteProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      {/* 도움말 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
      >
        <HelpCircle className="h-4 w-4 mr-1" />
        기능 안내
      </Button>

      {/* 설명 모달 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription className="mt-1">{description}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {details.map((detail, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-full"
                >
                  확인했습니다
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
