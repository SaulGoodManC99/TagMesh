import React, { useState, useEffect, useCallback } from 'react';
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
  HardDrive,
  MessageSquare,
  Palette,
  Sun,
  Moon,
  Sliders,
  Send,
  Bot,
  Eye,
  EyeOff,
  Copy,
  Radio,
  CheckCircle2,
  ExternalLink,
  Zap
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
  fetchTelegramConfigRemote,
  saveTelegramConfigRemote,
  setTelegramWebhookRemote,
  deleteTelegramWebhookRemote,
  testTelegramBotRemote,
  TelegramConfigResult,
  R2BackupItem,
  R2StatusResult,
  getAuthToken
} from '../services/api';
import { db } from '../db/dexie';
import { toast } from './ClayToast';

export const ClayAdminAuthModal: React.FC = () => {
  const { role, isAdmin, loginAsAdmin, logoutToGuest, isAuthModalOpen, closeAuthModal, authError } = useAuth();
  const { locale } = useI18n();

  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Top Navigation Tab
  const [adminTab, setAdminTab] = useState<'settings' | 'telegram' | 'r2' | 'mcp'>('settings');

  // MCP Gateway State
  const [mcpClientType, setMcpClientType] = useState<'claude' | 'cursor' | 'windsurf' | 'cline' | 'agy' | 'curl'>('claude');
  const [isTestingMcp, setIsTestingMcp] = useState(false);
  const [mcpTestResult, setMcpTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    toolsCount: number;
    tools: string[];
    error?: string;
  } | null>(null);

  // R2 Backup & Storage State
  const [r2Status, setR2Status] = useState<R2StatusResult | null>(null);
  const [backupsList, setBackupsList] = useState<R2BackupItem[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoringKey, setIsRestoringKey] = useState<string | null>(null);
  const [isLoadingR2, setIsLoadingR2] = useState(false);

  // Telegram Bot State
  const [tgConfig, setTgConfig] = useState<TelegramConfigResult | null>(null);
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgUserIds, setTgUserIds] = useState('');
  const [tgWebhookUrl, setTgWebhookUrl] = useState('');
  const [tgDefaultPublic, setTgDefaultPublic] = useState(true);
  const [showTgToken, setShowTgToken] = useState(false);
  const [isLoadingTg, setIsLoadingTg] = useState(false);
  const [isSavingTg, setIsSavingTg] = useState(false);
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);
  const [isTestingTg, setIsTestingTg] = useState(false);

  const handleCopyText = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      playPop(650);
      triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 20);
      triggerAdminToast(locale === 'zh' ? `📋 ${label} 已复制到剪贴板！` : `📋 ${label} copied to clipboard!`);
    } catch {
      triggerAdminToast(locale === 'zh' ? '复制失败，请手动复制' : 'Failed to copy', 'error');
    }
  };

  const handleTestMcp = async () => {
    setIsTestingMcp(true);
    setMcpTestResult(null);
    playSoftTick();
    const startTime = performance.now();
    const currentToken = getAuthToken() || 'YOUR_ADMIN_PASSWORD_OR_MCP_TOKEN';
    try {
      const res = await fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list',
        }),
      });
      const data = (await res.json()) as any;
      const latency = Math.round(performance.now() - startTime);
      if (data?.result?.tools && Array.isArray(data.result.tools)) {
        setMcpTestResult({
          success: true,
          latencyMs: latency,
          toolsCount: data.result.tools.length,
          tools: data.result.tools.map((t: any) => t.name),
        });
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 30);
        triggerAdminToast(locale === 'zh' ? `⚡ MCP 连通性测试通过！响应延迟 ${latency}ms，已加载 ${data.result.tools.length} 个工具` : `⚡ MCP OK! ${latency}ms, ${data.result.tools.length} tools loaded`);
      } else {
        setMcpTestResult({
          success: false,
          latencyMs: latency,
          toolsCount: 0,
          tools: [],
          error: data?.error?.message || 'Invalid RPC response',
        });
      }
    } catch (err: any) {
      setMcpTestResult({
        success: false,
        latencyMs: 0,
        toolsCount: 0,
        tools: [],
        error: err.message || 'Connection failed',
      });
    } finally {
      setIsTestingMcp(false);
    }
  };

  const getMcpSnippet = (client: typeof mcpClientType): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tagmesh.top';
    const mcpUrl = `${origin}/mcp`;
    const token = getAuthToken() || '<YOUR_ADMIN_PASSWORD_OR_MCP_TOKEN>';

    if (client === 'claude') {
      return JSON.stringify({
        mcpServers: {
          tagmesh: {
            command: 'npx',
            args: [
              '-y',
              'mcp-remote',
              mcpUrl,
              '--header',
              `Authorization: Bearer ${token}`
            ]
          }
        }
      }, null, 2);
    }

    if (client === 'cursor') {
      return JSON.stringify({
        mcpServers: {
          tagmesh: {
            url: mcpUrl,
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      }, null, 2);
    }

    if (client === 'windsurf') {
      return JSON.stringify({
        mcpServers: {
          tagmesh: {
            serverUrl: mcpUrl,
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      }, null, 2);
    }

    if (client === 'cline') {
      return JSON.stringify({
        mcpServers: {
          tagmesh: {
            url: mcpUrl,
            headers: {
              Authorization: `Bearer ${token}`
            },
            disabled: false,
            autoApprove: []
          }
        }
      }, null, 2);
    }

    if (client === 'agy') {
      return `# Antigravity CLI / Sidecar Test
curl -X POST "${mcpUrl}" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;
    }

    return `curl -X POST "${mcpUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_notes","arguments":{"limit":5}}}'`;
  };

  const loadR2Info = useCallback(async () => {
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
  }, []);

  const loadTelegramInfo = useCallback(async (isManual: boolean = false) => {
    setIsLoadingTg(true);
    if (isManual) {
      playSoftTick();
    }
    try {
      const config = await fetchTelegramConfigRemote();
      setTgConfig(config);
      if (config.userIds) setTgUserIds(config.userIds);
      if (config.defaultPublic !== undefined) setTgDefaultPublic(config.defaultPublic);
      if (config.webhookUrl) {
        setTgWebhookUrl(config.webhookUrl);
      } else if (typeof window !== 'undefined') {
        setTgWebhookUrl(`${window.location.origin}/api/telegram/webhook`);
      }
      if (isManual) {
        triggerAdminToast(locale === 'zh' ? '🔄 Telegram 状态已刷新！' : '🔄 Telegram status refreshed!');
      }
    } catch (err) {
      console.warn('[AdminModal] loadTelegramInfo error:', err);
      if (isManual) {
        triggerAdminToast(locale === 'zh' ? '🔄 状态刷新完成' : '🔄 Status refreshed', 'info');
      }
    } finally {
      setIsLoadingTg(false);
    }
  }, [locale]);

  // Load R2 status & Telegram config when admin modal is opened
  useEffect(() => {
    if (isAuthModalOpen && isAdmin) {
      loadR2Info();
      loadTelegramInfo();
    }
  }, [isAuthModalOpen, isAdmin, loadR2Info, loadTelegramInfo]);

  const triggerAdminToast = (msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    playChime();
    toast.show(msg, type);
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    playSoftTick();
    try {
      const allNotes = await db.notes.toArray();
      const res = await createR2SnapshotBackup(allNotes, 'admin');
      if (res.success) {
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 30);
        triggerAdminToast(locale === 'zh' ? `📦 成功创建 R2 云端快照！已备份 ${res.totalNotes} 篇笔记` : `📦 Snapshot created! ${res.totalNotes} notes backed up`);
        loadR2Info();
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
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 35);
        triggerAdminToast(locale === 'zh' ? `📥 成功从快照恢复 ${res.notes.length} 篇笔记！` : `📥 Successfully restored ${res.notes.length} notes!`);
      } else {
        setErrorMsg(res.error || 'No notes found in snapshot');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Restore error');
    } finally {
      setIsRestoringKey(null);
    }
  };

  const handleSaveTelegramConfig = async () => {
    setIsSavingTg(true);
    setErrorMsg(null);
    playSoftTick();
    try {
      const res = await saveTelegramConfigRemote({
        botToken: tgBotToken || undefined,
        userIds: tgUserIds,
        webhookUrl: tgWebhookUrl,
        enabled: true,
        defaultPublic: tgDefaultPublic,
      });
      if (res.ok) {
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 20);
        triggerAdminToast(locale === 'zh' ? '💾 Telegram 配置已保存！' : 'Telegram config saved!');
        setTgBotToken('');
        loadTelegramInfo();
      } else {
        setErrorMsg(res.error || '保存 Telegram 配置失败');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '保存配置异常');
    } finally {
      setIsSavingTg(false);
    }
  };

  const handleSetTelegramWebhook = async () => {
    setIsSettingWebhook(true);
    setErrorMsg(null);
    playSoftTick();
    try {
      // If user typed a new token or URL, save it first
      if (tgBotToken || tgUserIds) {
        await saveTelegramConfigRemote({
          botToken: tgBotToken || undefined,
          userIds: tgUserIds,
          webhookUrl: tgWebhookUrl,
          enabled: true,
          defaultPublic: tgDefaultPublic,
        });
      }
      const res = await setTelegramWebhookRemote(tgWebhookUrl || undefined);
      if (res.ok) {
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 30);
        triggerAdminToast(locale === 'zh' ? '📡 Telegram Webhook 激活成功！已成功注册官方服务器' : '📡 Webhook successfully set to Telegram!');
        loadTelegramInfo();
      } else {
        setErrorMsg(res.error || '激活 Webhook 失败');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '设置 Webhook 异常');
    } finally {
      setIsSettingWebhook(false);
    }
  };

  const handleDeleteTelegramWebhook = async () => {
    if (!window.confirm(locale === 'zh' ? '确定要解除 Telegram Webhook 绑定吗？解除后机器人将停止自动接收消息。' : 'Delete Telegram webhook?')) return;
    playSoftTick();
    try {
      const res = await deleteTelegramWebhookRemote();
      if (res.ok) {
        triggerAdminToast(locale === 'zh' ? '🗑️ Webhook 已解除绑定' : 'Webhook removed');
        loadTelegramInfo();
      } else {
        setErrorMsg(res.error || '解除 Webhook 失败');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '解除失败');
    }
  };

  const handleTestTelegramBot = async () => {
    setIsTestingTg(true);
    setErrorMsg(null);
    playSoftTick();
    try {
      const res = await testTelegramBotRemote();
      if (res.ok) {
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 30);
        triggerAdminToast(locale === 'zh' ? '🎉 测试消息已成功推送到您的 Telegram！' : '🎉 Test message sent to your Telegram!');
      } else {
        setErrorMsg(res.error || '发送测试消息失败，请检查 Token 与用户 ID');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '测试异常');
    } finally {
      setIsTestingTg(false);
    }
  };

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoggingIn(true);

    try {
      const success = await loginAsAdmin(password);
      if (success) {
        playChime();
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 35);
        setPassword('');
        closeAuthModal();
        triggerAdminToast(locale === 'zh' ? '👑 欢迎回来，馆长！' : '👑 Welcome back, Curator!');
      } else {
        playPop(300);
        setErrorMsg(authError || (locale === 'zh' ? '口令错误，请重新输入' : 'Incorrect password!'));
      }
    } catch {
      setErrorMsg(locale === 'zh' ? '登录失败，请检查网络或服务端配置' : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-2xl rounded-[36px] p-6 sm:p-8 border border-neutral-200/90 dark:border-white/15 shadow-2xl space-y-5 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isAdmin ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'} shadow-xs`}>
              {isAdmin ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bubble text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                {isAdmin 
                  ? (locale === 'zh' ? '👑 馆长后台权限中心' : '👑 Admin Command Center')
                  : (locale === 'zh' ? '🔐 馆长身份认证' : '🔐 Admin Authentication')}
              </h3>
              <p className="font-cute text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                {locale === 'zh' ? '当前身份：' : 'Current Role: '}
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {isAdmin ? (locale === 'zh' ? '👑 馆长 (完整读写/Telegram/R2/MCP)' : '👑 Admin') : (locale === 'zh' ? '🌱 游客/旅人 (安全沙盒保护)' : '🌱 Guest')}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        {isAdmin && (
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-white/10 select-none">
            <button
              type="button"
              onClick={() => { playPop(); setAdminTab('settings'); }}
              className={`flex-1 py-2 px-3 rounded-xl font-bubble font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                adminTab === 'settings'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <span>⚙️</span>
              <span>{locale === 'zh' ? '站点全局与权限' : 'Site & Access'}</span>
            </button>

            <button
              type="button"
              onClick={() => { playPop(); setAdminTab('telegram'); }}
              className={`flex-1 py-2 px-3 rounded-xl font-bubble font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
                adminTab === 'telegram'
                  ? 'bg-white dark:bg-neutral-800 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{locale === 'zh' ? 'Telegram 闪念同步' : 'Telegram Bot'}</span>
              {tgConfig?.configured && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => { playPop(); setAdminTab('r2'); }}
              className={`flex-1 py-2 px-3 rounded-xl font-bubble font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
                adminTab === 'r2'
                  ? 'bg-white dark:bg-neutral-800 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{locale === 'zh' ? 'R2 快照' : 'R2'}</span>
              {r2Status?.connected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => { playPop(); setAdminTab('mcp'); }}
              className={`flex-1 py-2 px-3 rounded-xl font-bubble font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
                adminTab === 'mcp'
                  ? 'bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{locale === 'zh' ? 'AI / MCP 网关' : 'MCP Gateway'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="py-2">
          {isAdmin ? (
            <>
              {/* TAB 1: 站点全局与权限控制 */}
              {adminTab === 'settings' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 sm:p-5 rounded-3xl bg-neutral-50/90 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 space-y-4">
                    
                    {/* 1. Telemetry Reset */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-white/10 shadow-3xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bubble font-bold text-neutral-900 dark:text-neutral-100 text-sm flex items-center gap-1.5">
                          <span>📊</span>
                          <span>{locale === 'zh' ? '站点运行时长与访客数据重置' : 'Site Analytics Reset'}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                              triggerAdminToast(locale === 'zh' ? '⚡ 运行时长已重置！' : '⚡ Uptime reset!');
                            }
                          }}
                          className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 font-bubble font-bold text-xs border border-amber-200 dark:border-amber-800/60 shadow-3xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                        >
                          <span>⏱️ 重置时长</span>
                        </button>
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
                              triggerAdminToast(locale === 'zh' ? '👥 访客统计已重置！' : '👥 Visitor stats reset!');
                            }
                          }}
                          className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 dark:hover:bg-pink-900/60 text-pink-900 dark:text-pink-300 font-bubble font-bold text-xs border border-pink-200 dark:border-pink-800/60 shadow-3xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                        >
                          <span>👥 重置访客</span>
                        </button>
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
                              triggerAdminToast(locale === 'zh' ? '🐾 爪印手印计数已清零！' : '🐾 Stamps reset!');
                            }
                          }}
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 font-bubble font-bold text-xs border border-emerald-200 dark:border-emerald-800/60 shadow-3xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                        >
                          <span>🐾 清零爪印</span>
                        </button>
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
                              triggerAdminToast(locale === 'zh' ? '💥 全量数据已重置！' : '💥 All reset!');
                            }
                          }}
                          className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bubble font-bold text-xs shadow-3xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                        >
                          <span>⚡ 全量重置</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Admin Secret Status */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-white/10 shadow-3xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-cute text-neutral-600 dark:text-neutral-300">
                        <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{locale === 'zh' ? '馆长口令已由 Cloudflare 服务端 Secret 统一托管' : 'Admin password is encrypted & managed by Cloudflare Secret'}</span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                        HMAC-SHA256
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: 🤖 Telegram 闪念同步机器人 */}
              {adminTab === 'telegram' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 sm:p-6 rounded-3xl bg-neutral-50/90 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 space-y-5">
                    
                    {/* Bot Status Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-200 dark:border-sky-800/60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shrink-0">
                          <Bot className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bubble font-extrabold text-neutral-900 dark:text-neutral-100 text-base flex items-center gap-2">
                            <span>{locale === 'zh' ? 'Telegram 闪念同步机器人' : 'Telegram Second Brain Bot'}</span>
                            {tgConfig?.botInfo?.username && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono">
                                @{tgConfig.botInfo.username}
                              </span>
                            )}
                          </div>
                          <p className="font-cute text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                            {locale === 'zh' 
                              ? '随时向机器人发送文字、图片或标签，0 延迟自动沉淀为馆长官方笔记。'
                              : 'Send text, photos, or tags to your bot; instantly synced to TagMesh.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bubble font-bold ${
                          tgConfig?.configured 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${tgConfig?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                          <span>{tgConfig?.configured ? (locale === 'zh' ? '已绑定就绪' : 'Connected') : (locale === 'zh' ? '未配置' : 'Not Configured')}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => loadTelegramInfo(true)}
                          disabled={isLoadingTg}
                          className="p-1.5 rounded-xl bg-sky-100/80 dark:bg-sky-950/80 hover:bg-sky-200 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 transition cursor-pointer active:scale-90"
                          title={locale === 'zh' ? '刷新 Telegram 状态' : 'Refresh Telegram status'}
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoadingTg ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Inputs Form */}
                    <div className="space-y-3.5">
                      
                      {/* Input 1: Bot Token */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs sm:text-sm font-bubble font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <span>🔑</span>
                            <span>{locale === 'zh' ? 'Telegram Bot Token (机器人凭据)' : 'Telegram Bot Token'}</span>
                          </label>
                          <span className="text-[11px] font-cute text-neutral-500 dark:text-neutral-400">
                            {locale === 'zh' ? '在 Telegram 搜索 @BotFather 获取' : 'From @BotFather'}
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type={showTgToken ? 'text' : 'password'}
                            value={tgBotToken}
                            onChange={(e) => setTgBotToken(e.target.value)}
                            placeholder={
                              tgConfig?.botTokenMasked 
                                ? (showTgToken ? `已配置: ${tgConfig.botTokenMasked}` : '••••••••••••••••••••••••••••••••')
                                : (locale === 'zh' ? '例如: 7123456789:AAH...' : 'e.g. 7123456789:AAH...')
                            }
                            className="w-full py-2.5 pl-3.5 pr-11 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 text-xs sm:text-sm font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none placeholder:text-neutral-400 shadow-3xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              playPop();
                              setShowTgToken(!showTgToken);
                            }}
                            className="absolute right-2.5 p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition cursor-pointer"
                            title={showTgToken ? (locale === 'zh' ? '隐藏口令' : 'Hide token') : (locale === 'zh' ? '显示明文' : 'Show token')}
                          >
                            {showTgToken ? <EyeOff className="w-4 h-4 text-sky-500" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Input 2: Authorized User ID */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs sm:text-sm font-bubble font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <span>🛡️</span>
                            <span>{locale === 'zh' ? '授权 Telegram 用户 ID (User ID / Chat ID)' : 'Authorized User ID'}</span>
                          </label>
                          <span className="text-[11px] font-cute text-neutral-500 dark:text-neutral-400">
                            {locale === 'zh' ? '在 Telegram 搜索 @userinfobot 获取纯数字 ID' : 'From @userinfobot'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={tgUserIds}
                          onChange={(e) => setTgUserIds(e.target.value)}
                          placeholder={locale === 'zh' ? '例如: 123456789 (多个 ID 用英文逗号隔开)' : 'e.g. 123456789'}
                          className="w-full py-2.5 px-3.5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 text-xs sm:text-sm font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none placeholder:text-neutral-400 shadow-3xs"
                        />
                      </div>

                      {/* Input 3: Webhook URL */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs sm:text-sm font-bubble font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <span>🌐</span>
                            <span>{locale === 'zh' ? 'Webhook 接收端点 URL' : 'Webhook Endpoint URL'}</span>
                          </label>
                          <span className="text-[11px] font-cute text-neutral-500 dark:text-neutral-400">
                            {locale === 'zh' ? '自动生成当前域名接口' : 'Auto-deduced'}
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={tgWebhookUrl}
                            onChange={(e) => setTgWebhookUrl(e.target.value)}
                            placeholder="https://your-domain.workers.dev/api/telegram/webhook"
                            className="w-full py-2.5 pl-3.5 pr-20 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 text-xs sm:text-sm font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none placeholder:text-neutral-400 shadow-3xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              playPop();
                              if (tgWebhookUrl) {
                                navigator.clipboard.writeText(tgWebhookUrl);
                                triggerAdminToast(locale === 'zh' ? '📋 Webhook 链接已复制到剪贴板！' : '📋 Webhook URL copied!');
                              }
                            }}
                            className="absolute right-2 px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-xs font-bubble font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-3xs"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{locale === 'zh' ? '复制' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Input 4: Telegram Default Visibility */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-white/10 shadow-3xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bubble font-bold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm flex items-center gap-1.5">
                            <span>{tgDefaultPublic ? '🌐' : '🔒'}</span>
                            <span>{locale === 'zh' ? 'Telegram 发送内容默认可见性' : 'Telegram Default Visibility'}</span>
                          </div>
                          <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-cute mt-0.5">
                            {locale === 'zh'
                              ? (tgDefaultPublic ? '当前默认：入库后在展厅公开可见（可发 #私密 或 #private 强制私密）' : '当前默认：仅馆长自己可见（可发 #公开 或 #public 强制公开）')
                              : (tgDefaultPublic ? 'Default: Public in gallery (add #private to override)' : 'Default: Private only (add #public to override)')}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-white/10 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              playPop();
                              setTgDefaultPublic(true);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bubble font-bold transition cursor-pointer ${
                              tgDefaultPublic
                                ? 'bg-sky-500 text-white shadow-xs'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            <span>🌐 {locale === 'zh' ? '公开' : 'Public'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playPop();
                              setTgDefaultPublic(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bubble font-bold transition cursor-pointer ${
                              !tgDefaultPublic
                                ? 'bg-neutral-800 dark:bg-neutral-700 text-white shadow-xs'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            <span>🔒 {locale === 'zh' ? '私密' : 'Private'}</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Action Buttons Row */}
                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleSaveTelegramConfig}
                        disabled={isSavingTg}
                        className="px-4 py-2.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bubble font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSavingTg ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>💾</span>}
                        <span>{locale === 'zh' ? '保存配置' : 'Save Config'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSetTelegramWebhook}
                        disabled={isSettingWebhook}
                        className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bubble font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSettingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                        <span>{locale === 'zh' ? '📡 一键注册/激活 Webhook' : '📡 Register Webhook'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleTestTelegramBot}
                        disabled={isTestingTg || !tgConfig?.configured}
                        className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bubble font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isTestingTg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{locale === 'zh' ? '🧪 发送测试消息' : '🧪 Send Test'}</span>
                      </button>

                      {tgConfig?.configured && (
                        <button
                          type="button"
                          onClick={handleDeleteTelegramWebhook}
                          className="px-3 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bubble font-bold text-xs border border-rose-200 dark:border-rose-800 active:scale-95 transition cursor-pointer ml-auto"
                        >
                          <span>🗑️ {locale === 'zh' ? '解除绑定' : 'Unbind'}</span>
                        </button>
                      )}
                    </div>

                    {/* Interactive Bot Commands Cheat Sheet */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-white/10 shadow-3xs space-y-2">
                      <div className="font-bubble font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>{locale === 'zh' ? 'Telegram 机器人智能指令与使用秘籍' : 'Bot Interaction Guide'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-cute text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-white/5 space-y-1">
                          <div className="font-bold text-neutral-900 dark:text-white">📝 随手记与自动标签</div>
                          <div>向机器人直接发任何文字，支持多行；在正文中随手写 <code className="text-rose-500 font-mono">#标签</code> 自动解析为拓扑网。</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-white/5 space-y-1">
                          <div className="font-bold text-neutral-900 dark:text-white">📷 图片与快照入库</div>
                          <div>直接发送照片（可带文字说明），机器人自动抓取原图链接并在笔记中以 Markdown 格式优雅排版。</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-white/5 space-y-1">
                          <div className="font-bold text-neutral-900 dark:text-white">📊 常用快捷指令</div>
                          <div><code className="text-sky-500 font-mono">/status</code> 概览 ｜ <code className="text-sky-500 font-mono">/recent</code> 最近笔记 ｜ <code className="text-sky-500 font-mono">/tags</code> 热门标签</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-white/5 space-y-1">
                          <div className="font-bold text-neutral-900 dark:text-white">🔒 独享鉴权保护</div>
                          <div>仅绑定的 User ID 可以写入笔记；他人向机器人发送信息将被安全拦截。</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: ☁️ Cloudflare R2 云端快照备份 */}
              {adminTab === 'r2' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 sm:p-5 rounded-3xl bg-neutral-50/90 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-100 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-white/10 pb-3">
                      <div className="flex items-center gap-2 font-bubble font-extrabold text-sm sm:text-base text-sky-700 dark:text-sky-300">
                        <Cloud className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        <span>{locale === 'zh' ? 'Cloudflare R2 云端快照与备份时光机' : 'R2 Cloud Snapshots'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bubble font-bold ${
                          r2Status?.connected ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${r2Status?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`}></span>
                          <span>{r2Status?.connected ? (r2Status.bucketName || 'tagmesh-bucket') : (locale === 'zh' ? '未连接' : 'Disconnected')}</span>
                        </span>
                        <button
                          type="button"
                          onClick={loadR2Info}
                          disabled={isLoadingR2}
                          className="p-1 text-sky-600 dark:text-sky-400 hover:text-sky-800 transition cursor-pointer"
                          title="Refresh R2"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingR2 ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <p className="font-cute text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {locale === 'zh'
                        ? 'R2 专属存储桶提供全库云端快照备份与 Markdown 插图零出口流量费托管，数据永久安全无虞。'
                        : 'R2 bucket active: Zero-egress screenshot hosting & full database snapshot backups.'}
                    </p>

                    <button
                      type="button"
                      onClick={handleCreateBackup}
                      disabled={isBackingUp}
                      className="w-full p-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bubble font-bold text-xs sm:text-sm shadow-3xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      <span>{isBackingUp ? (locale === 'zh' ? '打包上传快照中...' : 'Backing up...') : (locale === 'zh' ? '📦 立即创建全库云端快照' : '📦 Create R2 Snapshot')}</span>
                    </button>

                    {/* Snapshots List */}
                    <div className="pt-2 border-t border-neutral-200/80 dark:border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bubble font-bold text-neutral-800 dark:text-neutral-200">
                        <span>{locale === 'zh' ? '历史快照时光机' : 'Snapshot History'}</span>
                        <span>({backupsList.length})</span>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                        {backupsList.length === 0 ? (
                          <p className="text-center py-6 text-xs font-cute text-neutral-400 dark:text-neutral-500">
                            {locale === 'zh' ? '暂无云端快照，点击上方按钮即可创建第一份备份。' : 'No snapshots yet. Click above to create one.'}
                          </p>
                        ) : (
                          backupsList.map((bk) => {
                            const noteCount = bk.customMetadata?.totalNotes;
                            const dateStr = new Date(bk.uploaded).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US');
                            const isRestoring = isRestoringKey === bk.key;

                            return (
                              <div key={bk.key} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 text-xs shadow-3xs">
                                <div className="min-w-0 pr-2">
                                  <div className="font-mono font-bold text-neutral-800 dark:text-neutral-100 truncate text-xs">
                                    📑 {bk.key.replace('backups/', '')}
                                  </div>
                                  <div className="font-cute text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {dateStr} {noteCount ? `• ${noteCount} 篇` : ''} • {(bk.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  disabled={isRestoring}
                                  onClick={() => handleRestoreBackup(bk.key)}
                                  className="px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bubble font-bold text-xs shrink-0 transition active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                  {isRestoring ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <span>{locale === 'zh' ? '恢复' : 'Restore'}</span>
                                  )}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: 🤖 TagMesh AI 原生 MCP 网关 */}
              {adminTab === 'mcp' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 sm:p-5 rounded-3xl bg-neutral-50/90 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 text-neutral-800 dark:text-neutral-100 space-y-4 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-white/10 pb-3">
                      <div className="flex items-center gap-2 font-bubble font-extrabold text-sm sm:text-base text-purple-700 dark:text-purple-300">
                        <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span>{locale === 'zh' ? 'TagMesh AI 原生 MCP 网关' : 'AI-Native MCP Gateway'}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bubble font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>JSON-RPC 2.0 / Streamable HTTP</span>
                      </span>
                    </div>

                    <p className="font-cute text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {locale === 'zh'
                        ? 'TagMesh 原生实现 Model Context Protocol (MCP) 标准协议。Claude Desktop、Cursor、Windsurf、Cline 及各类 AI Agent 可直接通过该网关读写笔记库、查询标签网与检索闪念。'
                        : 'Built-in Model Context Protocol (MCP) server for Claude Desktop, Cursor, Windsurf, Cline, and AI agents.'}
                    </p>

                    {/* Gateway Endpoint & Token Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 shadow-3xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bubble font-bold text-neutral-500 dark:text-neutral-400">
                          <span>🌐 {locale === 'zh' ? 'MCP 服务地址' : 'MCP Endpoint'}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(`${typeof window !== 'undefined' ? window.location.origin : ''}/mcp`, 'MCP URL')}
                            className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bubble"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{locale === 'zh' ? '复制' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="font-mono text-xs text-neutral-900 dark:text-neutral-100 truncate font-semibold">
                          {typeof window !== 'undefined' ? `${window.location.origin}/mcp` : '/mcp'}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 shadow-3xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bubble font-bold text-neutral-500 dark:text-neutral-400">
                          <span>🔑 {locale === 'zh' ? 'Bearer Auth Token' : 'Bearer Auth Token'}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(getAuthToken() || '<ADMIN_PASSWORD_OR_MCP_TOKEN>', 'MCP Bearer Token')}
                            className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bubble"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{locale === 'zh' ? '复制' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="font-mono text-xs text-neutral-900 dark:text-neutral-100 truncate font-semibold">
                          {getAuthToken() ? `${getAuthToken()?.slice(0, 16)}...` : '<ADMIN_PASSWORD_OR_MCP_TOKEN>'}
                        </div>
                      </div>
                    </div>

                    {/* Live Test Button */}
                    <button
                      type="button"
                      disabled={isTestingMcp}
                      onClick={handleTestMcp}
                      className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bubble font-bold text-xs sm:text-sm shadow-3xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isTestingMcp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
                      <span>{isTestingMcp ? (locale === 'zh' ? '正在连接测试 MCP 网关...' : 'Testing connection...') : (locale === 'zh' ? '⚡ 实时测试 MCP 连通性 (List Tools)' : '⚡ Test MCP Connection')}</span>
                    </button>

                    {/* Test Result Display */}
                    {mcpTestResult && (
                      <div className={`p-3 rounded-2xl border text-xs font-cute animate-in fade-in space-y-1.5 ${
                        mcpTestResult.success 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                      }`}>
                        <div className="flex items-center justify-between font-bubble font-bold">
                          <span className="flex items-center gap-1.5">
                            {mcpTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                            <span>{mcpTestResult.success ? (locale === 'zh' ? '网关通信正常 (Online)' : 'MCP Online') : (locale === 'zh' ? '通信测试失败' : 'MCP Error')}</span>
                          </span>
                          {mcpTestResult.success && (
                            <span className="font-mono text-[11px] bg-emerald-200/60 dark:bg-emerald-900 px-2 py-0.5 rounded-full">
                              {mcpTestResult.latencyMs}ms
                            </span>
                          )}
                        </div>
                        {mcpTestResult.success ? (
                          <div className="text-[11px] space-y-1">
                            <p>{locale === 'zh' ? `已成功发现 ${mcpTestResult.toolsCount} 个核心工具：` : `Discovered ${mcpTestResult.toolsCount} tools:`}</p>
                            <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                              {mcpTestResult.tools.map((t) => (
                                <span key={t} className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] font-mono">{mcpTestResult.error}</p>
                        )}
                      </div>
                    )}

                    {/* One-Click Agent Config Switcher & Code Box */}
                    <div className="pt-2 border-t border-neutral-200/80 dark:border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bubble font-bold text-neutral-800 dark:text-neutral-200">
                          🤖 {locale === 'zh' ? '一键接入各大 AI Agent 客户端' : 'One-Click AI Agent Exporter'}
                        </span>
                        <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                          Copy & Paste
                        </span>
                      </div>

                      {/* Client Pills */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {[
                          { id: 'claude', label: 'Claude Desktop', icon: '🟣' },
                          { id: 'cursor', label: 'Cursor', icon: '⚡' },
                          { id: 'windsurf', label: 'Windsurf', icon: '🌊' },
                          { id: 'cline', label: 'Cline/Roo', icon: '🤖' },
                          { id: 'agy', label: 'Antigravity', icon: '🚀' },
                          { id: 'curl', label: 'cURL / Shell', icon: '💻' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => { playSoftTick(); setMcpClientType(item.id as any); }}
                            className={`p-2 rounded-xl text-xs font-bubble font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                              mcpClientType === item.id
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white dark:bg-neutral-800 hover:bg-purple-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-white/10'
                            }`}
                          >
                            <span>{item.icon}</span>
                            <span className="text-[10px] truncate w-full text-center">{item.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Config Code Box */}
                      <div className="p-3 rounded-2xl bg-neutral-900 text-neutral-100 font-mono text-xs space-y-2 relative border border-neutral-800 shadow-inner">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800 pb-1.5">
                          <span className="font-bubble">
                            {mcpClientType === 'claude' && '📁 claude_desktop_config.json'}
                            {mcpClientType === 'cursor' && '📁 .cursor/mcp.json'}
                            {mcpClientType === 'windsurf' && '📁 ~/.codeium/windsurf/mcp_config.json'}
                            {mcpClientType === 'cline' && '📁 cline_mcp_settings.json'}
                            {mcpClientType === 'agy' && '🚀 Antigravity CLI / Sidecar'}
                            {mcpClientType === 'curl' && '💻 Terminal cURL Command'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(getMcpSnippet(mcpClientType), `${mcpClientType} config`)}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bubble font-bold text-[11px] flex items-center gap-1 transition active:scale-95 cursor-pointer border border-purple-500/30"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{locale === 'zh' ? '一键复制' : 'Copy'}</span>
                          </button>
                        </div>

                        <pre className="overflow-x-auto custom-scrollbar max-h-48 text-[11px] text-emerald-300/90 leading-relaxed select-all">
                          {getMcpSnippet(mcpClientType)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Admin Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm leading-relaxed">
                <span className="font-bold block mb-1">👑 馆长私人工作台：</span>
                {locale === 'zh'
                  ? '工作台为馆长私人创作空间。验证口令登录后，可管理公开/私密笔记、配置 Telegram 闪念同步与导出 AI Agent MCP 接口。'
                  : 'Workspace is the curator space. Sign in with password to manage public/private notes, Telegram sync, and export MCP gateway.'}
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-2 text-xs sm:text-sm">
                  {locale === 'zh' ? '输入馆长口令' : 'Enter Admin Password'}
                </label>
                <div className="flex items-center gap-2.5 px-4 h-12 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 shadow-inner">
                  <KeyRound className="w-5 h-5 text-amber-500 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={locale === 'zh' ? '请输入管理员口令 (ADMIN_PASSWORD)' : 'Enter admin password'}
                    className="w-full bg-transparent text-sm sm:text-base font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none placeholder:text-neutral-400"
                    autoFocus
                  />
                </div>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-cute mt-1.5 block">
                  {locale === 'zh' ? '💡 请输入 Cloudflare 环境变量中配置的 ADMIN_PASSWORD' : '💡 Enter the ADMIN_PASSWORD configured in Cloudflare environment'}
                </span>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bubble font-bold text-sm sm:text-base border-2 border-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{locale === 'zh' ? '👑 验证并解锁馆长身份' : '👑 Authenticate as Admin'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-amber-900/10 dark:border-white/10 flex items-center justify-between">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                playPop();
                logoutToGuest();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-white/10 font-bubble font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>{locale === 'zh' ? '🔒 退出馆长登录' : '🔒 Sign Out Admin'}</span>
            </button>
          ) : (
            <span className="text-xs text-neutral-400 font-cute">
              {locale === 'zh' ? '未登录状态' : 'Not signed in'}
            </span>
          )}

          <button
            type="button"
            onClick={closeAuthModal}
            className="px-6 py-2 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bubble font-bold text-xs sm:text-sm border border-neutral-200/80 dark:border-white/10 transition cursor-pointer shadow-xs active:scale-95"
          >
            {locale === 'zh' ? '完成并关闭' : 'Done & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
