"use client";

import { useEffect, useState } from "react";
import { addListener, type Toast } from "@/hooks/use-toast";

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = addListener((toast) => {
      setToasts((prev) => [...prev, toast]);
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    });

    return unsubscribe;
  }, []);

  const dismiss = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            relative max-w-sm w-full rounded-md shadow-lg p-4 
            ${toast.variant === "destructive" ? "bg-destructive text-destructive-foreground" : "bg-card text-card-foreground border border-border"}
          `}
        >
          {toast.title && <div className="font-semibold">{toast.title}</div>}
          {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
          <button
            onClick={() => dismiss(toast.id)}
            className="absolute top-2 right-2 opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
