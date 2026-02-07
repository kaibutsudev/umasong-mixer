"use client";

import { useEffect, useRef, useState } from "react";
import { LyricLine } from "@/lib/data/lyrics";

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
}

type LyricMode = 'kanji' | 'romaji';

export function LyricsDisplay({ lyrics, currentTime }: LyricsDisplayProps) {
  const [mode, setMode] = useState<LyricMode>('kanji');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const activeLineIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    return (
      currentTime >= line.time &&
      (!nextLine || currentTime < nextLine.time)
    );
  });

  useEffect(() => {
    if (activeLineIndex !== -1 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = container.children[activeLineIndex] as HTMLElement;

      if (activeElement) {
        const containerHeight = container.clientHeight;
        const elementHeight = activeElement.clientHeight;
        const elementTop = activeElement.offsetTop;

        // Calculate the scroll position to center the element
        const targetScrollTop = elementTop - containerHeight / 2 + elementHeight / 2;

        container.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      }
    }
  }, [activeLineIndex]);

  if (!lyrics || lyrics.length === 0) return null;

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 h-full min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Lyrics</h3>
        <div className="flex bg-white/10 rounded-full p-1">
          <button
            onClick={() => setMode('kanji')}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              mode === 'kanji' 
                ? 'bg-pink-500 text-white font-bold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Kanji
          </button>
          <button
            onClick={() => setMode('romaji')}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              mode === 'romaji' 
                ? 'bg-pink-500 text-white font-bold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Romaji
          </button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 px-4 overscroll-y-contain no-scrollbar text-center"
        style={{ scrollBehavior: 'smooth' }}
      >
        {lyrics.map((line, index) => {
          const isActive = index === activeLineIndex;
          return (
            <div
              key={index}
              className={`transition-all duration-300 transform origin-center ${
                isActive
                  ? "opacity-100 scale-110"
                  : "opacity-40 hover:opacity-60 scale-100"
              }`}
            >
              {/* Main Line (Kanji or Romaji based on selection) */}
              <p className={`text-xl font-bold mb-2 ${
                isActive 
                  ? "text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" 
                  : "text-white"
              }`}>
                {mode === 'kanji' ? line.kanji : line.romaji}
              </p>
              
              {/* English Translation */}
              <p className={`text-sm italic ${isActive ? "text-white" : "text-gray-400"}`}>
                {line.english}
              </p>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
