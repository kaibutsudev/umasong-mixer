"use client";

import Image from "next/image";
import { Character } from "@/lib/data/characters";
import { Song } from "@/lib/data/musicdata";
import { Singer } from "@/types";

interface SingerSelectorProps {
  availableSingers: Singer[];
  selectedSingers: Singer[];
  selectedSong: Song;
  initialCharacterId?: number;
  loadingSingers: boolean;
  characterData: Character;
  onToggleSinger: (singer: Singer) => void;
}

export function SingerSelector({
  availableSingers,
  selectedSingers,
  selectedSong,
  initialCharacterId,
  loadingSingers,
  characterData,
  onToggleSinger,
}: SingerSelectorProps) {
  return (
    <div className="bg-black/30 backdrop-blur-md rounded-3xl p-8 border border-white/10">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">
            Select Singers <span className="text-sm font-normal text-gray-400">({availableSingers.length})</span>
          </h3>
          <div className="text-sm text-gray-400">
            {selectedSingers.length} / {selectedSong.singers_limit} selected
          </div>
        </div>
        {initialCharacterId &&
          selectedSingers.some((s) => s.characterId === initialCharacterId) && (
            <p className="text-pink-400 text-sm animate-pulse">
              ✨ Main singer selected! Choose companions to complete the mix
            </p>
          )}
      </div>

      {loadingSingers ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {availableSingers.map((singer, idx) => {
            const char = characterData[singer.characterId];
            const isSelected = selectedSingers.some(
              (s) => s.characterId === singer.characterId
            );

            return (
              <div
                key={`${singer.characterId}-${singer.version}-${idx}`}
                onClick={() => onToggleSinger(singer)}
                className={`relative group cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "transform scale-105"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <div
                  className={`relative aspect-square rounded-xl overflow-hidden mb-2 border-2 transition-colors ${
                    isSelected
                      ? "border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                      : "border-transparent group-hover:border-white/30"
                  }`}
                >
                  <Image
                    src={char?.versions[0]?.character_img || "/placeholder.png"}
                    alt={char?.name_en || "Unknown"}
                    fill
                    className="object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <p
                  className={`text-center text-sm font-medium truncate ${
                    isSelected ? "text-pink-400" : "text-gray-300"
                  }`}
                >
                  {char?.name_en || "Unknown"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
