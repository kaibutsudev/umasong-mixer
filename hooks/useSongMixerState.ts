import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Song } from "@/lib/data/musicdata";
import { Singer } from "@/types";

interface UseSongMixerStateProps {
  songs: Song[];
  initialSongId?: number;
  initialCharacterId?: number;
  onStopMix: () => void; // Callback to stop audio
}

export function useSongMixerState({
  songs,
  initialSongId,
  initialCharacterId,
  onStopMix,
}: UseSongMixerStateProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ============================================================================
  // STATE
  // ============================================================================
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [availableSingers, setAvailableSingers] = useState<Singer[]>([]);
  const [selectedSingers, setSelectedSingers] = useState<Singer[]>([]);

  // UI Controls
  const [useAudience, setUseAudience] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [loadingSingers, setLoadingSingers] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleSongSelect = async (song: Song | null) => {
    onStopMix();

    if (!song) {
      setSelectedSong(null);
      setSelectedSingers([]);
      setAvailableSingers([]);
      // Remove songId from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete("songId");
      router.push(`?${params.toString()}`);
      return;
    }

    // Update URL to reflect selected song
    const params = new URLSearchParams(searchParams.toString());
    params.set("songId", song.id.toString());
    router.push(`?${params.toString()}`);

    // The actual state update will happen in the effect below
  };

  const loadSongData = async (song: Song) => {
    setSelectedSong(song);
    setSelectedSingers([]);
    setAvailableSingers([]);
    setLoadingSingers(true);

    try {
      const response = await fetch(`/api/song-singers?songId=${song.id}`);
      const data = await response.json();
      setAvailableSingers(data.singers || []);
    } catch (error) {
      console.error("Error fetching singers:", error);
      setAvailableSingers([]);
    } finally {
      setLoadingSingers(false);
    }
  };


  const toggleSinger = (singer: Singer) => {
    onStopMix();

    let newSingers: Singer[] = [];

    if (selectedSingers.find((s) => s.characterId === singer.characterId)) {
      if (initialCharacterId && singer.characterId === initialCharacterId) {
        return;
      }
      newSingers = selectedSingers.filter(
        (s) => s.characterId !== singer.characterId,
      );
    } else {
      if (selectedSong && selectedSingers.length < selectedSong.singers_limit) {
        newSingers = [...selectedSingers, singer];
      } else {
        alert(
          `You can only select up to ${selectedSong?.singers_limit ?? 3} singers.`,
        );
        return;
      }
    }

    // Update local state is handled by URL effect now?
    // Actually, setting URL should trigger re-render, but it's cleaner to optimistic update or just push URL.
    // If we rely purely on URL, we might have lag.
    // Let's mimic handleSongSelect: push to URL, allow effect to sync?
    // Or just update local state AND push to URL.

    setSelectedSingers(newSingers);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (newSingers.length > 0) {
      const singerIds = newSingers.map((s) => s.characterId).join(",");
      params.set("singers", singerIds);
    } else {
      params.delete("singers");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================
  // Auto-select song from URL/Props
  useEffect(() => {
    const songIdParam = searchParams.get("songId");
    const targetSongId =
      initialSongId || (songIdParam ? parseInt(songIdParam) : null);

    if (targetSongId) {
      // Only load if it's different from current or current is null
      if (!selectedSong || selectedSong.id !== targetSongId) {
        const song = songs.find((s) => s.id === targetSongId);
        if (song) {
          loadSongData(song);
        }
      }
    } else {
      // If no song ID and we have one selected, clear it (unless it was initial)
      if (selectedSong && !initialSongId) {
        setSelectedSong(null);
        setSelectedSingers([]);
        setAvailableSingers([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, songs, initialSongId]);

  // Sync singers from URL or Initial Props
  useEffect(() => {
    if (availableSingers.length === 0) return;

    const singersParam = searchParams.get("singers");

    // Priority: URL Params > Initial Props
    let targetSingerIds: number[] = [];

    if (singersParam) {
      targetSingerIds = singersParam.split(",").map(Number);
    } else if (initialCharacterId) {
      targetSingerIds = [initialCharacterId];
    }

    if (targetSingerIds.length > 0) {
      const singersToSelect = availableSingers.filter((s) =>
        targetSingerIds.includes(s.characterId),
      );

      // Avoid infinite loop by checking if different
      const currentIds = selectedSingers
        .map((s) => s.characterId)
        .sort()
        .join(",");
      const newIds = singersToSelect
        .map((s) => s.characterId)
        .sort()
        .join(",");

      if (currentIds !== newIds) {
        setSelectedSingers(singersToSelect);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSingers, searchParams, initialCharacterId]);

  return {
    selectedSong,
    availableSingers,
    selectedSingers,
    useAudience,
    volume,
    loadingSingers,
    showLyrics,
    handleSongSelect,
    toggleSinger,
    setUseAudience,
    setVolume,
    setShowLyrics,
  };
}
