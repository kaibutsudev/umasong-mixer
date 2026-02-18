"use client";

import Image from "next/image";
import { Character } from "@/lib/data/characters";
import { Song } from "@/lib/data/musicdata";
import { Singer } from "@/types";
import { Volume2 } from "lucide-react";

interface SingerSelectorProps {
  availableSingers: Singer[];
  selectedSingers: Singer[];
  selectedSong: Song;
  initialCharacterId?: number;
  loadingSingers: boolean;
  characterData: Character;
  onToggleSinger: (singer: Singer) => void;
  singerVolumes: { [id: number]: number };
  onVolumeChange: (id: number, vol: number) => void;
}

/**
 * Component for selecting singers (Umas) available for the current song.
 * Displays a grid of character cards with their images and names.
 * Includes volume sliders for active mixing of selected singers.
 */
export function SingerSelector({
  availableSingers,
  selectedSingers,
  selectedSong,
  initialCharacterId,
  loadingSingers,
  characterData,
  onToggleSinger,
  singerVolumes,
  onVolumeChange,
}: SingerSelectorProps) {
  return (
    <div className="bg-black/30 backdrop-blur-md rounded-3xl p-8 border border-white/10">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">
            Select Singers{" "}
            <span className="text-sm font-normal text-gray-400">
              ({availableSingers.length})
            </span>
          </h3>
          <div className="text-sm text-gray-400">
            {selectedSingers.length} / {selectedSong.singers_limit} selected
          </div>
        </div>
        {initialCharacterId &&
          selectedSingers.some((s) => s.characterId === initialCharacterId) && (
            <p className="text-[var(--accent-color)] text-sm animate-pulse">
              ✨ Main singer selected! Choose companions to complete the mix
            </p>
          )}
      </div>

      {loadingSingers ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-color)]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {availableSingers.map((singer, idx) => {
            const char = characterData[singer.characterId];
            const isSelected = selectedSingers.some(
              (s) => s.characterId === singer.characterId,
            );
            const currentVol = singerVolumes[singer.characterId] ?? 1.0;

            return (
              <div
                key={`${singer.characterId}-${singer.version}-${idx}`}
                className={`relative group flex flex-col items-center transition-all duration-300 ${
                  isSelected
                    ? "transform scale-105"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                {/* Avatar Container */}
                <div
                  onClick={() => onToggleSinger(singer)}
                  className={`relative w-full aspect-square rounded-xl overflow-hidden mb-2 border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-[var(--accent-color)] shadow-[0_0_15px_var(--accent-color)]"
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
                    <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--accent-color),transparent_80%)] flex items-center justify-center">
                      <div className="w-8 h-8 bg-[var(--accent-color)] rounded-full flex items-center justify-center shadow-lg">
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

                {/* Name */}
                <p
                  className={`text-center text-sm font-bold truncate mb-2 ${
                    isSelected ? "text-[var(--accent-color)]" : "text-gray-300"
                  }`}
                >
                  {char?.name_en || "Unknown"}
                </p>

                {/* Individual Voice Volume Slider (Fader) */}
                {isSelected && (
                  <div
                    className="w-full bg-black/40 rounded-lg p-2 flex items-center gap-2 border border-white/5 animate-fade-in"
                    onClick={(e) => e.stopPropagation()} // Prevent deselection when adjusting volume
                  >
                    <Volume2 className="w-3 h-3 text-gray-500" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={currentVol}
                      onChange={(e) =>
                        onVolumeChange(
                          singer.characterId,
                          parseFloat(e.target.value),
                        )
                      }
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-(--accent-color)"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

