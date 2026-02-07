import { useState } from "react";

export type SearchMode = "singer" | "song" | null;
export type Step = "mode-selection" | "character-selection" | "song-selection" | "song-selection-from-character" | "mixer";

export function useSongSelectorNavigation() {
  const [currentStep, setCurrentStep] = useState<Step>("mode-selection");
  const [searchMode, setSearchMode] = useState<SearchMode>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleModeSelection = (mode: SearchMode) => {
    setSearchMode(mode);
    if (mode === "singer") {
      setCurrentStep("character-selection");
    } else {
      setCurrentStep("song-selection");
    }
  };

  const handleCharacterSelection = (characterId: number) => {
    setSelectedCharacterId(characterId);
    setCurrentStep("song-selection-from-character");
    setSearchQuery(""); // Clear search when moving forward
  };

  const handleSongSelection = (songId: number) => {
    setSelectedSongId(songId);
    setCurrentStep("mixer");
  };

  const handleBack = () => {
    if (
      currentStep === "character-selection" ||
      currentStep === "song-selection"
    ) {
      setCurrentStep("mode-selection");
      setSearchMode(null);
      setSelectedCharacterId(null);
      setSearchQuery("");
    } else if (currentStep === "song-selection-from-character") {
      setCurrentStep("character-selection");
      setSelectedCharacterId(null);
    } else if (currentStep === "mixer") {
      if (searchMode === "singer") {
        setCurrentStep("song-selection-from-character");
      } else {
        setCurrentStep("song-selection");
      }
      setSelectedSongId(null);
    }
  };

  return {
    currentStep,
    searchMode,
    selectedCharacterId,
    selectedSongId,
    searchQuery,
    setSearchQuery,
    handleModeSelection,
    handleCharacterSelection,
    handleSongSelection,
    handleBack
  };
}
