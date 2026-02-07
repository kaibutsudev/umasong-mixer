"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react";

interface VinylPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  coverUrl: string;
  songName: string;
  volume: number;
  onVolumeChange: (val: number) => void;
  onDownload?: () => void;
  isDownloading?: boolean;
  useAudience?: boolean;
  onToggleAudience?: (val: boolean) => void;
  duration?: number;
  currentTime?: number;
  onSeek?: (time: number) => void;
  showLyrics?: boolean;
  onToggleLyrics?: (val: boolean) => void;
  hasLyrics?: boolean;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function VinylPlayer({
  isPlaying,
  onPlayPause,
  coverUrl,
  songName,
  volume,
  onVolumeChange,
  onDownload,
  isDownloading = false,
  useAudience,
  onToggleAudience,
  duration = 0,
  currentTime = 0,
  onSeek,
  showLyrics,
  onToggleLyrics,
  hasLyrics,
}: VinylPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const prevVolumeRef = useRef(volume);

  // Sync seek value with currentTime when not seeking
  useEffect(() => {
    if (!isSeeking) {
      setSeekValue(currentTime);
    }
  }, [currentTime, isSeeking]);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    if (onSeek) {
      onSeek(seekValue);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(prevVolumeRef.current);
      setIsMuted(false);
    } else {
      prevVolumeRef.current = volume;
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl max-w-md w-full">
      {/* Vinyl Container */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 group">
        {/* Glow Effect */}
        <div
          className={`absolute inset-0 rounded-full bg-linear-to-tr from-pink-500/30 to-purple-500/30 blur-2xl transition-opacity duration-1000 ${
            isPlaying ? "opacity-100 animate-pulse" : "opacity-30"
          }`}
        />

        {/* Vinyl Record */}
        <div
          className={`relative w-full h-full rounded-full bg-black border-4 border-gray-800 shadow-2xl overflow-hidden ${
            isPlaying ? "animate-spin-slow" : ""
          }`}
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
        >
          {/* Vinyl Grooves Texture */}
          <div className="absolute inset-0 rounded-full opacity-20 bg-[repeating-radial-gradient(#333_0,#333_2px,#111_3px,#111_4px)]" />

          {/* Vinyl Shine */}
          <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/10 via-transparent to-transparent opacity-50" />

          {/* Center Label / Cover */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full overflow-hidden border-4 border-gray-900 shadow-inner">
            <Image
              src={coverUrl}
              alt={songName}
              fill
              className="object-cover"
            />
          </div>

          {/* Spindle Hole */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 rounded-full border border-gray-400 shadow-inner z-10" />
        </div>

        {/* Tonearm (Decorative) */}
        <div
          className={`absolute -top-4 -right-4 w-24 h-32 origin-top-right transition-transform duration-700 ease-in-out z-20 pointer-events-none ${
            isPlaying ? "rotate-12" : "-rotate-12"
          }`}
        >
          <div className="w-4 h-4 bg-gray-400 rounded-full absolute top-0 right-0 shadow-lg" />
          <div className="w-2 h-24 bg-gray-300 absolute top-2 right-1 rotate-12 origin-top" />
          <div className="w-8 h-12 bg-gray-800 rounded absolute bottom-0 left-4 rotate-12 shadow-xl" />
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-md">
            {songName}
          </h3>
          <p className="text-pink-400 text-sm font-medium tracking-wider uppercase">
            Now Playing
          </p>
        </div>

        <div className="flex items-center justify-center gap-6">
          {/* Play/Pause Button */}
          <button
            onClick={onPlayPause}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>

          {/* Download Button */}
          {onDownload && (
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Mix"
            >
              {isDownloading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-2 w-full">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={seekValue}
            onMouseDown={handleSeekStart}
            onTouchStart={handleSeekStart}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            style={{
              background: `linear-gradient(to right, #db2777 ${
                (seekValue / (duration || 1)) * 100
              }%, #374151 ${(seekValue / (duration || 1)) * 100}%)`,
            }}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-pink-600 hover:accent-pink-500 transition-all"
            disabled={!duration}
          />
          <div className="flex justify-between text-xs font-medium text-gray-400">
            <span>{formatTime(seekValue)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Lyrics Mode Toggle */}
        {hasLyrics && onToggleLyrics && (
          <div className="flex items-center justify-between px-4 py-3 bg-black/20 rounded-xl border border-white/5 w-full">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  showLyrics
                    ? "bg-pink-500/20 text-pink-400"
                    : "bg-white/5 text-gray-400"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-300">
                Lyrics Display
              </span>
            </div>

            <button
              onClick={() => onToggleLyrics(!showLyrics)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                showLyrics ? "bg-pink-600" : "bg-gray-700"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  showLyrics ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {/* Audience Mode Toggle */}
        {onToggleAudience && (
          <div className="flex items-center justify-between px-4 py-3 bg-black/20 rounded-xl border border-white/5 w-full">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  useAudience
                    ? "bg-pink-500/20 text-pink-400"
                    : "bg-white/5 text-gray-400"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-300">
                Audience Mode
              </span>
            </div>

            <button
              onClick={() => onToggleAudience(!useAudience)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                useAudience ? "bg-pink-600" : "bg-gray-700"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  useAudience ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {/* Volume Control */}
        <div className="flex items-center gap-4 px-4 py-3 bg-black/20 rounded-xl border border-white/5">
          <button
            onClick={handleMuteToggle}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setIsMuted(false);
              onVolumeChange(parseFloat(e.target.value));
            }}
            style={{
              background: `linear-gradient(to right, #db2777 ${
                (isMuted ? 0 : volume) * 100
              }%, #374151 ${(isMuted ? 0 : volume) * 100}%)`,
            }}
            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-pink-600 hover:accent-pink-500 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
