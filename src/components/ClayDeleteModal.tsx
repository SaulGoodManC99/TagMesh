import React from 'react';
import { Trash2, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import { playPop, playChime } from '../blog/utils/soundEffects';
import { triggerParticleBurst } from '../blog/utils/confetti';
import { useI18n } from '../hooks/useI18n';

export interface ClayDeleteModalProps {
  isOpen: boolean;
  noteTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ClayDeleteModal: React.FC<ClayDeleteModalProps> = ({
  isOpen,
  noteTitle,
  onConfirm,
  onClose,
}) => {
  const { locale } = useI18n();

  if (!isOpen) return null;

  const handleConfirm = (e: React.MouseEvent) => {
    playPop(420);
    triggerParticleBurst(e.clientX, e.clientY, 25);
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    playPop(650);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/40 modal-backdrop-enter"
        onClick={handleCancel}
      />

      {/* 3D Clay Confirmation Card */}
      <div className="relative w-full max-w-md bg-[#fdfbf7] border-4 border-white shadow-2xl rounded-[36px] clay-card p-6 sm:p-8 overflow-hidden modal-card-enter text-neutral-800 flex flex-col items-center text-center select-none">
        {/* Top Warning Badge */}
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-md mb-4">
          <Trash2 className="w-8 h-8" />
        </div>

        {/* Modal Title */}
        <h3 className="font-bubble text-xl sm:text-2xl font-extrabold text-neutral-900 mb-2">
          {locale === 'zh' ? '确认移入废纸篓？' : 'Move to Trash?'}
        </h3>

        {/* Note Excerpt Preview */}
        <div className="w-full p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 mb-5 text-left">
          <span className="text-[11px] font-bubble font-bold text-amber-700 uppercase tracking-wider block mb-0.5">
            {locale === 'zh' ? '即将删除的笔记：' : 'Note to delete:'}
          </span>
          <p className="font-bubble font-bold text-sm text-neutral-800 truncate">
            {noteTitle || (locale === 'zh' ? '空白笔记' : 'Untitled Note')}
          </p>
        </div>

        <p className="text-xs sm:text-sm font-cute text-neutral-500 mb-6 leading-relaxed">
          {locale === 'zh' 
            ? '移入废纸篓后，该笔记将不再显示在正常列表中，可在需要时随时恢复。' 
            : 'This note will be moved to trash. You can restore it later if needed.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-700 font-bubble text-sm font-bold border border-neutral-200/80 shadow-3xs cursor-pointer transition active:scale-95"
          >
            {locale === 'zh' ? '取消' : 'Cancel'}
          </button>

          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bubble text-sm font-bold shadow-md hover:shadow-lg cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{locale === 'zh' ? '确认删除' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
