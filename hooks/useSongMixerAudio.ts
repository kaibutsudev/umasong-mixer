import { useState, useRef, useEffect, useCallback } from "react";
import { Song } from "@/lib/data/musicdata";
import { Singer } from "@/types";
import { audioBufferToMp3 } from "@/utils/mp3Encoder";

interface UseSongMixerAudioProps {
  selectedSong: Song | null;
  selectedSingers: Singer[];
  useAudience: boolean;
  volume: number;
  singerVolumes: { [id: number]: number };
  playbackRate?: number;
  nightcoreMode?: boolean;
}

/**
 * Custom hook to handle multi-track audio playback and mixing.
 * Manages BGM (clean or crowd) and multiple singer voice tracks.
 */
export function useSongMixerAudio({
  selectedSong,
  selectedSingers,
  useAudience,
  volume,
  singerVolumes,
  playbackRate = 1,
  nightcoreMode = false,
}: UseSongMixerAudioProps) {
  // --- Audio State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMixTime, setCurrentMixTime] = useState(0);
  const [mixDuration, setMixDuration] = useState(0);

  // --- Audio Context Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  // Map of characterId to their active GainNode
  const singerGainNodesRef = useRef<{ [id: number]: GainNode }>({});

  // --- Playback Refs ---
  const audioBuffersRef = useRef<{ [key: string]: AudioBuffer }>({});
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const requestAnimationFrameRef = useRef<number | null>(null);

  /**
   * Initialize AudioContext and Analyser on mount
   */
  useEffect(() => {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();
    const gainNode = audioContextRef.current.createGain();

    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;

    // Signal chain: [Source Nodes] -> Individual Gains -> Master Gain -> Analyser -> Destination
    gainNode.connect(analyser);
    analyser.connect(audioContextRef.current.destination);

    gainNodeRef.current = gainNode;
    analyserNodeRef.current = analyser;

    return () => {
      audioContextRef.current?.close();
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
      }
    };
  }, []);

  /**
   * Sync master volume changes to the master gain node
   */
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  /**
   * Sync individual singer volumes to their respective GainNodes in real-time
   */
  useEffect(() => {
    Object.entries(singerVolumes).forEach(([id, vol]) => {
      const charId = parseInt(id);
      const node = singerGainNodesRef.current[charId];
      if (node) {
        // Smooth transition to avoid clicking sounds
        node.gain.setTargetAtTime(
          vol,
          audioContextRef.current?.currentTime || 0,
          0.05,
        );
      }
    });
  }, [singerVolumes]);

  /**
   * Preload audio buffers for the selected song
   */
  useEffect(() => {
    if (!selectedSong || !audioContextRef.current) return;

    let isCancelled = false;
    const preloadSong = async () => {
      const audioCtx = audioContextRef.current;
      if (!audioCtx) return;

      const urlsToLoad = [
        selectedSong.clean_song,
        selectedSong.crowd_audio,
      ].filter((u) => !!u);

      for (const url of urlsToLoad) {
        if (isCancelled) return;
        if (!audioBuffersRef.current[url]) {
          try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            if (isCancelled) return;
            const decoded = await audioCtx.decodeAudioData(arrayBuffer);
            audioBuffersRef.current[url] = decoded;

            if (url === selectedSong.clean_song) {
              setMixDuration(decoded.duration);
            }
          } catch (e) {
            console.error("Error loading buffer:", e);
          }
        } else {
          if (url === selectedSong.clean_song) {
            setMixDuration(audioBuffersRef.current[url].duration);
          }
        }
      }
    };

    preloadSong();
    return () => {
      isCancelled = true;
    };
  }, [selectedSong]);

  /**
   * Stops all active audio source nodes and cleans up singer gain nodes
   */
  const stopMix = useCallback(() => {
    sourceNodesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch (e) {
        // Source might have already ended
      }
    });
    sourceNodesRef.current = [];
    singerGainNodesRef.current = {};
    setIsPlaying(false);

    if (requestAnimationFrameRef.current) {
      cancelAnimationFrame(requestAnimationFrameRef.current);
      requestAnimationFrameRef.current = null;
    }
  }, []);

  /**
   * Updates current playback time for UI sync
   */
  const updateProgress = useCallback(() => {
    if (audioContextRef.current) {
      const elapsed =
        (audioContextRef.current.currentTime - startTimeRef.current) *
          playbackRate +
        offsetRef.current;
      setCurrentMixTime(Math.min(elapsed, mixDuration));

      if (elapsed < mixDuration) {
        requestAnimationFrameRef.current =
          requestAnimationFrame(updateProgress);
      } else {
        stopMix();
        setCurrentMixTime(0);
        offsetRef.current = 0;
      }
    }
  }, [mixDuration, stopMix, playbackRate]);

  /**
   * Loads all required audio buffers (BGM + Singers)
   */
  const loadAudioBuffers = async (): Promise<boolean> => {
    if (!selectedSong || !audioContextRef.current) {
      return false;
    }

    const audioCtx = audioContextRef.current;

    const bgmUrls = [selectedSong.clean_song, selectedSong.crowd_audio].filter(
      (url) => !!url,
    );
    const voiceUrls = selectedSingers
      .map((s) => s.file)
      .filter((f) => !!f && f.length > 0);
    const urlsToLoad = Array.from(new Set([...bgmUrls, ...voiceUrls]));

    try {
      await Promise.all(
        urlsToLoad.map(async (url) => {
          if (!audioBuffersRef.current[url]) {
            try {
              const response = await fetch(url);
              if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);
              const arrayBuffer = await response.arrayBuffer();
              audioBuffersRef.current[url] =
                await audioCtx.decodeAudioData(arrayBuffer);
            } catch (innerErr) {
              console.warn(`Failed to load audio: ${url}`, innerErr);
            }
          }
        }),
      );

      let maxDur = 0;
      if (
        selectedSong.clean_song &&
        audioBuffersRef.current[selectedSong.clean_song]
      ) {
        maxDur = audioBuffersRef.current[selectedSong.clean_song].duration;
      }
      setMixDuration(maxDur);

      return true;
    } catch (error) {
      console.error("Error loading buffers", error);
      return false;
    }
  };

  /**
   * Starts playback of all synced sources at a given offset
   */
  const playMixInternal = async (startOffset: number = 0) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    const audioCtx = audioContextRef.current;
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    gainNodeRef.current.gain.value = volume;

    const bgmUrl = useAudience
      ? selectedSong?.crowd_audio
      : selectedSong?.clean_song;
    if (!bgmUrl) return;

    const sources: AudioBufferSourceNode[] = [];
    const currentTime = audioCtx.currentTime;

    // 1. Setup BGM Source
    const bgmBuffer = audioBuffersRef.current[bgmUrl];
    if (bgmBuffer) {
      const source = audioCtx.createBufferSource();
      source.buffer = bgmBuffer;
      source.playbackRate.value = playbackRate;
      source.connect(gainNodeRef.current!);
      source.start(currentTime, startOffset);
      sources.push(source);
    }

    // 2. Setup Individual Singer Sources with their own GainNodes
    selectedSingers.forEach((singer) => {
      const buffer = audioBuffersRef.current[singer.file];
      if (buffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;

        // Create individual gain for cross-fading
        const singerGain = audioCtx.createGain();
        const initialVol = singerVolumes[singer.characterId] ?? 1.0;
        singerGain.gain.value = initialVol;

        // source -> singerGain -> masterGain
        source.connect(singerGain);
        singerGain.connect(gainNodeRef.current!);

        source.start(currentTime, startOffset);
        sources.push(source);

        // Store gain node for real-time updates
        singerGainNodesRef.current[singer.characterId] = singerGain;
      }
    });

    sourceNodesRef.current = sources;
    startTimeRef.current = currentTime;
    offsetRef.current = startOffset;
    setIsPlaying(true);

    if (requestAnimationFrameRef.current) {
      cancelAnimationFrame(requestAnimationFrameRef.current);
    }
    requestAnimationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  /**
   * Main Play action: Resumes or starts fresh if needed
   */
  const playMix = async () => {
    if (!selectedSong) return;

    const audioCtx = audioContextRef.current;

    // Resume suspended context if we already have sources
    if (
      audioCtx &&
      audioCtx.state === "suspended" &&
      sourceNodesRef.current.length > 0
    ) {
      await audioCtx.resume();
      setIsPlaying(true);
      requestAnimationFrameRef.current = requestAnimationFrame(updateProgress);
      return;
    }

    if (audioCtx && audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    stopMix();
    setIsLoading(true);

    const success = await loadAudioBuffers();
    if (success) {
      offsetRef.current = 0;
      await playMixInternal(0);
    } else {
      alert("Failed to load audio");
    }
    setIsLoading(false);
  };

  /**
   * Pauses the audio context
   */
  const pauseMix = () => {
    if (audioContextRef.current?.state === "running") {
      audioContextRef.current.suspend();
      setIsPlaying(false);
    }
  };

  /**
   * Seeks to a specific time in the mix
   */
  const seekMix = (time: number) => {
    if (!selectedSong || selectedSingers.length === 0) return;
    stopMix();
    playMixInternal(time);
  };

  /**
   * Handles audience toggle mid-playback with seamless sync
   */
  useEffect(() => {
    if (isPlaying) {
      const currentTime =
        offsetRef.current +
        (audioContextRef.current?.currentTime || 0) -
        startTimeRef.current;
      seekMix(currentTime);
    }
  }, [useAudience]);

  // Handle Playback Rate Change (Nightcore)
  useEffect(() => {
    if (isPlaying) {
      // Seek to current time to reset source nodes with new playback rate
      seekMix(currentMixTime);
    }
  }, [playbackRate]);

  /**
   * Renders the current mix to an MP3 file for download.
   * Respects individual singer volumes and playback rate.
   */
  const handleDownload = async () => {
    if (!selectedSong || selectedSingers.length === 0) return;
    setIsLoading(true);
    try {
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();

      const bgmUrl = useAudience
        ? selectedSong.crowd_audio
        : selectedSong.clean_song;

      // Load BGM and Voice buffers
      const bgmBufferPromise = fetch(bgmUrl)
        .then((r) => r.arrayBuffer())
        .then((ab) => audioCtx.decodeAudioData(ab));
      const voiceBuffersPromises = selectedSingers.map(async (s) => {
        const response = await fetch(s.file);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await audioCtx.decodeAudioData(arrayBuffer);
        return { id: s.characterId, buffer };
      });

      const bgmBuffer = await bgmBufferPromise;
      const voiceBuffers = await Promise.all(voiceBuffersPromises);

      // Calculate max duration accounting for playback rate
      const maxDuration =
        Math.max(
          bgmBuffer.duration,
          ...voiceBuffers.map((vb) => vb.buffer.duration),
        ) / playbackRate;

      const offlineCtx = new OfflineAudioContext(2, maxDuration * 44100, 44100);

      // Create master gain for the offline context
      const masterGain = offlineCtx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(offlineCtx.destination);

      // 1. Setup BGM for render
      const bgmSource = offlineCtx.createBufferSource();
      bgmSource.buffer = bgmBuffer;
      bgmSource.playbackRate.value = playbackRate;
      bgmSource.connect(masterGain);
      bgmSource.start(0);

      // 2. Setup Voices for render
      voiceBuffers.forEach(({ id, buffer }) => {
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;

        const singerGain = offlineCtx.createGain();
        singerGain.gain.value = singerVolumes[id] ?? 1.0;

        source.connect(singerGain);
        singerGain.connect(masterGain);
        source.start(0);
      });

      const renderedBuffer = await offlineCtx.startRendering();
      const mp3Blob = audioBufferToMp3(renderedBuffer);
      const url = URL.createObjectURL(mp3Blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedSong.name} - ${nightcoreMode ? "Nightcore " : ""}Mix.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
      alert("Download failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isPlaying,
    isLoading,
    currentMixTime,
    mixDuration,
    playMix,
    stopMix,
    pauseMix,
    seekMix,
    handleDownload,
    analyserNodeRef,
  };
}

