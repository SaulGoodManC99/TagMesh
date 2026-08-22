import React, { useState } from 'react';
import { Server, Copy, Check, X, ShieldAlert, ShieldCheck, Lock } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import { playPop } from '../blog/utils/soundEffects';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, locale } = useI18n();
  const { isAdmin, isGuest, openAuthModal } = useAuth();
  const [copied, setCopied] = useState(false);
  const mcpToken = 'tagmesh_mcp_secret_bearer_token';
  const mcpEndpoint = typeof window !== 'undefined' ? `${window.location.origin}/mcp/call` : 'http://localhost:8787/mcp/call';

  const handleCopy = () => {
    if (!isAdmin) return;
    playPop();
    navigator.clipboard.writeText(mcpToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-[#fdfbf7] border-4 border-white shadow-2xl rounded-[32px] clay-card p-6 text-neutral-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bubble text-lg font-bold text-neutral-900">{t.mcp.title}</h3>
              <p className="font-cute text-xs text-neutral-500">{t.mcp.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs font-cute">
          {isAdmin ? (
            /* Admin: Full Access to MCP Endpoint & Token */
            <>
              {/* MCP Endpoint URL */}
              <div>
                <label className="block text-neutral-600 font-bold mb-1">{t.mcp.endpoint}</label>
                <div className="p-3 rounded-2xl bg-white border border-neutral-200/80 font-mono text-cyan-700 break-all select-all shadow-xs">
                  {mcpEndpoint}
                </div>
              </div>

              {/* Bearer Token */}
              <div>
                <label className="block text-neutral-600 font-bold mb-1">{t.mcp.tokenLabel}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={mcpToken}
                    readOnly
                    className="flex-1 p-3 rounded-2xl bg-white border border-neutral-200/80 font-mono text-neutral-800 focus:outline-none shadow-xs"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-neutral-900 text-cyan-300 hover:bg-neutral-800 text-xs font-bubble font-bold transition cursor-pointer shadow-md active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? t.mcp.tokenCopied : 'Copy Token'}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-neutral-700 leading-relaxed font-cute">
                {t.mcp.toolsList}
              </div>
            </>
          ) : (
            /* Guest: Shielded Zero-Leakage Privacy Guard */
            <div className="p-6 rounded-2xl bg-rose-50/80 border-2 border-rose-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bubble font-bold text-sm text-neutral-900 mb-1">
                  {locale === 'zh' ? '🔒 馆长密钥与 MCP 配置已锁定' : '🔒 MCP Token & Keys Locked'}
                </h4>
                <p className="text-xs font-cute text-neutral-600 leading-relaxed max-w-sm mx-auto">
                  {locale === 'zh' 
                    ? '为了防止未授权访问与密钥泄露，游客身份无法查看或复制 MCP 访问凭证及 Cloudflare 端点。'
                    : 'To prevent unauthorized access, guest users cannot view or copy MCP bearer credentials.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bubble font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{locale === 'zh' ? '👑 登录馆长身份解锁' : '👑 Login as Admin'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-amber-900/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-700 font-bubble font-bold text-xs border border-neutral-200/80 transition cursor-pointer shadow-xs"
          >
            {t.shortcuts.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
};
