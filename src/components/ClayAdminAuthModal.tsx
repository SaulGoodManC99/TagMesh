import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, User, LogOut, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';
import { playPop, playChime } from '../blog/utils/soundEffects';
import { triggerParticleBurst } from '../blog/utils/confetti';

export const ClayAdminAuthModal: React.FC = () => {
  const { role, isAdmin, loginAsAdmin, logoutToGuest, updateAdminPassword, isAuthModalOpen, closeAuthModal } = useAuth();
  const { locale } = useI18n();

  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab for changing password
  const [activeTab, setActiveTab] = useState<'login' | 'changePwd'>('login');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  if (!isAuthModalOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const success = loginAsAdmin(password);
    if (success) {
      playChime();
      triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 35);
      setPassword('');
      closeAuthModal();
    } else {
      playPop(300);
      setErrorMsg(locale === 'zh' ? '口令错误！默认馆长口令为：admin888' : 'Incorrect password! Default is: admin888');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPwd.trim().length < 4) {
      setErrorMsg(locale === 'zh' ? '新口令长度至少需 4 位！' : 'Password must be at least 4 chars!');
      return;
    }

    const success = updateAdminPassword(oldPwd, newPwd);
    if (success) {
      playChime();
      setSuccessMsg(locale === 'zh' ? '馆长口令修改成功！请妥善保存' : 'Password updated successfully!');
      setOldPwd('');
      setNewPwd('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(locale === 'zh' ? '原口令验证失败！' : 'Old password incorrect!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/40 modal-backdrop-enter" 
        onClick={closeAuthModal} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#fdfbf7] border-4 border-white shadow-2xl rounded-[32px] clay-card p-6 text-neutral-800 modal-card-enter select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-2xl ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} shadow-xs`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bubble text-lg font-bold text-neutral-900">
                {isAdmin 
                  ? (locale === 'zh' ? '👑 馆长后台权限中心' : '👑 Admin Command Center')
                  : (locale === 'zh' ? '🔐 馆长身份认证' : '🔐 Admin Authentication')}
              </h3>
              <p className="font-cute text-xs text-neutral-500">
                {locale === 'zh' ? '当前身份：' : 'Current Role: '}
                <span className="font-bold text-amber-700">
                  {isAdmin ? (locale === 'zh' ? '👑 馆长 (完整读写/MCP/弹幕管理)' : '👑 Admin') : (locale === 'zh' ? '🌱 游客/旅人 (安全沙盒保护)' : '🌱 Guest')}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 text-xs font-cute">
          {isAdmin ? (
            /* Admin Logged In Screen */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm font-bubble">
                    {locale === 'zh' ? '您当前处于最高管理员权限' : 'You are logged in as Admin'}
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    {locale === 'zh' 
                      ? '• 解锁所有卡片编辑与官方置顶\n• 解锁 MCP Token 与 Cloudflare 边缘同步密钥\n• 解锁弹幕广场总控管理与敏感词违规下架'
                      : '• Full note editing & official pinning\n• View & configure MCP keys & Cloudflare sync\n• Danmaku moderation & bad words cleanup'}
                  </p>
                </div>
              </div>

              {/* Password update section toggle */}
              {activeTab === 'changePwd' ? (
                <form onSubmit={handleChangePassword} className="space-y-2.5 p-3 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
                  <span className="font-bubble font-bold text-neutral-800 block text-xs">
                    {locale === 'zh' ? '修改馆长口令' : 'Update Admin Password'}
                  </span>
                  <input
                    type="password"
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    placeholder={locale === 'zh' ? '原馆长口令' : 'Old Password'}
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono text-neutral-800 focus:outline-none"
                    required
                  />
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder={locale === 'zh' ? '新馆长口令 (至少4位)' : 'New Password (min 4 chars)'}
                    className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono text-neutral-800 focus:outline-none"
                    required
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="px-3 py-1.5 rounded-xl text-neutral-500 hover:bg-neutral-100 font-bold"
                    >
                      {locale === 'zh' ? '取消' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bubble font-bold shadow-xs"
                    >
                      {locale === 'zh' ? '确认修改' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('changePwd')}
                    className="text-xs font-bubble font-bold text-amber-700 hover:text-amber-800 underline flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{locale === 'zh' ? '修改馆长口令' : 'Change Master Password'}</span>
                  </button>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1.5 text-xs">
                  <Check className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          ) : (
            /* Guest Login Form */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-[11px] leading-relaxed">
                <span className="font-bold block mb-1">🌱 游客模式说明：</span>
                {locale === 'zh'
                  ? '游客可自由阅读展厅笔记并创建临时手账。馆长官方卡片受防篡改保护，MCP 云端密钥已隐匿。'
                  : 'Guests can read gallery notes & write local memos. Admin official cards and MCP keys are protected.'}
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1.5">
                  {locale === 'zh' ? '输入馆长口令' : 'Enter Admin Password'}
                </label>
                <div className="flex items-center gap-2 px-3.5 h-11 rounded-2xl bg-white border border-neutral-200/80 shadow-inner">
                  <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={locale === 'zh' ? '默认馆长口令: admin888' : 'Default password: admin888'}
                    className="w-full bg-transparent text-sm font-mono text-neutral-900 focus:outline-none placeholder:text-neutral-400"
                    autoFocus
                  />
                </div>
                <span className="text-[10px] text-neutral-400 font-cute mt-1 block">
                  {locale === 'zh' ? '💡 初始默认馆长口令：admin888' : '💡 Default password is: admin888'}
                </span>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bubble font-bold text-sm border-2 border-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{locale === 'zh' ? '👑 验证并解锁馆长身份' : '👑 Authenticate as Admin'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-amber-900/10 flex items-center justify-between">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                playPop();
                logoutToGuest();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bubble font-bold text-xs transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>{locale === 'zh' ? '🌱 退出为游客模式' : '🌱 Switch to Guest'}</span>
            </button>
          ) : (
            <span className="text-[11px] text-neutral-400 font-cute">
              {locale === 'zh' ? '处于游客沙盒中' : 'In Guest Sandbox'}
            </span>
          )}

          <button
            type="button"
            onClick={closeAuthModal}
            className="px-5 py-2 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-700 font-bubble font-bold text-xs border border-neutral-200/80 transition cursor-pointer shadow-xs"
          >
            {locale === 'zh' ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
