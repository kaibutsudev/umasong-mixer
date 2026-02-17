"use client";

import Image from "next/image";
import { Song } from "@/lib/data/musicdata";
import { useState } from "react";
import { HistoryItem } from "@/hooks/useMixHistory";
import { Link, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface SongSelectorProps {
  songs: Song[];
  onSelect: (song: Song) => void;
  history?: HistoryItem[];
  onSelectHistoryItem?: (item: HistoryItem) => void;
}

export function SongSelector({
  songs,
  onSelect,
  history = [],
  onSelectHistoryItem,
}: SongSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredSongs = songs.filter((song) =>
    song.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text mb-2">
              UmaSong Mixer
            </h1>
            <p className="text-gray-400">Select a track to start mixing</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search songs..."
              className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder-gray-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* History Section */}
        {history && history.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Link className="h-6 w-6 text-pink-500" />
              Recent Mixes
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectHistoryItem) {
                      onSelectHistoryItem(item);
                    } else {
                      // Default behavior if no handler
                      router.push(
                        `/?songId=${item.songId}&singers=${item.singerIds.join(",")}`,
                      );
                    }
                  }}
                  className="group relative cursor-pointer"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 border border-white/10 group-hover:border-pink-500/50 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] bg-gray-900">
                    <Image
                      src={item.coverUrl}
                      alt={item.songName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent text-[10px] text-white/80">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-200 group-hover:text-pink-400 text-sm mb-1 truncate transition-colors">
                    {item.songName}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {item.singerNames.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Songs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              onClick={() => onSelect(song)}
              className="group relative cursor-pointer"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 border border-white/10 group-hover:border-pink-500/50 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] bg-gray-900">
                <Image
                  src={song.cover}
                  alt={song.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75 shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-gray-200 group-hover:text-pink-400 text-sm md:text-base mb-1 truncate transition-colors">
                {song.name}
              </h3>
              <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                ID: {song.id}
              </p>
            </div>
          ))}
        </div>

        {filteredSongs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No songs found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
