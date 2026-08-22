import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Check, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { Note } from '../types/note';
import { useI18n } from '../hooks/useI18n';
import { playPop, playChime } from '../blog/utils/soundEffects';
import { triggerParticleBurst } from '../blog/utils/confetti';

export interface ClayBatchDeleteModalProps {
  isOpen: boolean;
  selectedNotes: Note[];
  onConfirm: (mode: 'soft' | 'permanent') => void;
  onClose: () => void;
}

export const ClayBatchDeleteModal: React.FC<ClayBatchDeleteModalProps> = ({
  isOpen,
  selectedNotes,
  onConfirm,
  onClose,
}) => {
  const { locale } = useI18n();
  const [deleteMode, setDeleteMode] = useState<'soft' | 'permanent'>('soft');

  if (!isOpen) return null;

  const count = selectedNotes.length;

  const handleExecute = (e: React.MouseEvent) => {
    playChime();
    triggerParticleBurst(e.clientX, e.clientY, 30);
    onConfirm(deleteMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/50 modal-backdrop-enter"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-[#fdfbf7] border-4 border-white shadow-2xl rounded-[36px] clay-card p-6 text-neutral-800 modal-card-enter flex flex-col max-h-[85vh]">
        {/* Top Rainbow Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-400 to-pink-500 rounded-t-[32px]" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 pt-1 border-b border-amber-900/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bubble text-lg font-bold text-neutral-900">
                {locale === 'zh' ? '👑 馆长批量删除管理' : 'Batch Delete Notes'}
              </h3>
              <p className="font-cute text-xs text-neutral-500">
                {locale === 'zh' 
                  ? `已选中 ${count} 篇灵感手账` 
                  : `${count} notes selected for batch deletion`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Notes Summary Box */}
        <div className="py-3 flex-1 overflow-y-auto no-scrollbar space-y-2 max-h-48 pr-1 my-2">
          {selectedNotes.map((n) => (
            <div 
              key={n.id}
              className="p-2.5 rounded-2xl bg-white border border-neutral-200/80 shadow-3xs flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <span className="font-bubble font-bold text-xs text-neutral-800 truncate block">
                  {n.excerpt || (locale === 'zh' ? '空白笔记' : 'Untitled Note')}
                </span>
                <span className="text-[10px] text-neutral-400 font-cute">
                  {n.author === 'admin' ? '👑 馆长手账' : '🌱 旅人手账'} • {n.wordCount || 0} 字
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold shrink-0 border border-rose-100">
                待处理
              </span>
            </div>
          ))}
        </div>

        {/* Delete Mode Option Selection */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2.5 shrink-0 my-2 text-xs font-cute">
          <label 
            onClick={() => setDeleteMode('soft')}
            className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
              deleteMode === 'soft'
                ? 'bg-white border-rose-300 shadow-xs ring-2 ring-rose-400/20'
                : 'bg-white/60 border-neutral-200 hover:bg-white'
            }`}
          >
            <input
              type="radio"
              name="batchDeleteMode"
              checked={deleteMode === 'soft'}
              onChange={() => setDeleteMode('soft')}
              className="mt-0.5 accent-rose-500"
            />
            <div>
              <div className="font-bubble font-bold text-neutral-900 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>{locale === 'zh' ? '移入废纸篓（软删除，推荐）' : 'Move to Trash (Soft Delete)'}</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {locale === 'zh' ? '卡片将从正常列表中移除，后续可在垃圾桶中恢复。' : 'Notes can be recovered later from trash.'}
              </p>
            </div>
          </label>

          <label 
            onClick={() => setDeleteMode('permanent')}
            className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
              deleteMode === 'permanent'
                ? 'bg-white border-rose-500 shadow-xs ring-2 ring-rose-500/20'
                : 'bg-white/60 border-neutral-200 hover:bg-white'
            }`}
          >
            <input
              type="radio"
              name="batchDeleteMode"
              checked={deleteMode === 'permanent'}
              onChange={() => setDeleteMode('permanent')}
              className="mt-0.5 accent-rose-600"
            />
            <div>
              <div className="font-bubble font-bold text-rose-700 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>{locale === 'zh' ? '彻底粉碎（永久物理清除）' : 'Permanently Destroy (Irreversible)'}</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {locale === 'zh' ? '直接从 IndexedDB 中永久抹除，不可撤销。' : 'Irreversibly delete records from storage.'}
              </p>
            </div>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-amber-900/10 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-700 font-bubble font-bold text-xs border border-neutral-200 shadow-xs cursor-pointer active:scale-95 transition"
          >
            {locale === 'zh' ? '取消' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleExecute}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bubble font-extrabold text-xs shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {locale === 'zh' 
                ? `确认批量删除 (${count} 篇)` 
                : `Delete ${count} notes`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
