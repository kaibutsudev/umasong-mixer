"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogTitle = DialogPrimitive.Title;

const DialogDescription = DialogPrimitive.Description;

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "warning" | "error";
}

const DynamicAlert = ({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = "Got it",
  onAction,
  variant = "warning",
}: DialogProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "error":
        return {
          icon: (
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 text-2xl animate-pulse">
              🚨
            </div>
          ),
          button: "bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]",
          border: "border-red-500/30",
        };
      case "warning":
      default:
        return {
          icon: (
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4 text-2xl animate-bounce">
              ⚠️
            </div>
          ),
          button: "bg-yellow-500 hover:bg-yellow-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]",
          border: "border-yellow-500/30",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPortal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-[#1a1a2e] p-6 rounded-2xl border ${styles.border} shadow-2xl overflow-hidden`}
              >
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col items-center text-center">
                  {styles.icon}
                  
                  <DialogTitle className="text-xl font-bold text-white mb-2 tracking-wide">
                    {title}
                  </DialogTitle>
                  
                  <DialogDescription className="text-gray-300 mb-6 leading-relaxed">
                    {description}
                  </DialogDescription>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => {
                        onAction?.();
                        onOpenChange(false);
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all active:scale-95 ${styles.button}`}
                    >
                      {actionLabel}
                    </button>
                    {onAction && (
                       <button
                       onClick={() => onOpenChange(false)}
                       className="flex-1 py-2.5 px-4 rounded-xl font-medium bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
                     >
                       Cancel
                     </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export { DynamicAlert };
