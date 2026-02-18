"use client";

import { useEffect, useState } from "react";
import { Minimize2 } from "lucide-react";

// Types and Data
import { Song } from "@/lib/data/musicdata";
import { Character } from "@/lib/data/characters";

// Components
import VinylPlayer from "@/components/ui/VinylPlayer";
import { SingerSelector } from "./SingerSelector";
import { LyricsDisplay } from "./LyricsDisplay";
import { SongSelector } from "./SongSelector";
import { SongMixerHeader } from "./SongMixerHeader";
import { BackgroundEffect } from "./BackgroundEffect";
import ParticleBackground from "@/components/ui/ParticleBackground";
import { HistoryItem } from "@/hooks/useMixHistory";

// Hooks
import { DynamicAlert } from "@/components/ui/DynamicAlert";

// Hooks
import { useSongMixerAudio } from "@/hooks/useSongMixerAudio";
import { useSongMixerState } from "@/hooks/useSongMixerState";
import { songLyrics } from "@/lib/data/lyrics";
import { ShareCard } from "./ShareModal";
import { useDominantColor } from "@/hooks/useDominantColor";
import { useMixHistory } from "@/hooks/useMixHistory";

interface SongMixerProps {
  songs: Song[];
  characterData: Character;
  initialSongId?: number;
  initialCharacterId?: number;
}

/**
 * Main Song Mixer component.
 * Orchestrates song selection, singer selection, audio playback, and visual effects.
 */
export default function SongMixer({
  songs,
  characterData,
  initialSongId,
  initialCharacterId,
}: SongMixerProps) {
  // --- UI & Modal State ---
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  // --- History Hooks ---
  const { addToHistory, history } = useMixHistory();

  /**
   * Initialize state hook.
   * Note: onStopMix is handled via a dedicated effect to avoid circular dependency with audio hook.
   */
  const {
    selectedSong,
    availableSingers,
    selectedSingers,
    useAudience,
    volume,
    singerVolumes,
    nightcoreMode,
    loadingSingers,
    showLyrics,
    handleSongSelect: baseHandleSongSelect,
    toggleSinger: baseToggleSinger,
    setUseAudience,
    setVolume,
    updateSingerVolume,
    setNightcoreMode,
    setShowLyrics,
  } = useSongMixerState({
    songs,
    initialSongId,
    initialCharacterId,
    onStopMix: () => {}, // Handled via effect below
  });

  /**
   * Initialize audio playback hook.
   */
  const {
    isPlaying,
    isLoading: isAudioLoading,
    currentMixTime,
    mixDuration,
    playMix,
    stopMix,
    pauseMix,
    seekMix,
    handleDownload,
    analyserNodeRef,
  } = useSongMixerAudio({
    selectedSong,
    selectedSingers,
    useAudience,
    volume,
    singerVolumes,
    playbackRate: nightcoreMode ? 1.25 : 1,
    nightcoreMode,
  });

  /**
   * Cleanup playback when song changes.
   */
  useEffect(() => {
    stopMix();
  }, [selectedSong, stopMix]);

  const hasLyrics = selectedSong && songLyrics[selectedSong.id];
  const dominantColor = useDominantColor(selectedSong?.cover);

  /**
   * Toggles playback state or shows alert if no singers are selected.
   */
  const handlePlayPause = () => {
    if (isPlaying) {
      pauseMix();
    } else {
      if (selectedSingers.length === 0) {
        setAlertTitle("Faltan Cantantes");
        setAlertMessage(
          "¡Por favor selecciona al menos un cantante para reproducir!",
        );
        setAlertOpen(true);
        return;
      }
      playMix();
      if (selectedSong) {
        addToHistory(selectedSong, selectedSingers, characterData);
      }
    }
  };

  /**
   * Validates selection before triggering download.
   */
  const handleDownloadCheck = () => {
    if (selectedSingers.length === 0) {
      setAlertTitle("No se puede descargar");
      setAlertMessage(
        "¡Por favor selecciona al menos un cantante para descargar!",
      );
      setAlertOpen(true);
      return;
    }
    handleDownload();
  };

  const handleShare = () => {
    if (!selectedSong) return;
    setShareOpen(true);
  };

  /**
   * Maps selected singers to the display format required by the Share Modal.
   */
  const selectedSingerData = selectedSingers.map((s) => {
    const charGroup = characterData[s.characterId];
    const charVersion = charGroup?.versions[0];

    return {
      name: charVersion?.name_en ?? s.characterId.toString(),
      image: charVersion?.character_img ?? "/placeholder.png",
      color: "#ffffff",
    };
  });

  // Render Song Selection screen if no song is selected
  if (!selectedSong) {
    return (
      <div className="bg-[#0f0f1a] min-h-screen">
        <SongSelector
          songs={songs}
          onSelect={baseHandleSongSelect}
          history={history}
        />
      </div>
    );
  }

  return (
    <>
      <DynamicAlert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        title={alertTitle}
        description={alertMessage}
        actionLabel="Entendido"
      />

      <ShareCard
        open={shareOpen}
        onOpenChange={setShareOpen}
        songName={selectedSong.name}
        coverUrl={selectedSong.cover}
        singers={selectedSingerData}
        accentColor={dominantColor}
      />

      <div
        className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-[#0f0f1a] text-white flex flex-col transition-colors duration-1000"
        style={{ "--accent-color": dominantColor } as React.CSSProperties}
      >
        <BackgroundEffect coverUrl={selectedSong.cover} />
        <ParticleBackground isPlaying={isPlaying} accentColor={dominantColor} />

        {/* Header - Hidden in Zen Mode */}
        <div
          className={`transition-all duration-500 ease-in-out ${isZenMode ? "-mt-[88px] opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <SongMixerHeader
            title={selectedSong.name}
            onBack={() => {
              stopMix();
              baseHandleSongSelect(null);
            }}
            onShare={handleShare}
            onToggleZen={() => setIsZenMode(true)}
          />
        </div>

        {/* Zen Mode Exit Button */}
        <button
          onClick={() => setIsZenMode(false)}
          className={`absolute top-6 right-6 z-50 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all duration-500 w-12 h-12 flex items-center justify-center ${
            isZenMode
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10 pointer-events-none"
          }`}
          title="Exit Zen Mode"
        >
          <Minimize2 className="w-6 h-6" />
        </button>

        <main className="flex-1 overflow-y-auto relative z-10 p-4 custom-scrollbar">
          <div className="max-w-7xl mx-auto flex flex-col gap-12 py-8">
            {/* Top Section: Player & Lyrics */}
            <div className="flex flex-col items-center gap-8">
              <div
                className={`flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-8 transition-all duration-500 ease-in-out`}
              >
                {/* Player Column */}
                <div
                  className={`w-full max-w-md flex flex-col items-center transition-all duration-700 ${isZenMode ? "scale-125 lg:scale-130" : ""}`}
                >
                  <VinylPlayer
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    coverUrl={selectedSong.cover}
                    songName={selectedSong.name}
                    volume={volume}
                    onVolumeChange={setVolume}
                    onDownload={handleDownloadCheck}
                    isDownloading={isAudioLoading}
                    useAudience={useAudience}
                    onToggleAudience={setUseAudience}
                    duration={mixDuration}
                    currentTime={currentMixTime}
                    onSeek={seekMix}
                    showLyrics={showLyrics}
                    onToggleLyrics={setShowLyrics}
                    hasLyrics={!!hasLyrics}
                    analyser={analyserNodeRef.current}
                    accentColor={dominantColor}
                    nightcoreMode={nightcoreMode}
                    onToggleNightcore={setNightcoreMode}
                  />
                </div>

                {/* Lyrics Column */}
                {hasLyrics && showLyrics && (
                  <div
                    className={`w-full max-w-md animate-fade-in-up md:h-212 transition-all duration-700 ${isZenMode ? "scale-110 lg:scale-120 h-[60dvh]" : "h-100"}`}
                  >
                    <LyricsDisplay
                      lyrics={songLyrics[selectedSong.id]}
                      currentTime={currentMixTime}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Singers */}
            <div
              className={`w-full transition-all duration-500 ${isZenMode ? "translate-y-20 opacity-0 pointer-events-none absolute bottom-0" : "opacity-100"}`}
            >
              <SingerSelector
                availableSingers={availableSingers}
                selectedSingers={selectedSingers}
                selectedSong={selectedSong}
                initialCharacterId={initialCharacterId}
                loadingSingers={loadingSingers}
                characterData={characterData}
                onToggleSinger={baseToggleSinger}
                singerVolumes={singerVolumes}
                onVolumeChange={updateSingerVolume}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

