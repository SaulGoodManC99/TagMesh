import React, { useState, useEffect, useMemo } from 'react';
import { Note } from '../../types/note';
import { ClayNoteCard } from '../ClayNoteCard';

export interface BentoGridViewProps {
  notes: Note[];
  onNoteClick?: (note: Note) => void;
  onEdit?: (note: Note) => void;
  onTagClick: (tag: string) => void;
}

function getColumnCount(): number {
  if (typeof window === 'undefined') return 4;
  const w = window.innerWidth;
  if (w < 640) return 1;
  if (w < 1024) return 2;
  if (w < 1280) return 3;
  return 4;
}

/**
 * 🍱 真正多列分桶瀑布流 (True Column-Bucketing Masonry)
 * - 左右顺序：严格按从左到右依次分发至各列，少量卡片水平并排平铺
 * - 上下紧贴：各列独立垂直堆叠 (flex-col)，彻底消除因行最高卡片带来的垂直空白
 */
export const BentoGridView: React.FC<BentoGridViewProps> = ({
  notes,
  onNoteClick,
  onEdit,
  onTagClick,
}) => {
  const [columnsCount, setColumnsCount] = useState<number>(getColumnCount);

  useEffect(() => {
    const handleResize = () => {
      setColumnsCount(getColumnCount());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 将 notes 从左到右依次分桶到各列中
  const columns = useMemo(() => {
    const cols: { note: Note; originalIndex: number }[][] = Array.from(
      { length: columnsCount },
      () => []
    );

    notes.forEach((note, idx) => {
      cols[idx % columnsCount].push({ note, originalIndex: idx });
    });

    return cols;
  }, [notes, columnsCount]);

  if (notes.length === 0) return null;

  return (
    <div className="flex gap-5 sm:gap-6 w-full items-start animate-in fade-in duration-200">
      {columns.map((colItems, colIdx) => (
        <div 
          key={colIdx} 
          className="flex-1 flex flex-col gap-5 sm:gap-6 min-w-0"
        >
          {colItems.map(({ note, originalIndex }) => (
            <div key={note.id} className="w-full">
              <ClayNoteCard
                note={note}
                index={originalIndex}
                onClick={onNoteClick ? () => onNoteClick(note) : undefined}
                onEdit={onEdit}
                onTagClick={onTagClick}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

