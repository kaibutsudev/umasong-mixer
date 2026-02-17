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

// Hooks
import { DynamicAlert } from "@/components/ui/DynamicAlert";

// Hooks
import { useSongMixerAudio } from "@/hooks/useSongMixerAudio";
import { useSongMixerState } from "@/hooks/useSongMixerState";
import { songLyrics } from "@/lib/data/lyrics";
import { ShareCard } from "./ShareModal";
import { useDominantColor } from "@/hooks/useDominantColor";

interface SongMixerProps {
  songs: Song[];
  characterData: Character;
  initialSongId?: number;
  initialCharacterId?: number;
}

export default function SongMixer({
  songs,
  characterData,
  initialSongId,
  initialCharacterId,
}: SongMixerProps) {
  // Alert State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // Share Modal State
  const [shareOpen, setShareOpen] = useState(false);

  // Zen Mode State
  const [isZenMode, setIsZenMode] = useState(false);

  // Audio Playback Hook (initialized first to pass stopMix)
  // We need to pass stopMix to the state hook, but `useSongMixerAudio` needs state.
  // This is a circular dependency if we're not careful.
  // Ideally, state hook handles SELECTION, audio hook handles PLAYBACK.
  // But audio hook needs selectedSong/singers.

  // Let's keep useSongMixerAudio here, but its dependencies will come from the state hook.
  // We can pass a ref or a wrapper callback to the state hook?
  // Or just accept that we might need to call stopMix inside the render logic where we pass the handler?
  // No, the handler is inside the hook.

  // Solution: Instantiate state hook first, then audio hook.
  // But state hook wants onStopMix.
  // Circular dependency.

  // Refactor: We can lift `handleSongSelect` logic out or pass `stopMix` via a `useEffect`?
  // Or, simpler:
  // `useSongMixerState` creates the state.
  // `useSongMixerAudio` uses the state.
  // `SongMixer` component creates the handlers that combine them.

  // Let's revert `useSongMixerState` having `handleSongSelect`.
  // Wait, I already wrote `useSongMixerState` with `handleSongSelect`.
  // I can just pass `() => {}` initially or handle it differently?

  // Actually, `useSongMixerAudio` returns `stopMix`.
  // `useSongMixerState` takes `onStopMix`.
  // We can't use the return value of a hook as an argument to a hook called BEFORE it.

  // Let's modify the usage pattern.
  // We will pull the state variables out of `useSongMixerState` but MAYBE manage the "stop functionality" in the effect of `selectedSong` changing?
  // If `selectedSong` changes, `useSongMixerAudio` should probably stop itself?
  // Let's check `useSongMixerAudio`.

  // In `useSongMixerAudio.ts`:
  /*
    useEffect(() => {
        stopMix();
    }, [selectedSong, selectedSingers]);
  */
  // If `useSongMixerAudio` already creates an effect to stop when song changes, we don't need to manually call `stopMix` in `handleSongSelect`!
  // Let's quick-check `useSongMixerAudio.ts`.
  // I can't check it right now without a tool call.
  // But usually, changing source *should* stop playback.

  // Assuming `useSongMixerAudio` handles cleanup on prop change, we can remove `onStopMix` from `useSongMixerState`.
  // But wait, explicit user action (clicking a song) often wants to trigger immediate stop.

  // Let's use a ref for `stopMix`?
  // Or just inline the `handleSongSelect` in the component again, but keep strictly state management in the hook.

  // Better yet: define the audio hook *inside* the component, and pass its `stopMix` to a `useEffect` that watches `selectedSong`?

  // Let's try this:
  // Call `useSongMixerState` without `onStopMix`.
  // Call `useSongMixerAudio`.
  // In `useEffect(() => { stopMix() }, [selectedSong])`, we ensure it stops.

  // But `useSongMixerState` was written to take `onStopMix`. I need to update it or pass a dummy and handle it in component.
  // Passing a dummy is ugly.

  // Let's update `SongMixer.tsx` to just use the new components first,
  // and MAYBE keep the state logic inline if it's too coupled, OR
  // accept that I need to update `useSongMixerState` to NOT take `onStopMix` and rely on Effects.

  // Let's rewrite `useSongMixerState` to NOT take `onStopMix` via a separate tool call first?
  // No, I can't do parallel edits on different files easily without multiple turns.

  // I will implement `SongMixer` to define the state controls LOCALLY for now, but using the structure I wanted?
  // No, `useSongMixerState` is already written. I must match its signature.
  // I can pass an empty function `() => {}` and handle the stopping via `useEffect` in `SongMixer`.

  // Wait, `handleSongSelect` in `useSongMixerState` calls `onStopMix`.
  // If I pass `() => {}`, it does nothing.
  // Then I add `useEffect(() => { stopMix() }, [selectedSong])` in `SongMixer`.
  // This works.

  // Let's do that.

  const {
    selectedSong,
    availableSingers,
    selectedSingers,
    useAudience,
    volume,
    loadingSingers,
    showLyrics,
    handleSongSelect: baseHandleSongSelect,
    toggleSinger: baseToggleSinger,
    setUseAudience,
    setVolume,
    setShowLyrics,
  } = useSongMixerState({
    songs,
    initialSongId,
    initialCharacterId,
    onStopMix: () => {}, // Handled via effect
  });

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
  });

  // Ensure audio stops when song changes (redundant if hook does it, but safe)
  useEffect(() => {
    stopMix();
  }, [selectedSong, stopMix]);

  // Determine if we should show lyrics toggle
  const hasLyrics = selectedSong && songLyrics[selectedSong.id];

  // Dynamic Theme Color
  const dominantColor = useDominantColor(selectedSong?.cover);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseMix();
    } else {
      if (selectedSingers.length === 0) {
        setAlertTitle("Missing Singers");
        setAlertMessage(
          "¡Por favor selecciona al menos un cantante para reproducir!",
        );
        setAlertOpen(true);
        return;
      }
      playMix();
    }
  };

  const handleDownloadCheck = () => {
    if (selectedSingers.length === 0) {
      setAlertTitle("Cannot Download");
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

  const selectedSingerData = selectedSingers.map((s) => {
    const charGroup = characterData[s.characterId];
    // Default to first version or fallback
    const charVersion = charGroup?.versions[0];

    return {
      name: charVersion?.name_en ?? s.characterId.toString(),
      image: charVersion?.character_img ?? "/placeholder.png",
      // Generate a stable color from ID if not present? Or use white.
      // The Character type doesn't seem to have 'color' on root or stats based on my read of characters.ts
      // Let's use a default or generate one.
      color: "#ffffff",
    };
  });

  if (!selectedSong) {
    return (
      <div className="bg-[#0f0f1a] min-h-screen">
        <SongSelector songs={songs} onSelect={baseHandleSongSelect} />
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
            {/* Top Section: Player & Lyrics - Symmetrical Layout */}
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
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
