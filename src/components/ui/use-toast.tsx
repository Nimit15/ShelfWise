"use client";

import { createContext, useContext, useState, useEffect } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

const ToastContext = createContext<{
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}>({ toasts: [], addToast: () => {}, dismissToast: () => {} });

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function Toaster() {
  const { toasts, dismissToast } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto block w-full max-w-sm rounded-md border p-4 shadow-lg ${
            toast.variant === "destructive"
              ? "border-[var(--ca-accent-red)] bg-[var(--ca-accent-red)]/10 text-[var(--ca-accent-red)]"
              : "border-[var(--ca-border)] bg-[var(--ca-cream)] text-[var(--ca-text-primary)]"
          }`}
        >
          {toast.title && <div className="font-semibold">{toast.title}</div>}
          {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
          <button
            onClick={() => dismissToast(toast.id)}
            className="absolute right-1 top-1 text-xs opacity-50 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
