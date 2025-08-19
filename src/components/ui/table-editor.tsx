"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Table } from "lucide-react";

interface TableEditorProps {
  onInsert: (tableHtml: string) => void;
  onClose: () => void;
}

interface TableCell {
  content: string;
}

interface TableData {
  rows: number;
  cols: number;
  cells: TableCell[][];
  hasHeader: boolean;
}

export default function TableEditor({ onInsert, onClose }: TableEditorProps) {
  const [tableData, setTableData] = useState<TableData>({
    rows: 3,
    cols: 3,
    cells: Array(3).fill(null).map(() => 
      Array(3).fill(null).map(() => ({ content: "" }))
    ),
    hasHeader: true
  });

  const updateTableSize = (rows: number, cols: number) => {
    const newCells = Array(rows).fill(null).map((_, rowIndex) =>
      Array(cols).fill(null).map((_, colIndex) => {
        // 기존 데이터가 있으면 유지, 없으면 빈 셀
        if (rowIndex < tableData.rows && colIndex < tableData.cols) {
          return tableData.cells[rowIndex][colIndex];
        }
        return { content: "" };
      })
    );

    setTableData({
      ...tableData,
      rows,
      cols,
      cells: newCells
    });
  };

  const updateCellContent = (rowIndex: number, colIndex: number, content: string) => {
    const newCells = [...tableData.cells];
    newCells[rowIndex][colIndex].content = content;
    setTableData({
      ...tableData,
      cells: newCells
    });
  };

  const addRow = () => {
    const newRow = Array(tableData.cols).fill(null).map(() => ({ content: "" }));
    setTableData({
      ...tableData,
      rows: tableData.rows + 1,
      cells: [...tableData.cells, newRow]
    });
  };

  const addColumn = () => {
    const newCells = tableData.cells.map(row => [...row, { content: "" }]);
    setTableData({
      ...tableData,
      cols: tableData.cols + 1,
      cells: newCells
    });
  };

  const removeRow = (rowIndex: number) => {
    if (tableData.rows <= 1) return;
    
    const newCells = tableData.cells.filter((_, index) => index !== rowIndex);
    setTableData({
      ...tableData,
      rows: tableData.rows - 1,
      cells: newCells
    });
  };

  const removeColumn = (colIndex: number) => {
    if (tableData.cols <= 1) return;
    
    const newCells = tableData.cells.map(row => 
      row.filter((_, index) => index !== colIndex)
    );
    setTableData({
      ...tableData,
      cols: tableData.cols - 1,
      cells: newCells
    });
  };

  const generateTableHtml = (): string => {
    const className = "table-editor-inserted";
    let html = `<table class="${className}" style="border-collapse: collapse; width: 100%; margin: 10px 0;">`;
    
    tableData.cells.forEach((row, rowIndex) => {
      const isHeader = tableData.hasHeader && rowIndex === 0;
      const tag = isHeader ? 'th' : 'td';
      const headerStyle = isHeader ? 'background-color: #f8f9fa; font-weight: bold;' : '';
      
      html += '<tr>';
      row.forEach(cell => {
        html += `<${tag} style="border: 1px solid #dee2e6; padding: 8px; ${headerStyle}">${cell.content || ''}</${tag}>`;
      });
      html += '</tr>';
    });
    
    html += '</table>';
    return html;
  };

  const generatePlainTextTable = (): string => {
    // 플레인 텍스트로도 표현할 수 있도록
    const maxWidths = Array(tableData.cols).fill(0);
    
    // 각 열의 최대 너비 계산
    tableData.cells.forEach(row => {
      row.forEach((cell, colIndex) => {
        maxWidths[colIndex] = Math.max(maxWidths[colIndex], cell.content.length);
      });
    });

    let result = '\n';
    tableData.cells.forEach((row, rowIndex) => {
      const cells = row.map((cell, colIndex) => 
        cell.content.padEnd(maxWidths[colIndex])
      );
      result += '| ' + cells.join(' | ') + ' |\n';
      
      if (tableData.hasHeader && rowIndex === 0) {
        result += '|' + maxWidths.map(width => '-'.repeat(width + 2)).join('|') + '|\n';
      }
    });
    result += '\n';
    
    return result;
  };

  const handleInsert = () => {
    const tableHtml = generateTableHtml();
    onInsert(tableHtml);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Table className="h-5 w-5 mr-2" />
            표 편집기
          </h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          {/* 표 설정 */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">행:</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={tableData.rows}
                onChange={(e) => updateTableSize(parseInt(e.target.value) || 1, tableData.cols)}
                className="w-16"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">열:</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={tableData.cols}
                onChange={(e) => updateTableSize(tableData.rows, parseInt(e.target.value) || 1)}
                className="w-16"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasHeader"
                checked={tableData.hasHeader}
                onChange={(e) => setTableData({ ...tableData, hasHeader: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="hasHeader" className="text-sm font-medium">첫 번째 행을 헤더로 사용</label>
            </div>
          </div>

          {/* 표 편집 영역 */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <table className="border-collapse border border-gray-300">
                  <tbody>
                    {tableData.cells.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td key={`${rowIndex}-${colIndex}`} className="border border-gray-300 p-0 relative">
                            <Input
                              value={cell.content}
                              onChange={(e) => updateCellContent(rowIndex, colIndex, e.target.value)}
                              placeholder={`${rowIndex + 1}-${colIndex + 1}`}
                              className="border-0 rounded-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                              style={{
                                backgroundColor: tableData.hasHeader && rowIndex === 0 ? '#f8f9fa' : 'white',
                                fontWeight: tableData.hasHeader && rowIndex === 0 ? 'bold' : 'normal'
                              }}
                            />
                            {/* 행/열 삭제 버튼 */}
                            {rowIndex === 0 && tableData.cols > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeColumn(colIndex)}
                                className="absolute -top-6 left-1/2 transform -translate-x-1/2 h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                title={`${colIndex + 1}번째 열 삭제`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                            {colIndex === 0 && tableData.rows > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeRow(rowIndex)}
                                className="absolute -left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                title={`${rowIndex + 1}번째 행 삭제`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                        ))}
                        {/* 열 추가 버튼 */}
                        {rowIndex === 0 && (
                          <td className="border-0 p-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addColumn}
                              className="h-8 w-8 p-0"
                              title="열 추가"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {/* 행 추가 버튼 */}
                    <tr>
                      <td colSpan={tableData.cols} className="border-0 p-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addRow}
                          className="h-8"
                          title="행 추가"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          행 추가
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 미리보기 */}
          <div>
            <label className="text-sm font-medium block mb-2">미리보기</label>
            <div 
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: generateTableHtml() }}
            />
          </div>

          {/* 플레인 텍스트 미리보기 */}
          <div>
            <label className="text-sm font-medium block mb-2">텍스트 형태 (참고용)</label>
            <pre className="text-xs bg-gray-100 p-2 rounded border overflow-x-auto">
              {generatePlainTextTable()}
            </pre>
          </div>

          {/* 저장/취소 버튼 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleInsert}>
              표 삽입
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
