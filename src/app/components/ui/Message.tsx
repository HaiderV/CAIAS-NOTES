import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface MessageProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number; // duration in ms, default 4000
}

export default function Message({ type, message, isOpen, onClose, duration = 4000 }: MessageProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const config = {
    success: {
      bg: "bg-emerald-50/95 dark:bg-emerald-950/40",
      border: "border-emerald-200/80 dark:border-emerald-800/80",
      text: "text-emerald-900 dark:text-emerald-100",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      progress: "bg-emerald-500 dark:bg-emerald-400",
    },
    error: {
      bg: "bg-rose-50/95 dark:bg-rose-950/40",
      border: "border-rose-200/80 dark:border-rose-800/80",
      text: "text-rose-900 dark:text-rose-100",
      icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
      progress: "bg-rose-500 dark:bg-rose-400",
    },
    warning: {
      bg: "bg-amber-50/95 dark:bg-amber-950/40",
      border: "border-amber-200/80 dark:border-amber-800/80",
      text: "text-amber-900 dark:text-amber-100",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
      progress: "bg-amber-500 dark:bg-amber-400",
    },
    info: {
      bg: "bg-blue-50/95 dark:bg-blue-950/40",
      border: "border-blue-200/80 dark:border-blue-800/80",
      text: "text-blue-900 dark:text-blue-100",
      icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
      progress: "bg-blue-500 dark:bg-blue-400",
    },
  };

  const current = config[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4 sm:bottom-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.15 } }}
            className={`pointer-events-auto relative flex items-center gap-3.5 px-4 py-3.5 w-full max-w-md rounded-xl border shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-md overflow-hidden ${current.bg} ${current.border}`}
          >
            {current.icon}

            <div className="flex-1 text-[14px] font-medium leading-5 pr-2">
              <span className={current.text}>{message}</span>
            </div>

            <button
              onClick={onClose}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-500/10 p-1.5 rounded-lg transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>

            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-[3px] ${current.progress}`}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
