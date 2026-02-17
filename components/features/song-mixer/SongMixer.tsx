"use client";

import { useEffect } from "react";

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

// Hooks
import { useSongMixerAudio } from "@/hooks/useSongMixerAudio";
import { useSongMixerState } from "@/hooks/useSongMixerState";
import { songLyrics } from "@/lib/data/lyrics";
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

      <div
        className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-[#0f0f1a] text-white flex flex-col transition-colors duration-1000"
        style={{ "--accent-color": dominantColor } as React.CSSProperties}
      >
        <BackgroundEffect coverUrl={selectedSong.cover} />

        <SongMixerHeader
          title={selectedSong.name}
          onBack={() => {
            stopMix();
            baseHandleSongSelect(null);
          }}
        />

        <main className="flex-1 overflow-y-auto relative z-10 p-4 custom-scrollbar">
          <div className="max-w-7xl mx-auto flex flex-col gap-12 py-8">
            {/* Top Section: Player & Lyrics - Symmetrical Layout */}
            <div className="flex flex-col items-center gap-8">
              <div
                className={`flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-8 transition-all duration-500 ease-in-out`}
              >
                {/* Player Column */}
                <div className="w-full max-w-md flex flex-col items-center transition-all duration-500">
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
                  />
                </div>

                {/* Lyrics Column */}
                {hasLyrics && showLyrics && (
                  <div className="w-full max-w-md animate-fade-in-up h-100 md:h-212">
                    <LyricsDisplay
                      lyrics={songLyrics[selectedSong.id]}
                      currentTime={currentMixTime}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Singers */}
            <div className="w-full">
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
