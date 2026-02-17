import { Maximize2 } from "lucide-react";

interface SongMixerHeaderProps {
  title: string;
  onBack: () => void;
  onShare?: () => void;
  onToggleZen?: () => void;
}

export function SongMixerHeader({
  title,
  onBack,
  onShare,
  onToggleZen,
}: SongMixerHeaderProps) {
  return (
    <header className="relative z-50 px-6 py-4 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/5 shadow-lg shrink-0">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-sm font-medium group backdrop-blur-sm border border-white/5"
      >
        <span className="group-hover:-translate-x-1 transition-transform">
          ←
        </span>
        Back to Library
      </button>

      <h2 className="text-xl font-bold text-center absolute left-1/2 transform -translate-x-1/2 hidden md:block drop-shadow-md">
        {title}
      </h2>

      <div className="w-[180px] flex justify-end gap-2">
        {onToggleZen && (
          <button
            onClick={onToggleZen}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-all text-sm font-medium border border-white/5"
            title="Zen Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 text-blue-200 transition-all text-sm font-medium border border-indigo-500/20"
          >
            <span>✨</span> Share
          </button>
        )}
      </div>
    </header>
  );
}
