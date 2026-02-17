"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { AnimatePresence, motion } from "framer-motion";

// Custom Toast System context
const ToastContext = React.createContext<{
  toast: (props: { title: string; description?: string; variant?: "default" | "success" | "error" }) => void;
} | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [content, setContent] = React.useState<{
    title: string;
    description?: string;
    variant?: "default" | "success" | "error";
  } | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout>();

  const toast = React.useCallback(
    ({ title, description, variant = "default" }: { title: string; description?: string; variant?: "default" | "success" | "error" }) => {
      setOpen(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      
      // Small delay to allow re-triggering animation if spamming
      setTimeout(() => {
        setContent({ title, description, variant });
        setOpen(true);
        timerRef.current = setTimeout(() => setOpen(false), 3000);
      }, 100);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        
        <AnimatePresence>
          {open && content && (
            <ToastPrimitive.Root forceMount asChild onOpenChange={setOpen}>
              <motion.div
                layout
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`fixed bottom-4 right-4 z-[2000] flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 ${
                  content.variant === "success" 
                    ? "bg-green-500/20 text-green-100" 
                    : content.variant === "error" 
                    ? "bg-red-500/20 text-red-100" 
                    : "bg-[#1a1a2e]/90 text-white"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <ToastPrimitive.Title className="font-bold text-sm">
                    {content.variant === "success" ? "✨ " : content.variant === "error" ? "🚨 " : "ℹ️ "}
                    {content.title}
                  </ToastPrimitive.Title>
                  {content.description && (
                    <ToastPrimitive.Description className="text-xs opacity-80">
                      {content.description}
                    </ToastPrimitive.Description>
                  )}
                </div>
              </motion.div>
            </ToastPrimitive.Root>
          )}
        </AnimatePresence>

        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 flex flex-col p-6 gap-2 w-[390px] max-w-[100vw] m-0 list-none z-[2000] outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
