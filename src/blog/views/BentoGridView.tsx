import React from 'react';
import { Note } from '../../types/note';
import { ClayNoteCard } from '../ClayNoteCard';

export interface BentoGridViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onTagClick: (tag: string) => void;
}

/**
 * 🍱 自由韵律瀑布流 (Xiaohongshu & Pinterest Organic Masonry)
 * Instant Zero-Delay Rendering + Silky Smooth GPU Hover
 */
export const BentoGridView: React.FC<BentoGridViewProps> = ({
  notes,
  onNoteClick,
  onTagClick,
}) => {
  if (notes.length === 0) return null;

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 sm:gap-6 w-full animate-in fade-in duration-200">
      {notes.map((note, idx) => (
        <div 
          key={note.id} 
          className="break-inside-avoid inline-block mb-5 sm:mb-6 w-full"
        >
          <ClayNoteCard
            note={note}
            index={idx}
            onClick={() => onNoteClick(note)}
            onTagClick={onTagClick}
          />
        </div>
      ))}
    </div>
  );
};
