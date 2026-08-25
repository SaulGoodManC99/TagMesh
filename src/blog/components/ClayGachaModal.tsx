import React, { useState } from 'react';
import { Sparkles, Dices, ArrowRight, X, RefreshCw, Star, Heart } from 'lucide-react';
import { Note } from '../../types/note';
import { useI18n } from '../../hooks/useI18n';
import { playPop, playChime, playSwoosh } from '../utils/soundEffects';
import { triggerParticleBurst, triggerConfettiShower } from '../utils/confetti';
import { renderCardMarkdownSnippet } from '../utils/markdownRenderer';

export interface ClayGachaModalProps {
  isOpen: boolean;
  notes: Note[];
  onClose: () => void;
  onReadNote: (note: Note) => void;
}

export const ClayGachaModal: React.FC<ClayGachaModalProps> = ({
  isOpen,
  notes,
  onClose,
  onReadNote,
}) => {
  const { locale } = useI18n();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Initialize or re-spin
  const spinGacha = () => {
    if (notes.length === 0) return;
    setIsSpinning(true);
    playSwoosh();

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * notes.length);
      setSelectedNote(notes[randomIdx]);
      playPop(400 + counter * 30);
      counter++;

      if (counter > 8) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * notes.length);
        const finalNote = notes[finalIdx];
        setSelectedNote(finalNote);
        setIsSpinning(false);
        playChime();
        triggerConfettiShower();
      }
    }, 100);
  };

  React.useEffect(() => {
    if (isOpen && notes.length > 0) {
      spinGacha();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/50 modal-backdrop-enter"
        onClick={onClose}
      />

      {/* 3D Gacha Capsule Card */}
      <div className="relative w-full max-w-lg bg-[#fdfbf7] border-4 border-white shadow-2xl rounded-[40px] clay-card p-6 sm:p-9 overflow-hidden modal-card-enter text-neutral-800 flex flex-col items-center select-none text-center">
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-200/80 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Golden Gacha Capsule Sphere */}
        <div className="relative mb-5">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-300 via-rose-400 to-pink-500 text-white flex items-center justify-center shadow-xl border-4 border-white clay-sheen transition-transform ${
            isSpinning ? 'animate-spin' : 'hover:scale-105'
          }`}>
            <span className="text-4xl">{isSpinning ? '🎰' : '🎁'}</span>
          </div>

          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-md animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Modal Header */}
        <h3 className="font-bubble text-xl sm:text-2xl font-extrabold text-neutral-900 mb-1">
          {locale === 'zh' ? '🎲 乐园灵感扭蛋机' : '🎲 Inspiration Lucky Dip'}
        </h3>
        <p className="text-xs font-cute text-neutral-400 mb-5">
          {locale === 'zh' ? '今日命中注定的灵感卡片' : 'Your serendipitous note of the day'}
        </p>

        {/* Result Note Card */}
        {selectedNote && (
          <div className={`w-full p-5 rounded-3xl bg-white border-2 border-pink-200/80 shadow-md mb-6 text-left transition-all ${
            isSpinning ? 'opacity-50 scale-98 blur-[1px]' : 'opacity-100 scale-100'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bubble text-[11px] font-bold">
                ✦ {locale === 'zh' ? '随机掉落' : 'Lucky Drop'}
              </span>
              <span className="text-[11px] font-cute text-neutral-400">
                {new Date(selectedNote.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>

            <h4 className="font-bubble text-base sm:text-lg font-bold text-neutral-900 mb-2 line-clamp-2 leading-snug">
              {selectedNote.excerpt || (locale === 'zh' ? '空白笔记' : 'Untitled')}
            </h4>

            {/* Note Snippet */}
            <div className="mb-3">
              {renderCardMarkdownSnippet(selectedNote.rawMarkdown || '')}
            </div>

            {/* Tags Mesh */}
            {(selectedNote.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-amber-900/5">
                {(selectedNote.tags || []).slice(0, 3).map((tg) => (
                  <span key={tg} className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 font-mono text-[10px] font-bold border border-pink-200">
                    {tg}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            disabled={isSpinning}
            onClick={spinGacha}
            className="flex-1 py-3 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-700 font-bubble text-xs sm:text-sm font-bold border border-neutral-200/80 shadow-3xs cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-500 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{locale === 'zh' ? '再抽一个' : 'Spin Again'}</span>
          </button>

          <button
            disabled={isSpinning || !selectedNote}
            onClick={() => {
              if (selectedNote) {
                playPop();
                onReadNote(selectedNote);
                onClose();
              }
            }}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-bubble text-xs sm:text-sm font-bold shadow-md hover:shadow-lg cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{locale === 'zh' ? '阅读完整笔记' : 'Read Note'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
