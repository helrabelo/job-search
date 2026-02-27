"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  type?: "success" | "error" | "info";
  duration?: number;
  action?: ToastAction;
}

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  duration: number;
  action?: ToastAction;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, opts?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const MAX_VISIBLE = 3;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastMessage({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const bgColor =
    item.type === "success"
      ? "bg-green-800 text-green-50"
      : item.type === "error"
        ? "bg-red-800 text-red-50"
        : "bg-neutral-800 text-neutral-50";

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 ${bgColor} ${
        item.exiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100"
      }`}
    >
      <span className="text-sm">{item.message}</span>
      {item.action && (
        <button
          onClick={() => {
            item.action!.onClick();
            onDismiss();
          }}
          className="shrink-0 rounded-md bg-white/20 px-2.5 py-1 text-xs font-semibold hover:bg-white/30"
        >
          {item.action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        className="ml-1 shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback(
    (message: string, opts?: ToastOptions) => {
      const id = nextId++;
      const duration = opts?.duration ?? (opts?.action ? 8000 : 5000);
      const item: ToastItem = {
        id,
        message,
        type: opts?.type ?? "info",
        duration,
        action: opts?.action,
      };

      setToasts((prev) => {
        const next = [...prev, item];
        return next.slice(-MAX_VISIBLE);
      });

      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const portal =
    typeof window !== "undefined"
      ? createPortal(
          <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map((t) => (
              <ToastMessage key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {portal}
    </ToastContext.Provider>
  );
}
