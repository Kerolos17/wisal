"use client";

// Toast primitive: calm, auto-dismissing status messages for the ops screens.
// Portal-rendered stack at the bottom-start corner; role="status" so screen
// readers announce politely. Queue lives in one provider at the app root.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ToastTone = "info" | "success" | "error";
type ToastItem = { id: number; message: string; tone: ToastTone };

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

export function useToast() {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast must be used inside <ToastProvider>");
  return push;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = "info") => {
    const id = ++nextId.current;
    setItems((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3400);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" && createPortal(
        <div className="ui-toast-stack" aria-live="polite">
          {items.map((item) => (
            <div key={item.id} className={`ui-toast ui-toast-${item.tone}`} role="status">{item.message}</div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
