import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
        return;
    }

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

    if (selectedSingers.find((s) => s.characterId === singer.characterId)) {
      if (initialCharacterId && singer.characterId === initialCharacterId) {
        return;
      }
      setSelectedSingers(
        selectedSingers.filter((s) => s.characterId !== singer.characterId)
      );
    } else {
      if (selectedSong && selectedSingers.length < selectedSong.singers_limit) {
        setSelectedSingers([...selectedSingers, singer]);
      } else {
        alert(
          `You can only select up to ${selectedSong?.singers_limit ?? 3} singers.`
        );
      }
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================
  // Auto-select song from URL/Props
  useEffect(() => {
    const songIdParam = searchParams.get("songId");
    const targetSongId =
      initialSongId || (songIdParam ? parseInt(songIdParam) : null);

    if (targetSongId && !selectedSong) {
      const song = songs.find((s) => s.id === targetSongId);
      if (song) {
        handleSongSelect(song);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, songs, initialSongId]);

  // Auto-select initial character
  useEffect(() => {
    if (initialCharacterId && availableSingers.length > 0) {
      const singer = availableSingers.find(
        (s) => s.characterId === initialCharacterId
      );
      if (singer && selectedSingers.length === 0) {
        setSelectedSingers([singer]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSingers, initialCharacterId]);

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
