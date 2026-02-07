import { useMemo } from "react";
import { characters } from "@/lib/data/characters";
import { songs } from "@/lib/data/musicdata";
import singersDataRaw from "@/lib/data/singers-data.json";

// Type assertion for singersData
const singersData = singersDataRaw as Record<string, { characterId: number }[]>;

export function useSongSelectorData(searchQuery: string, selectedCharacterId: number | null) {
  // Process singersData to map CharacterID -> SongIDs
  const characterSongMap = useMemo(() => {
    const map = new Map<number, number[]>();
    
    Object.entries(singersData).forEach(([songIdStr, singers]) => {
      const songId = parseInt(songIdStr);
      singers.forEach(singer => {
        if (!map.has(singer.characterId)) {
          map.set(singer.characterId, []);
        }
        if (!map.get(singer.characterId)?.includes(songId)) {
          map.get(singer.characterId)?.push(songId);
        }
      });
    });
    
    return map;
  }, []);

  // Get unique characters that have at least one song
  const uniqueCharacters = useMemo(() => {
    return Object.entries(characters)
      .map(([id, char]) => ({
        id: parseInt(id),
        name: char.name_en,
        image: char.versions[0]?.character_img || "",
        deathDate: char.deathDate,
      }))
      .filter(char => characterSongMap.has(char.id) && characterSongMap.get(char.id)!.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [characterSongMap]);

  // Filter characters based on search query
  const filteredCharacters = useMemo(() => {
    if (!searchQuery) return uniqueCharacters;
    const lowerQuery = searchQuery.toLowerCase();
    return uniqueCharacters.filter(char => 
      char.name.toLowerCase().includes(lowerQuery)
    );
  }, [uniqueCharacters, searchQuery]);

  // Get songs that have singers available (based on singersData)
  const availableSongs = useMemo(() => {
    return songs.filter(song => {
      const songSingers = singersData[song.id.toString()];
      return songSingers && songSingers.length > 0;
    });
  }, []);

  // Get songs for the selected character using the map
  const characterSongs = useMemo(() => {
    if (!selectedCharacterId) return [];

    const songIds = characterSongMap.get(selectedCharacterId) || [];
    return songs.filter((song) => songIds.includes(song.id));
  }, [selectedCharacterId, characterSongMap]);

  return {
    uniqueCharacters,
    filteredCharacters,
    availableSongs,
    characterSongs,
    singersData
  };
}
