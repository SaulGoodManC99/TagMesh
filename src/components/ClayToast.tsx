import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  X 
} from 'lucide-react';
import { useClayTheme } from '../blog/utils/clayThemes';
import { playPop, playSoftTick } from '../blog/utils/soundEffects';
import { SPRING_MODAL } from '../blog/utils/motionSystem';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type?: ToastType;
  icon?: React.ReactNode;
  duration?: number;
}

const TOAST_EVENT_NAME = 'tagmesh_unified_toast';

/**
 * Global Dispatcher for Toasts (Usable anywhere in the app)
 */
export const toast = {
  show: (
    message: string, 
    type: ToastType = 'info', 
    options: { title?: string; duration?: number; icon?: React.ReactNode } = {}
  ) => {
    if (typeof window === 'undefined') return;
    const detail: ToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message,
      type,
      title: options.title,
      duration: options.duration || 3200,
      icon: options.icon,
    };
    window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail }));
  },

  success: (message: string, title?: string, duration?: number) => {
    toast.show(message, 'success', { title, duration });
  },

  info: (message: string, title?: string, duration?: number) => {
    toast.show(message, 'info', { title, duration });
  },

  warning: (message: string, title?: string, duration?: number) => {
    toast.show(message, 'warning', { title, duration });
  },

  error: (message: string, title?: string, duration?: number) => {
    toast.show(message, 'error', { title, duration });
  },
};

/**
 * Single Animated Toast Capsule Item
 */
const ToastCard: React.FC<{
  item: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ item, onDismiss }) => {
  const { theme } = useClayTheme();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, item.duration || 3200);

    return () => clearTimeout(timer);
  }, [item.id, item.duration, isHovered, onDismiss]);

  const getTypeStyles = () => {
    switch (item.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
          glow: 'rgba(16, 185, 129, 0.25)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20',
          glow: 'rgba(245, 158, 11, 0.25)',
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20',
          glow: 'rgba(244, 63, 94, 0.25)',
        };
      case 'info':
      default:
        return {
          icon: <Sparkles className="w-5 h-5 text-sky-500 shrink-0" />,
          accentBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20',
          glow: 'rgba(14, 165, 233, 0.25)',
        };
    }
  };

  const typeConfig = getTypeStyles();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -32, scale: 0.92, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -24, scale: 0.94, filter: 'blur(2px)', transition: { duration: 0.18 } }}
      transition={SPRING_MODAL}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: `${theme.headerBg}f4`,
        boxShadow: `0 12px 36px -8px rgba(0, 0, 0, 0.25), 0 0 16px ${typeConfig.glow}`,
      }}
      className="pointer-events-auto w-full max-w-[calc(100vw-24px)] sm:max-w-md p-3.5 sm:p-4 rounded-[24px] backdrop-blur-2xl border border-white/60 dark:border-white/10 flex items-center justify-between gap-3 shadow-xl clay-card group select-none transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Semantic Icon Badge */}
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border shrink-0 ${typeConfig.accentBg} shadow-3xs`}>
          {item.icon || typeConfig.icon}
        </div>

        {/* Message Content */}
        <div className="min-w-0 flex-1">
          {item.title && (
            <h4 className="font-bubble font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate leading-snug">
              {item.title}
            </h4>
          )}
          <p className={`font-cute text-xs sm:text-[13px] text-neutral-700 dark:text-neutral-200 leading-snug break-words ${item.title ? 'mt-0.5' : 'font-bold'}`}>
            {item.message}
          </p>
        </div>
      </div>

      {/* Manual Dismiss Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          playSoftTick();
          onDismiss(item.id);
        }}
        className="w-7 h-7 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
        title="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

/**
 * Top-Left Clay Toast Container (Placed below Header top-20 without overlapping header bar)
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
        playPop(580);
        setToasts((prev) => {
          // Keep at most 4 stacked toasts to prevent screen overflow
          const updated = [...prev, customEvent.detail];
          return updated.slice(-4);
        });
      }
    };

    window.addEventListener(TOAST_EVENT_NAME, handleAddToast);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handleAddToast);
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed top-20 left-3 sm:left-6 z-[9999] flex flex-col items-start gap-2.5 pointer-events-none w-auto max-w-[calc(100vw-24px)] sm:max-w-md">
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={handleDismiss} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};
