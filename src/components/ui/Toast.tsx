"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const ToastContext = createContext<{ show: (message: string) => void }>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMessage(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 1000);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div role="status" className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg">{message}</div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
