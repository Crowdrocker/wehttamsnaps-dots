import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++_id;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const ok   = useCallback((msg: string) => addToast(msg, "success"), [addToast]);
  const err  = useCallback((msg: string) => addToast(msg, "error"),   [addToast]);
  const info = useCallback((msg: string) => addToast(msg, "info"),    [addToast]);

  return { toasts, ok, err, info };
}
