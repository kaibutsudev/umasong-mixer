"use client";

import { useState, useEffect } from "react";
import { Song } from "@/lib/data/musicdata";
import { Singer } from "@/types";
import { Character } from "@/lib/data/characters";

export interface HistoryItem {
  id: string; // unique ID for key
  timestamp: number;
  songId: number;
  singerIds: number[];
  songName: string;
  coverUrl: string;
  singerNames: string[];
}

const MAX_HISTORY = 5;
const STORAGE_KEY = "umasong-mixer-history";

export function useMixHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const addToHistory = (song: Song, selectedSingers: Singer[], characterData?: Character) => {
    if (selectedSingers.length === 0) return;

    const singerIds = selectedSingers.map((s) => s.characterId).sort();
    
    // Resolve names
    const singerNames = selectedSingers.map(s => {
        if (characterData) {
            const charGroup = characterData[s.characterId];
            const version = charGroup?.versions.find(v => v.version === s.version) || charGroup?.versions[0];
            return version?.name_en || s.characterId.toString();
        }
        return s.characterId.toString();
    });
    
    // Create new item
    const newItem: HistoryItem = {
      id: `${song.id}-${singerIds.join(",")}`,
      timestamp: Date.now(),
      songId: song.id,
      singerIds: singerIds,
      songName: song.name,
      coverUrl: song.cover,
      singerNames: singerNames,
    };

    setHistory((prev) => {
      // Remove generic duplicates (same song + same singers)
      const filtered = prev.filter(
        (item) =>
          item.songId !== newItem.songId ||
          JSON.stringify(item.singerIds) !== JSON.stringify(newItem.singerIds)
      );

      // Add to top, limit to MAX
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
      
      // Save to local storage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save history", e);
      }
      
      return updated;
    });
  };

  const clearHistory = () => {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
  };

  return {
    history,
    addToHistory,
    clearHistory
  };
}
