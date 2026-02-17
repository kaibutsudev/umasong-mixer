"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import { useToast } from "@/components/ui/Toast";

// --------------------------------------------------------
// Dialog Components (Inlined or Imported - reusing Primitive)
// --------------------------------------------------------
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogTitle = DialogPrimitive.Title;
// const DialogDescription = DialogPrimitive.Description;

interface ShareCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songName: string;
  coverUrl: string;
  singers: { name: string; image: string; color: string }[];
  accentColor?: string;
}

export function ShareCard({
  open,
  onOpenChange,
  songName,
  coverUrl,
  singers,
  accentColor = "#FFD700",
}: ShareCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      // Small timeout to allow render
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2, // Retina quality
        backgroundColor: null,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `umasong-mix-${songName.replace(/\s+/g, "-")}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast({
          title: "Image Saved",
          description: "Your mix card has been downloaded!",
          variant: "success",
        });
      }
    } catch (err) {
      console.error("Failed to generate image", err);
      toast({
        title: "Download Failed",
        description: "Could not generate image.",
        variant: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-4 flex flex-col items-center gap-6 outline-none"
              >
                {/* Title */}
                <DialogTitle className="text-2xl font-bold text-white text-center">
                  Share Your Mix
                </DialogTitle>

                {/* THE CARD TO CAPTURE */}
                <div
                  ref={cardRef}
                  className="relative w-[320px] h-[568px] overflow-hidden rounded-2xl shadow-2xl bg-[#1a1a2e] flex flex-col text-white"
                >
                  {/* Background / Glow */}
                  <div
                    className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_var(--accent),_transparent_70%)]"
                    style={{ "--accent": accentColor } as React.CSSProperties}
                  />

                  {/* Top: Song Info */}
                  <div className="relative z-10 p-6 flex flex-col items-center gap-4 mt-8">
                    <img
                      src={coverUrl}
                      alt={songName}
                      className="w-40 h-40 rounded-full border-4 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      crossOrigin="anonymous"
                    />
                    <div className="text-center">
                      <h3 className="text-2xl font-black uppercase tracking-wider drop-shadow-md">
                        {songName}
                      </h3>
                      <p className="text-sm text-white/60 font-medium">
                        Umasong Mixer
                      </p>
                    </div>
                  </div>

                  {/* Middle: Equalizer Visual (Fake) */}
                  <div className="flex-1 flex items-center justify-center gap-1.5 px-8 opacity-50">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 rounded-full bg-white/40"
                        style={{
                          height: `${Math.random() * 40 + 20}%`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Bottom: Team */}
                  <div className="relative z-10 bg-black/40 backdrop-blur-sm p-4 w-full">
                    <p className="text-xs uppercase tracking-widest text-center text-white/50 mb-3">
                      Performance Team
                    </p>
                    <div className="flex justify-center gap-3">
                      {singers.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center gap-1"
                        >
                          <div
                            className="w-12 h-12 rounded-full border-2 overflow-hidden bg-black"
                            style={{ borderColor: s.color }}
                          >
                            <img
                              src={s.image}
                              alt={s.name}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-white/80 max-w-[60px] truncate">
                            {s.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Watermark */}
                  <div className="absolute top-4 right-4 text-[10px] font-mono text-white/30 rotate-90 origin-top-right">
                    NON-COMMERCIAL / FAN MADE
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 w-full justify-center">
                  <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGenerating ? "Generating..." : "Download Card"} 📥
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: "Link Copied!",
                        description: "Share this link with your friends.",
                        variant: "success",
                      });
                    }}
                    className="bg-white/10 text-white px-6 py-3 rounded-full font-bold backdrop-blur-sm hover:bg-white/20 transition-colors border border-white/10"
                  >
                    Copy Link 🔗
                  </button>
                </div>

                <button
                  onClick={() => onOpenChange(false)}
                  className="text-white/50 hover:text-white text-sm"
                >
                  Close
                </button>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  );

}
