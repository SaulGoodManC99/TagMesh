import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  User, 
  LogOut, 
  Check, 
  X, 
  Sparkles, 
  AlertCircle,
  Cloud,
  Database,
  DownloadCloud,
  UploadCloud,
  RefreshCw,
  Loader2,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { playPop, playChime, playSoftTick } from '../blog/utils/soundEffects';
import { triggerParticleBurst } from '../blog/utils/confetti';
import { 
  resetTelemetryRemote, 
  checkR2StatusRemote, 
  createR2SnapshotBackup, 
  fetchR2BackupsList, 
  restoreR2Snapshot,
  R2BackupItem,
  R2StatusResult
} from '../services/api';
import { db } from '../db/dexie';

export const ClayAdminAuthModal: React.FC = () => {
  const { role, isAdmin, loginAsAdmin, logoutToGuest, updateAdminPassword, isAuthModalOpen, closeAuthModal } = useAuth();
  const { locale } = useI18n();
  const { 
    guestNotesEnabled, 
    buttonStyle, 
    colorMode, 
    setGuestNotesEnabled, 
    setButtonStyle, 
    setColorMode 
  } = useSiteConfig();

  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab for changing password
  const [activeTab, setActiveTab] = useState<'login' | 'changePwd'>('login');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  // R2 Backup & Storage State
  const [r2Status, setR2Status] = useState<R2StatusResult | null>(null);
  const [backupsList, setBackupsList] = useState<R2BackupItem[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoringKey, setIsRestoringKey] = useState<string | null>(null);
  const [showBackupsList, setShowBackupsList] = useState(false);
  const [isLoadingR2, setIsLoadingR2] = useState(false);

  // Load R2 status & backups when admin modal is opened
  useEffect(() => {
    if (isAuthModalOpen && isAdmin) {
      loadR2Info();
    }
  }, [isAuthModalOpen, isAdmin]);

  const loadR2Info = async () => {
    setIsLoadingR2(true);
    try {
      const [status, backups] = await Promise.all([
        checkR2StatusRemote(),
        fetchR2BackupsList()
      ]);
      setR2Status(status);
      setBackupsList(backups.backups || []);
    } catch (err) {
      console.warn('[AdminModal] loadR2Info error:', err);
    } finally {
      setIsLoadingR2(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    playSoftTick();
    try {
      const allNotes = await db.notes.toArray();
      const res = await createR2SnapshotBackup(allNotes, 'admin');
      if (res.success) {
        playChime();
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 30);
        setSuccessMsg(locale === 'zh' ? `📦 成功创建 R2 云端快照！已备份 ${res.totalNotes} 篇笔记` : `📦 Snapshot created! ${res.totalNotes} notes backed up`);
        loadR2Info();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to create backup');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Backup error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (key: string) => {
    if (!window.confirm(locale === 'zh' ? '确定要从该 R2 快照恢复笔记吗？本地已有同名笔记将被合并覆盖。' : 'Restore notes from this snapshot? Existing notes with same ID will be overwritten.')) {
      return;
    }

    setIsRestoringKey(key);
    playSoftTick();
    try {
      const res = await restoreR2Snapshot(key);
      if (res.success && res.notes && res.notes.length > 0) {
        await db.notes.bulkPut(res.notes);
        playChime();
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 35);
        setSuccessMsg(locale === 'zh' ? `📥 成功从快照恢复 ${res.notes.length} 篇笔记！` : `📥 Successfully restored ${res.notes.length} notes!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'No notes found in snapshot');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Restore error');
    } finally {
      setIsRestoringKey(null);
    }
  };

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
      <div className="relative w-full max-w-md bg-[#fdfbf7] dark:bg-neutral-900 border-4 border-white dark:border-white/10 shadow-2xl rounded-[32px] clay-card p-6 text-neutral-800 dark:text-neutral-100 modal-card-enter select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-2xl ${isAdmin ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'} shadow-xs`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bubble text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {isAdmin 
                  ? (locale === 'zh' ? '👑 馆长后台权限中心' : '👑 Admin Command Center')
                  : (locale === 'zh' ? '🔐 馆长身份认证' : '🔐 Admin Authentication')}
              </h3>
              <p className="font-cute text-xs text-neutral-500 dark:text-neutral-400">
                {locale === 'zh' ? '当前身份：' : 'Current Role: '}
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {isAdmin ? (locale === 'zh' ? '👑 馆长 (完整读写/MCP/弹幕管理)' : '👑 Admin') : (locale === 'zh' ? '🌱 游客/旅人 (安全沙盒保护)' : '🌱 Guest')}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 text-xs font-cute">
          {isAdmin ? (
            /* Admin Logged In Screen */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm font-bubble">
                    {locale === 'zh' ? '您当前处于最高管理员权限' : 'You are logged in as Admin'}
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    {locale === 'zh' 
                      ? '• 解锁所有卡片编辑与官方置顶\n• 解锁 MCP Token 与 Cloudflare 边缘同步密钥\n• 解锁弹幕广场总控管理与敏感词违规下架'
                      : '• Full note editing & official pinning\n• View & configure MCP keys & Cloudflare sync\n• Danmaku moderation & bad words cleanup'}
                  </p>
                </div>
              </div>

              {/* ⚙️ 站点全局配置与权限总控 (Admin Exclusive Controls) */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-amber-900/10 dark:border-white/10 pb-2">
                  <span className="font-bubble font-bold text-neutral-800 dark:text-neutral-100 text-xs flex items-center gap-1.5">
                    <span>⚙️</span>
                    <span>{locale === 'zh' ? '站点展示与权限总控' : 'Site & Access Control'}</span>
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    {locale === 'zh' ? '实时生效' : 'Live Sync'}
                  </span>
                </div>

                {/* 1. Guest Notes & Access Toggle */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-50/80 border border-neutral-200/60">
                  <div>
                    <div className="font-bubble font-bold text-neutral-900 text-xs flex items-center gap-1">
                      <span>🌱</span>
                      <span>{locale === 'zh' ? '开放旅人笔记展示与编辑' : 'Allow Guest Notes & Memos'}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-cute">
                      {locale === 'zh' 
                        ? (guestNotesEnabled ? '当前允许游客浏览旅人笔记并使用工作台' : '已关闭：游客仅能浏览馆长笔记，隐藏工作台入口')
                        : (guestNotesEnabled ? 'Guests can view notes and write memos' : 'Closed: Guests only see Curator notes, workspace locked')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playPop(guestNotesEnabled ? 350 : 650);
                      setGuestNotesEnabled(!guestNotesEnabled);
                      setSuccessMsg(locale === 'zh' ? (guestNotesEnabled ? '🔒 旅人笔记已关闭，仅开放馆长内容' : '🌱 旅人笔记展示与工作台已向游客开放！') : 'Settings updated!');
                      setTimeout(() => setSuccessMsg(null), 3000);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bubble font-bold text-xs shadow-3xs cursor-pointer transition active:scale-95 shrink-0 ${
                      guestNotesEnabled
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                    }`}
                  >
                    {guestNotesEnabled ? (locale === 'zh' ? '✅ 已开启' : 'Enabled') : (locale === 'zh' ? '🚫 已关闭' : 'Disabled')}
                  </button>
                </div>

                {/* 2. Button Style Selector */}
                <div className="space-y-1.5">
                  <span className="font-bubble font-bold text-neutral-700 dark:text-neutral-300 text-xs block">
                    🎨 {locale === 'zh' ? '前台交互按钮风格' : 'Button Aesthetic Style'}
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'tint', labelZh: '主题半透微光', labelEn: 'Theme Tint' },
                      { id: 'clay', labelZh: '3D 空间黏土', labelEn: '3D Clay' },
                      { id: 'glass', labelZh: 'Vision 磨砂玻璃', labelEn: 'Frosted Glass' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          playPop(520);
                          setButtonStyle(b.id as any);
                        }}
                        className={`p-1.5 rounded-xl text-center text-xs font-bubble font-bold border transition cursor-pointer active:scale-95 ${
                          buttonStyle === b.id
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-600 shadow-xs'
                            : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border-neutral-200/80 dark:border-white/10'
                        }`}
                      >
                        {locale === 'zh' ? b.labelZh : b.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Color Mode Selector */}
                <div className="space-y-1.5">
                  <span className="font-bubble font-bold text-neutral-700 text-xs block">
                    🌙 {locale === 'zh' ? '色彩模式 (支持自动跟随系统)' : 'Color Theme Mode'}
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'auto', emoji: '⚙️', labelZh: '跟随系统', labelEn: 'Auto System' },
                      { id: 'light', emoji: '☀️', labelZh: '浅色明亮', labelEn: 'Light' },
                      { id: 'dark', emoji: '🌙', labelZh: '深度暗黑', labelEn: 'Dark' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          playPop(580);
                          setColorMode(c.id as any);
                        }}
                        className={`p-1.5 rounded-xl text-center text-xs font-bubble font-bold border transition cursor-pointer active:scale-95 flex items-center justify-center gap-1 ${
                          colorMode === c.id
                            ? 'bg-indigo-100 text-indigo-900 border-indigo-300 shadow-xs'
                            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200/80'
                        }`}
                      >
                        <span>{c.emoji}</span>
                        <span>{locale === 'zh' ? c.labelZh : c.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Telemetry Reset & Re-timing Section (Admin Exclusive) */}
              <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-amber-900/10 pb-2">
                  <span className="font-bubble font-bold text-neutral-800 text-xs flex items-center gap-1.5">
                    <span>📊</span>
                    <span>{locale === 'zh' ? '站点运行时长与数据重置' : 'Site Uptime & Data Reset'}</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {locale === 'zh' ? '馆长专享' : 'Admin'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Reset Uptime Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      playPop();
                      const res = await resetTelemetryRemote({ resetUptime: true });
                      if (res) {
                        try { localStorage.setItem('tagmesh_cached_system_start_time', String(res.systemStartTime)); } catch {}
                        window.dispatchEvent(new CustomEvent('tagmesh_telemetry_updated', { detail: res }));
                        playChime();
                        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 20);
                        setSuccessMsg(locale === 'zh' ? '⚡ 稳定运行时长已重置为从现在起重新计时！' : '⚡ Stable uptime counter reset to now!');
                        setTimeout(() => setSuccessMsg(null), 3500);
                      }
                    }}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bubble font-bold text-[11px] border border-amber-200 shadow-3xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <span>⏱️</span>
                    <span>{locale === 'zh' ? '重置运行时长' : 'Reset Uptime'}</span>
                  </button>

                  {/* Reset Visits Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      playPop();
                      const res = await resetTelemetryRemote({ resetVisits: true });
                      if (res) {
                        try { 
                          sessionStorage.removeItem('tagmesh_visited_session_date');
                          localStorage.setItem('tagmesh_cached_telemetry', JSON.stringify({ total: 1, today: 1 })); 
                        } catch {}
                        window.dispatchEvent(new CustomEvent('tagmesh_telemetry_updated', { detail: { ...res, totalVisits: 1, todayVisits: 1 } }));
                        playChime();
                        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 20);
                        setSuccessMsg(locale === 'zh' ? '👥 访客统计已重置，从当前会话 1 重新起步！' : '👥 Visitor stats reset to 1 for current session!');
                        setTimeout(() => setSuccessMsg(null), 3500);
                      }
                    }}
                    className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-900 font-bubble font-bold text-[11px] border border-pink-200 shadow-3xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <span>👥</span>
                    <span>{locale === 'zh' ? '重置访客统计' : 'Reset Visits'}</span>
                  </button>

                  {/* Reset Stamps Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      playPop();
                      const res = await resetTelemetryRemote({ resetStamps: true });
                      if (res) {
                        try { 
                          localStorage.setItem('tagmesh_paw_stamps_count', '0'); 
                          localStorage.setItem('tagmesh_paw_stamps_list', '[]');
                        } catch {}
                        window.dispatchEvent(new CustomEvent('tagmesh_telemetry_updated', { detail: { ...res, stampCount: 0 } }));
                        playChime();
                        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 20);
                        setSuccessMsg(locale === 'zh' ? '🐾 爪印手印计数已清零！' : '🐾 Stamp counts have been reset to 0!');
                        setTimeout(() => setSuccessMsg(null), 3500);
                      }
                    }}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bubble font-bold text-[11px] border border-emerald-200 shadow-3xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <span>🐾</span>
                    <span>{locale === 'zh' ? '清零爪印手印' : 'Reset Stamps'}</span>
                  </button>

                  {/* Reset All Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      playPop();
                      const res = await resetTelemetryRemote({ resetUptime: true, resetVisits: true, resetStamps: true });
                      if (res) {
                        try { 
                          sessionStorage.removeItem('tagmesh_visited_session_date');
                          localStorage.setItem('tagmesh_cached_system_start_time', String(res.systemStartTime));
                          localStorage.setItem('tagmesh_cached_telemetry', JSON.stringify({ total: 1, today: 1 }));
                          localStorage.setItem('tagmesh_paw_stamps_count', '0');
                          localStorage.setItem('tagmesh_paw_stamps_list', '[]');
                        } catch {}
                        window.dispatchEvent(new CustomEvent('tagmesh_telemetry_updated', { 
                          detail: {
                            systemStartTime: res.systemStartTime,
                            totalVisits: 1,
                            todayVisits: 1,
                            stampCount: 0
                          } 
                        }));
                        playChime();
                        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 35);
                        setSuccessMsg(locale === 'zh' ? '✨ 运行时间、访客与爪印数据已一键全量重置生效！' : '✨ All uptime, visits and stamp data have been reset!');
                        setTimeout(() => setSuccessMsg(null), 4000);
                      }
                    }}
                    className="p-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bubble font-bold text-[11px] shadow-3xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <span>⚡</span>
                    <span>{locale === 'zh' ? '一键全量重置' : 'Reset All'}</span>
                  </button>
                </div>
              </div>

              {/* Cloudflare R2 Object Storage & Cloud Snapshot Backups */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50/80 border border-sky-200/80 text-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bubble font-extrabold text-xs text-sky-900">
                    <Cloud className="w-4 h-4 text-sky-600" />
                    <span>{locale === 'zh' ? 'Cloudflare R2 对象存储与云端快照' : 'Cloudflare R2 & Cloud Snapshots'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bubble font-bold ${
                      r2Status?.connected ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r2Status?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`}></span>
                      <span>{r2Status?.connected ? (r2Status.bucketName || 'tagmesh-bucket') : (locale === 'zh' ? '存储桶未连接' : 'Disconnected')}</span>
                    </span>
                    <button
                      type="button"
                      onClick={loadR2Info}
                      disabled={isLoadingR2}
                      className="p-1 text-sky-600 hover:text-sky-800 transition cursor-pointer"
                      title={locale === 'zh' ? '刷新 R2 状态' : 'Refresh R2'}
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingR2 ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <p className="font-cute text-[11px] text-sky-900/80 leading-relaxed">
                  {locale === 'zh'
                    ? 'R2 专属存储桶已启用，提供 Markdown 截图拖拽粘贴秒传（零出口流量费）及全库云端快照时光机备份。'
                    : 'R2 bucket active: Zero-egress screenshot hosting & full database snapshot backups.'}
                </p>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleCreateBackup}
                    disabled={isBackingUp}
                    className="flex-1 p-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bubble font-bold text-xs shadow-3xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isBackingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    <span>{isBackingUp ? (locale === 'zh' ? '打包上传中...' : 'Backing up...') : (locale === 'zh' ? '📦 一键备份全库到 R2' : '📦 Backup All to R2')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBackupsList(!showBackupsList)}
                    className="p-2 px-3 rounded-xl bg-white hover:bg-sky-50 text-sky-800 font-bubble font-bold text-xs border border-sky-200 shadow-3xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 text-sky-600" />
                    <span>{locale === 'zh' ? `快照列表 (${backupsList.length})` : `Snapshots (${backupsList.length})`}</span>
                  </button>
                </div>

                {/* Collapsible Snapshots List */}
                {showBackupsList && (
                  <div className="pt-2 border-t border-sky-200/60 space-y-1.5 animate-in fade-in max-h-48 overflow-y-auto no-scrollbar">
                    {backupsList.length === 0 ? (
                      <p className="text-center py-2 text-xs font-cute text-sky-700/70">
                        {locale === 'zh' ? '暂无云端快照，点击上方按钮即可创建第一份备份。' : 'No snapshots yet. Click above to create one.'}
                      </p>
                    ) : (
                      backupsList.map((bk) => {
                        const noteCount = bk.customMetadata?.totalNotes;
                        const dateStr = new Date(bk.uploaded).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
                        const isRestoring = isRestoringKey === bk.key;

                        return (
                          <div key={bk.key} className="flex items-center justify-between p-2 rounded-xl bg-white/90 border border-sky-100 text-xs shadow-3xs">
                            <div className="min-w-0 pr-2">
                              <div className="font-mono font-bold text-neutral-800 truncate text-[11px]">
                                📑 {bk.key.replace('backups/', '')}
                              </div>
                              <div className="font-cute text-[10px] text-neutral-500">
                                {dateStr} {noteCount ? `• ${noteCount} 篇笔记` : ''} • {(bk.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isRestoring}
                              onClick={() => handleRestoreBackup(bk.key)}
                              className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 font-bubble font-bold text-[11px] shrink-0 transition active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              {isRestoring ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <span>{locale === 'zh' ? '恢复' : 'Restore'}</span>
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
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
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1.5 text-xs animate-in fade-in">
                  <Check className="w-4 h-4 shrink-0" />
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
                  ? '游客可自由阅读公开笔记并创建临时笔记。馆长官方卡片受防篡改保护，MCP 云端密钥已隐匿。'
                  : 'Guests can read public notes & write local memos. Admin official cards and MCP keys are protected.'}
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
