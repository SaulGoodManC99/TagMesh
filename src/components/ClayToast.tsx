import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  AlertOctagon, 
  Sparkles, 
  X,
  ArrowRight
} from 'lucide-react';
import { useClayTheme } from '../blog/utils/clayThemes';
import { playPop, playSoftTick } from '../blog/utils/soundEffects';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
  icon?: React.ReactNode;
  action?: ToastAction;
  sound?: boolean;
}

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  icon?: React.ReactNode;
  duration: number;
  action?: ToastAction;
  createdAt: number;
}

const TOAST_EVENT_NAME = 'tagmesh_unified_toast';
const TOAST_DISMISS_EVENT = 'tagmesh_dismiss_toast';

/**
 * Global Dispatcher for Toasts (Usable anywhere in the app)
 */
export const toast = {
  show: (
    message: string, 
    type: ToastType = 'info', 
    options: ToastOptions = {}
  ) => {
    if (typeof window === 'undefined') return;
    const detail: ToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message,
      type,
      title: options.title,
      duration: options.duration || (type === 'error' ? 4500 : 3500),
      icon: options.icon,
      action: options.action,
      createdAt: Date.now(),
    };
    window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail }));
    return detail.id;
  },

  success: (message: string, title?: string, duration?: number, options?: Omit<ToastOptions, 'title' | 'duration'>) => {
    return toast.show(message, 'success', { title, duration, ...options });
  },

  info: (message: string, title?: string, duration?: number, options?: Omit<ToastOptions, 'title' | 'duration'>) => {
    return toast.show(message, 'info', { title, duration, ...options });
  },

  warning: (message: string, title?: string, duration?: number, options?: Omit<ToastOptions, 'title' | 'duration'>) => {
    return toast.show(message, 'warning', { title, duration, ...options });
  },

  error: (message: string, title?: string, duration?: number, options?: Omit<ToastOptions, 'title' | 'duration'>) => {
    return toast.show(message, 'error', { title, duration, ...options });
  },

  dismiss: (id?: string) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(TOAST_DISMISS_EVENT, { detail: { id } }));
  },
};

/**
 * Single Animated Toast Capsule Item with Hover-Pause & Countdown
 */
const ToastCard: React.FC<{
  item: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ item, onDismiss }) => {
  const { theme } = useClayTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const elapsedRef = useRef<number>(0);
  const totalDuration = item.duration;

  // Countdown timer with pause-on-hover logic
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const updateTimer = (currentTime: number) => {
      if (!isHovered) {
        const delta = currentTime - lastTime;
        elapsedRef.current += delta;
        const remaining = Math.max(0, totalDuration - elapsedRef.current);
        const percent = (remaining / totalDuration) * 100;
        setProgress(percent);

        if (remaining <= 0) {
          onDismiss(item.id);
          return;
        }
      }
      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [item.id, totalDuration, isHovered, onDismiss]);

  const getTypeStyles = () => {
    switch (item.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 animate-in zoom-in duration-300" />,
          badge: 'SUCCESS',
          badgeStyle: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          accentBg: 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
          glow: 'rgba(16, 185, 129, 0.28)',
          progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
          ring: 'ring-emerald-500/20',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 animate-in zoom-in duration-300" />,
          badge: 'WARNING',
          badgeStyle: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          accentBg: 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-300 border-amber-500/30',
          glow: 'rgba(245, 158, 11, 0.28)',
          progressBar: 'bg-gradient-to-r from-amber-500 to-orange-400',
          ring: 'ring-amber-500/20',
        };
      case 'error':
        return {
          icon: <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 animate-in zoom-in duration-300" />,
          badge: 'ERROR',
          badgeStyle: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          accentBg: 'bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-pink-500/5 text-rose-600 dark:text-rose-300 border-rose-500/30',
          glow: 'rgba(244, 63, 94, 0.28)',
          progressBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
          ring: 'ring-rose-500/20',
        };
      case 'info':
      default:
        return {
          icon: <Sparkles className="w-5 h-5 text-sky-500 shrink-0 animate-in zoom-in duration-300" />,
          badge: 'INFO',
          badgeStyle: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
          accentBg: 'bg-gradient-to-br from-sky-500/20 via-sky-500/10 to-indigo-500/5 text-sky-600 dark:text-sky-300 border-sky-500/30',
          glow: 'rgba(14, 165, 233, 0.28)',
          progressBar: 'bg-gradient-to-r from-sky-500 to-indigo-400',
          ring: 'ring-sky-500/20',
        };
    }
  };

  const typeConfig = getTypeStyles();

  return (
    <motion.div
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 300) {
          playSoftTick();
          onDismiss(item.id);
        }
      }}
      initial={{ opacity: 0, y: -16, scale: 0.92, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.88, y: -12, filter: 'blur(4px)', transition: { duration: 0.18, ease: 'easeOut' } }}
      transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.7 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-no-global-btn="true"
      style={{
        boxShadow: `0 14px 40px -10px rgba(0, 0, 0, 0.22), 0 0 24px -4px ${typeConfig.glow}`,
      }}
      className={`pointer-events-auto w-full max-w-[calc(100vw-28px)] sm:max-w-[390px] rounded-[22px] bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl border-2 border-white/90 dark:border-white/10 shadow-2xl overflow-hidden group select-none transition-shadow duration-300 relative ring-1 ${typeConfig.ring}`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Semantic Icon Badge */}
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border shrink-0 ${typeConfig.accentBg} shadow-2xs mt-0.5`}>
          {item.icon || typeConfig.icon}
        </div>

        {/* Message Content */}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${typeConfig.badgeStyle}`}>
              {typeConfig.badge}
            </span>
            {item.title && (
              <h4 className="font-bubble font-extrabold text-xs sm:text-[13px] text-neutral-900 dark:text-neutral-100 truncate leading-snug">
                {item.title}
              </h4>
            )}
          </div>
          
          <p className={`font-cute text-xs sm:text-[12.5px] text-neutral-700 dark:text-neutral-200 leading-relaxed break-words`}>
            {item.message}
          </p>

          {/* Optional Action Button */}
          {item.action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playPop(650);
                  item.action?.onClick();
                  onDismiss(item.id);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bubble font-bold text-white bg-gradient-to-r ${theme.primaryGradient} shadow-xs hover:shadow-md active:scale-95 transition cursor-pointer`}
              >
                <span>{item.action.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Manual Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playSoftTick();
            onDismiss(item.id);
          }}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer shrink-0 mt-0.5 active:scale-90"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Countdown Visual Progress Bar (Pauses on Hover) */}
      <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800/80 overflow-hidden">
        <div 
          className={`h-full ${typeConfig.progressBar} transition-[width] duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

/**
 * Top-Right Global Toast Container with Smart Stack & Responsive Margins
 */
export const ClayToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleAddToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        const newToast = customEvent.detail;
        setToasts((prev) => {
          // Prevent duplicate toasts with the exact same message within 800ms
          const isDuplicate = prev.some(
            t => t.message === newToast.message && (newToast.createdAt - t.createdAt) < 800
          );
          if (isDuplicate) return prev;

          const type = newToast.type;
          const pitch = type === 'success' ? 680 : type === 'error' ? 380 : type === 'warning' ? 480 : 580;
          playPop(pitch);

          // Keep at most 3 stacked toasts to prevent screen crowding
          const updated = [...prev, newToast];
          return updated.slice(-3);
        });
      }
    };

    const handleDismissToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ id?: string }>;
      if (customEvent.detail?.id) {
        setToasts((prev) => prev.filter((t) => t.id !== customEvent.detail.id));
      } else {
        setToasts([]);
      }
    };

    window.addEventListener(TOAST_EVENT_NAME, handleAddToast);
    window.addEventListener(TOAST_DISMISS_EVENT, handleDismissToast);
    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handleAddToast);
      window.removeEventListener(TOAST_DISMISS_EVENT, handleDismissToast);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      data-no-global-btn="true"
      className="fixed top-20 sm:top-[76px] right-3 sm:right-6 md:right-8 z-[9999] flex flex-col items-center sm:items-end gap-2.5 pointer-events-none w-auto max-w-[calc(100vw-24px)] sm:max-w-[400px]"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={handleDismiss} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};
