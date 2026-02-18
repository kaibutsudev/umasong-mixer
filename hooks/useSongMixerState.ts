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

/**
 * Custom hook to manage the state of the song mixer, including selections,
 * UI controls, and URL synchronization.
 */
export function useSongMixerState({
  songs,
  initialSongId,
  initialCharacterId,
  onStopMix,
}: UseSongMixerStateProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- Mixer Selection State ---
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [availableSingers, setAvailableSingers] = useState<Singer[]>([]);
  const [selectedSingers, setSelectedSingers] = useState<Singer[]>([]);

  // --- UI Control State ---
  const [useAudience, setUseAudience] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [singerVolumes, setSingerVolumes] = useState<{ [id: number]: number }>({});
  const [nightcoreMode, setNightcoreMode] = useState(false);
  const [loadingSingers, setLoadingSingers] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);

  /**
   * Updates the volume of a specific singer.
   */
  const updateSingerVolume = (characterId: number, vol: number) => {
    setSingerVolumes((prev) => ({
      ...prev,
      [characterId]: vol,
    }));
  };

  /**
   * Handles song selection and updates the URL.
   * Triggers onStopMix to ensure cleanup of current playback.
   */
  const handleSongSelect = async (song: Song | null) => {
    onStopMix();

    if (!song) {
      setSelectedSong(null);
      setSelectedSingers([]);
      setAvailableSingers([]);
      
      const params = new URLSearchParams(searchParams.toString());
      params.delete("songId");
      router.push(`?${params.toString()}`);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("songId", song.id.toString());
    router.push(`?${params.toString()}`);
  };

  /**
   * Fetches available singers for a specific song.
   */
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

  /**
   * Toggles a singer's selection and updates the URL.
   */
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

    setSelectedSingers(newSingers);

    const params = new URLSearchParams(searchParams.toString());
    if (newSingers.length > 0) {
      const singerIds = newSingers.map((s) => s.characterId).join(",");
      params.set("singers", singerIds);
    } else {
      params.delete("singers");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  /**
   * Auto-select song based on URL parameters or initial props.
   */
  useEffect(() => {
    const songIdParam = searchParams.get("songId");
    const targetSongId =
      initialSongId || (songIdParam ? parseInt(songIdParam) : null);

    if (targetSongId) {
      if (!selectedSong || selectedSong.id !== targetSongId) {
        const song = songs.find((s) => s.id === targetSongId);
        if (song) {
          loadSongData(song);
        }
      }
    } else {
      if (selectedSong && !initialSongId) {
        setSelectedSong(null);
        setSelectedSingers([]);
        setAvailableSingers([]);
      }
    }
  }, [searchParams, songs, initialSongId]);

  /**
   * Sync singers from URL parameters or initial props once song data is loaded.
   */
  useEffect(() => {
    if (availableSingers.length === 0) return;

    const singersParam = searchParams.get("singers");
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
  }, [availableSingers, searchParams, initialCharacterId]);

  return {
    selectedSong,
    availableSingers,
    selectedSingers,
    useAudience,
    volume,
    singerVolumes,
    nightcoreMode,
    loadingSingers,
    showLyrics,
    handleSongSelect,
    toggleSinger,
    setUseAudience,
    setVolume,
    updateSingerVolume,
    setNightcoreMode,
    setShowLyrics,
  };
}

