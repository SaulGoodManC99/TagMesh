import React, { useState, useEffect, useMemo } from 'react';
import { Note } from '../../types/note';
import { ClayNoteCard } from '../ClayNoteCard';

export interface BentoGridViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onTagClick: (tag: string) => void;
}

/**
 * 🍱 最短列优先自适应横向瀑布流 (Balanced Pinterest-style Organic Masonry)
 * 1. 根据屏幕宽度与当前笔记总数动态计算列数 (1~5列)。
 * 2. 按卡片内容预估高度智能分配到当前最短列，自左向右横向均衡铺满。
 * 3. 当点击 TAG 筛选只有 1~3 篇笔记时，自动横向平铺撑满，绝不留白或死板堆叠在左侧！
 * 4. 每张卡片依然 100% 由自身字数与标签自由撑开高度，上下高低错落有机穿插。
 */
export const BentoGridView: React.FC<BentoGridViewProps> = ({
  notes,
  onNoteClick,
  onTagClick,
}) => {
  // Screen width responsive column count
  const [windowWidth, setWindowWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine target column capacity based on screen width
  const maxColumns = useMemo(() => {
    if (windowWidth < 640) return 1;
    if (windowWidth < 768) return 2;
    if (windowWidth < 1024) return 3;
    if (windowWidth < 1536) return 4;
    return 5;
  }, [windowWidth]);

  // Actual column count: if note count is fewer than maxColumns, adaptively shrink to notes.length so cards expand horizontally
  const numColumns = useMemo(() => {
    if (notes.length === 0) return 1;
    return Math.min(notes.length, maxColumns);
  }, [notes.length, maxColumns]);

  // Distribute notes to shortest column (greedy balance algorithm)
  const columns = useMemo(() => {
    const cols: Array<Array<{ note: Note; originalIndex: number }>> = Array.from(
      { length: numColumns },
      () => []
    );
    const colHeights: number[] = Array(numColumns).fill(0);

    notes.forEach((note, idx) => {
      // Estimate card height based on markdown length, tag count, and title
      const rawLen = (note.rawMarkdown || '').length;
      const tagCount = (note.tags || []).length;
      const titleLen = (note.excerpt || '').length;
      const estimatedHeight = 160 + Math.min(rawLen * 0.4, 200) + tagCount * 18 + (titleLen > 25 ? 30 : 0);

      // Find the column with minimum accumulated height
      let minColIdx = 0;
      for (let i = 1; i < numColumns; i++) {
        if (colHeights[i] < colHeights[minColIdx]) {
          minColIdx = i;
        }
      }

      cols[minColIdx].push({ note, originalIndex: idx });
      colHeights[minColIdx] += estimatedHeight;
    });

    return cols;
  }, [notes, numColumns]);

  if (notes.length === 0) return null;

  return (
    <div className="flex gap-5 sm:gap-6 w-full items-start justify-center animate-in fade-in duration-300">
      {columns.map((colNotes, colIdx) => (
        <div key={colIdx} className="flex-1 flex flex-col gap-5 sm:gap-6 min-w-0">
          {colNotes.map((item) => (
            <div key={item.note.id} className="w-full">
              <ClayNoteCard
                note={item.note}
                index={item.originalIndex}
                onClick={() => onNoteClick(item.note)}
                onTagClick={onTagClick}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
