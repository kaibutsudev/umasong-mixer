"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react";
import AudioVisualizer from "./AudioVisualizer";

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
  analyser?: AnalyserNode | null;
  accentColor?: string;
  nightcoreMode?: boolean;
  onToggleNightcore?: (val: boolean) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Vinyl Player component that displays a rotating record with cover art,
 * playback controls, progress bar, and mode toggles.
 */
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
  analyser,
  accentColor,
  nightcoreMode,
  onToggleNightcore,
}: VinylPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const prevVolumeRef = useRef(volume);

  /**
   * Sync seek slider with current playback time when the user is not dragging it.
   */
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

  /**
   * Toggles mute state and remembers previous volume.
   */
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
      {/* --- Vinyl Record Section --- */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 group">
        <AudioVisualizer
          analyser={analyser || null}
          isPlaying={isPlaying}
          color={accentColor}
        />

        {/* Dynamic Glow Background */}
        <div
          className={`absolute inset-0 rounded-full bg-linear-to-tr from-[var(--accent-color)] to-[color-mix(in_srgb,var(--accent-color),#000_20%)] blur-2xl transition-opacity duration-1000 opacity-30 ${
            isPlaying ? "opacity-100 animate-pulse" : "opacity-30"
          }`}
        />

        {/* Physical Vinyl Record Representation */}
        <div
          className={`relative w-full h-full rounded-full bg-black border-4 border-gray-800 shadow-2xl overflow-hidden ${
            isPlaying ? "animate-spin-slow" : ""
          }`}
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
        >
          {/* Texture: Lathe Grooves */}
          <div className="absolute inset-0 rounded-full opacity-20 bg-[repeating-radial-gradient(#333_0,#333_2px,#111_3px,#111_4px)]" />

          {/* Texture: Surface Shine */}
          <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/10 via-transparent to-transparent opacity-50" />

          {/* Center Label (Album Cover) */}
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

        {/* Decorative Tonearm */}
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

      {/* --- Information Section --- */}
      <div className="w-full flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-md">
            {songName}
          </h3>
          <p className="text-[var(--accent-color)] text-sm font-medium tracking-wider uppercase">
            {isPlaying ? "Reproduciendo ahora" : "En pausa"}
          </p>
        </div>

        {/* Main Controls: Play/Pause/Download */}
        <div className="flex items-center justify-center gap-6">
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

        {/* Playback Seek Bar */}
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
              background: `linear-gradient(to right, var(--accent-color) ${
                (seekValue / (duration || 1)) * 100
              }%, #374151 ${(seekValue / (duration || 1)) * 100}%)`,
            }}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)] hover:accent-[var(--accent-color)]/80 transition-all"
            disabled={!duration}
          />
          <div className="flex justify-between text-xs font-medium text-gray-400">
            <span>{formatTime(seekValue)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Feature Switches: Lyrics & Audience */}
        <div className="flex flex-col gap-3">
          {hasLyrics && onToggleLyrics && (
            <div className="flex items-center justify-between px-4 py-3 bg-black/20 rounded-xl border border-white/5 w-full">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    showLyrics
                      ? "bg-[color-mix(in_srgb,var(--accent-color),transparent_80%)] text-[var(--accent-color)]"
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
                  showLyrics ? "bg-[var(--accent-color)]" : "bg-gray-700"
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

          {onToggleAudience && (
            <div className="flex items-center justify-between px-4 py-3 bg-black/20 rounded-xl border border-white/5 w-full">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    useAudience
                      ? "bg-[color-mix(in_srgb,var(--accent-color),transparent_80%)] text-[var(--accent-color)]"
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
                  useAudience ? "bg-[var(--accent-color)]" : "bg-gray-700"
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

          {onToggleNightcore && (
            <div className="flex items-center justify-between px-4 py-3 bg-black/20 rounded-xl border border-white/5 w-full">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    nightcoreMode
                      ? "bg-[color-mix(in_srgb,var(--accent-color),transparent_80%)] text-[var(--accent-color)]"
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-300">
                  Nightcore Mode
                </span>
              </div>

              <button
                onClick={() => onToggleNightcore(!nightcoreMode)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                  nightcoreMode ? "bg-[var(--accent-color)]" : "bg-gray-700"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    nightcoreMode ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Master Volume Slider */}
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
              background: `linear-gradient(to right, var(--accent-color) ${
                (isMuted ? 0 : volume) * 100
              }%, #374151 ${(isMuted ? 0 : volume) * 100}%)`,
            }}
            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)] hover:accent-[var(--accent-color)]/80 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
