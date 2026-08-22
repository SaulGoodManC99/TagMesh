import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Search, RefreshCw, X, Check, AlertTriangle, ShieldCheck, Heart, RotateCcw } from 'lucide-react';
import { DanmakuItem, getStoredDanmakus, deleteStoredDanmaku, resetDanmakusToDefault, clearAllDanmakus } from '../data/danmakuData';
import { renderInlineContent } from '../utils/markdownRenderer';
import { useI18n } from '../../hooks/useI18n';
import { playPop, playChime } from '../utils/soundEffects';

export interface ClayDanmakuAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDanmakuDeleted?: (deletedId: string) => void;
  onDanmakusCleared?: () => void;
  onDanmakusReset?: () => void;
}

export const ClayDanmakuAdminModal: React.FC<ClayDanmakuAdminModalProps> = ({
  isOpen,
  onClose,
  onDanmakuDeleted,
  onDanmakusCleared,
  onDanmakusReset,
}) => {
  const { locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isResettingDefault, setIsResettingDefault] = useState(false);

  const loadData = () => {
    setDanmakus(getStoredDanmakus());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = danmakus.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return item.content.toLowerCase().includes(q) || item.sender.toLowerCase().includes(q);
  });

  const handleDeleteItem = (id: string) => {
    playPop();
    const updated = deleteStoredDanmaku(id);
    setDanmakus(updated);
    setDeleteConfirmId(null);
    if (onDanmakuDeleted) onDanmakuDeleted(id);
  };

  const handleClearAll = () => {
    playPop();
    const empty = clearAllDanmakus();
    setDanmakus(empty);
    setIsClearingAll(false);
    if (onDanmakusCleared) onDanmakusCleared();
  };

  const handleResetToDefault = () => {
    playChime();
    const presets = resetDanmakusToDefault();
    setDanmakus(presets);
    setIsResettingDefault(false);
    if (onDanmakusReset) onDanmakusReset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/50 modal-backdrop-enter" 
        onClick={onClose} 
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#fdfbf7] border-4 border-white shadow-2xl rounded-[32px] clay-card p-6 text-neutral-800 modal-card-enter select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bubble text-lg font-bold text-neutral-900">
                {locale === 'zh' ? '💬 弹幕总控管理台' : '💬 Danmaku Moderation Center'}
              </h3>
              <p className="font-cute text-xs text-neutral-500">
                {locale === 'zh' 
                  ? `共管理 ${danmakus.length} 条弹幕 • 自动脏话拦截已激活` 
                  : `Managing ${danmakus.length} thoughts • Bad words filter active`}
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

        {/* Toolbar & Search */}
        <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="w-full sm:w-64 flex items-center gap-2 px-3 h-10 rounded-2xl bg-white border border-neutral-200/80 shadow-inner">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'zh' ? '搜索弹幕内容或发射者...' : 'Search danmaku...'}
              className="w-full bg-transparent text-xs font-cute text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="text-xs text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Reset to Factory Defaults */}
            {isResettingDefault ? (
              <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-2xl border border-amber-300">
                <span className="text-[11px] font-bold text-amber-900 px-2">
                  {locale === 'zh' ? '恢复9条预设?' : 'Reset presets?'}
                </span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {locale === 'zh' ? '是' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsResettingDefault(false)}
                  className="px-2.5 py-1 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-xs cursor-pointer"
                >
                  {locale === 'zh' ? '否' : 'No'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsResettingDefault(true)}
                className="px-3 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bubble text-xs font-bold border border-amber-200 shadow-3xs flex items-center gap-1 cursor-pointer"
                title={locale === 'zh' ? '恢复出厂9条示例弹幕与初始人数' : 'Reset to default 9 presets'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '恢复出厂预设' : 'Reset Defaults'}</span>
              </button>
            )}

            {/* Clear All */}
            {isClearingAll ? (
              <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-2xl border border-rose-200">
                <span className="text-[11px] font-bold text-rose-700 px-2">
                  {locale === 'zh' ? '确定清空?' : 'Confirm?'}
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {locale === 'zh' ? '是' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsClearingAll(false)}
                  className="px-2.5 py-1 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-xs cursor-pointer"
                >
                  {locale === 'zh' ? '否' : 'No'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsClearingAll(true)}
                className="px-3 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bubble text-xs font-bold border border-rose-200/80 shadow-3xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{locale === 'zh' ? '清空全部' : 'Clear All'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Danmaku Table */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1 min-h-[240px]">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 font-cute text-xs">
              <p className="text-2xl mb-1">🍃</p>
              <p>{locale === 'zh' ? '当前暂无弹幕（已被清空或无匹配结果）' : 'No danmakus recorded'}</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white border border-neutral-200/80 hover:border-amber-300 shadow-3xs hover:shadow-xs transition-all flex items-center justify-between gap-3"
              >
                {/* Left: Sender & Content */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-lg shrink-0">{item.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bubble font-bold text-xs text-neutral-800 truncate">
                        {item.sender}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-100">
                        <Heart className="w-2.5 h-2.5 fill-rose-500" />
                        <span>{item.likes || 1}</span>
                      </span>
                    </div>
                    <div className="text-xs font-cute text-neutral-700 truncate mt-0.5 flex items-center gap-1">
                      {renderInlineContent(item.content)}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="shrink-0">
                  {deleteConfirmId === item.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-bubble font-bold text-xs hover:bg-rose-700 shadow-xs cursor-pointer"
                      >
                        {locale === 'zh' ? '确认删除' : 'Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 rounded-xl bg-neutral-100 text-neutral-600 font-bold text-xs hover:bg-neutral-200 cursor-pointer"
                      >
                        {locale === 'zh' ? '取消' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title={locale === 'zh' ? '下架/删除该弹幕' : 'Delete this danmaku'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-amber-900/10 flex items-center justify-between shrink-0 text-xs font-cute text-neutral-500">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{locale === 'zh' ? '馆长管理模式生效中' : 'Admin Moderation Active'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-700 font-bubble font-bold text-xs border border-neutral-200/80 transition cursor-pointer shadow-xs"
          >
            {locale === 'zh' ? '完成' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
