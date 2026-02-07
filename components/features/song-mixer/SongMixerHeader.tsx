interface SongMixerHeaderProps {
  title: string;
  onBack: () => void;
}

export function SongMixerHeader({ title, onBack }: SongMixerHeaderProps) {
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

      <div className="w-[140px] flex justify-end">
        {/* Placeholder for future actions */}
      </div>
    </header>
  );
}
