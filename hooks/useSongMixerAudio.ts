import { useState, useRef, useEffect, useCallback } from "react";
import { Song } from "@/lib/data/musicdata";
import { Singer } from "@/types";
import { audioBufferToMp3 } from "@/utils/mp3Encoder";

interface UseSongMixerAudioProps {
  selectedSong: Song | null;
  selectedSingers: Singer[];
  useAudience: boolean;
  volume: number;
}

export function useSongMixerAudio({
  selectedSong,
  selectedSingers,
  useAudience,
  volume,
}: UseSongMixerAudioProps) {
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMixTime, setCurrentMixTime] = useState(0);
  const [mixDuration, setMixDuration] = useState(0);

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  // Playback Refs
  const audioBuffersRef = useRef<{ [key: string]: AudioBuffer }>({});
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const requestAnimationFrameRef = useRef<number | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();
    const gainNode = audioContextRef.current.createGain();

    // Create Analyser
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256; // Good balance for visualizers

    // Connect: Gain -> Analyser -> Destination
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

  // Handle Volume Changes
  useEffect(() => {
    if (gainNodeRef.current) {
      console.log("Setting volume to:", volume);
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Preload Buffer Logic
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

  // Helper: Stop Mix
  const stopMix = useCallback(() => {
    sourceNodesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch (e) {
        // ignore
      }
    });
    sourceNodesRef.current = [];
    setIsPlaying(false);

    if (requestAnimationFrameRef.current) {
      cancelAnimationFrame(requestAnimationFrameRef.current);
      requestAnimationFrameRef.current = null;
    }
  }, []);

  // Helper: Update Progress
  const updateProgress = useCallback(() => {
    if (audioContextRef.current) {
      const elapsed =
        audioContextRef.current.currentTime -
        startTimeRef.current +
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
  }, [mixDuration, stopMix]);

  // Helper: Load Buffers
  const loadAudioBuffers = async (): Promise<boolean> => {
    // console.log("Loading audio buffers for:", selectedSong?.name);
    if (!selectedSong || !audioContextRef.current) {
      return false;
    }

    const audioCtx = audioContextRef.current;

    // Load both clean/crowd + singers to ensure seamless toggle
    const bgmUrls = [selectedSong.clean_song, selectedSong.crowd_audio].filter(
      (url) => !!url,
    );
    // Only try to load non-empty file paths
    const voiceUrls = selectedSingers
      .map((s) => s.file)
      .filter((f) => !!f && f.length > 0);
    const urlsToLoad = Array.from(new Set([...bgmUrls, ...voiceUrls]));
    // console.log("URLs to load:", urlsToLoad);

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
              // console.log("Loaded buffer:", url);
            } catch (innerErr) {
              console.warn(`Failed to load audio: ${url}`, innerErr);
              // Continue loading others
            }
          }
        }),
      );
      // Update max duration based on what we have
      let maxDur = 0;
      if (
        selectedSong.clean_song &&
        audioBuffersRef.current[selectedSong.clean_song]
      ) {
        maxDur = audioBuffersRef.current[selectedSong.clean_song].duration;
      }
      setMixDuration(maxDur);
      // console.log("Buffers loaded. Duration:", maxDur);

      return true;
    } catch (error) {
      console.error("Error loading buffers", error);
      return false;
    }
  };

  // Helper: Play Mix Internal
  const playMixInternal = async (startOffset: number = 0) => {
    // console.log("playMixInternal called. Offset:", startOffset);
    if (!audioContextRef.current || !gainNodeRef.current) return;

    // Force volume update
    gainNodeRef.current.gain.value = volume;
    // console.log("Master Gain Value:", gainNodeRef.current.gain.value);

    // Resume context if suspended (policy check)
    // We do NOT add await here in render loop to avoid blocking UI frame,
    // but the validation should happen in the user-event handler.
    const audioCtx = audioContextRef.current;
    if (audioCtx.state === "suspended") {
      // console.log("Resuming suspended context in internal...");
      audioCtx.resume();
    }

    const bgmUrl = useAudience
      ? selectedSong?.crowd_audio
      : selectedSong?.clean_song;
    if (!bgmUrl) return;

    const voiceUrls = selectedSingers.map((s) => s.file);
    const urls = [bgmUrl, ...voiceUrls];

    const sources: AudioBufferSourceNode[] = [];
    const currentTime = audioCtx.currentTime;

    urls.forEach((url) => {
      const buffer = audioBuffersRef.current[url];
      if (buffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNodeRef.current!);
        source.start(currentTime, startOffset);
        sources.push(source);
        // console.log("Started source for:", url);
      }
    });

    sourceNodesRef.current = sources;
    startTimeRef.current = currentTime;
    offsetRef.current = startOffset;
    setIsPlaying(true);
    // console.log("Playback started. Sources:", sources.length);

    if (requestAnimationFrameRef.current) {
      cancelAnimationFrame(requestAnimationFrameRef.current);
    }
    requestAnimationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  // Main Action: Play
  const playMix = async () => {
    // console.log("playMix called. Song:", selectedSong?.name);
    if (!selectedSong) return;

    const audioCtx = audioContextRef.current;
    // console.log("Audio Context State:", audioCtx?.state);

    // If paused (suspended) AND we have active sources, just resume
    if (
      audioCtx &&
      audioCtx.state === "suspended" &&
      sourceNodesRef.current.length > 0
    ) {
      // console.log("Resuming existing sources...");
      await audioCtx.resume();
      setIsPlaying(true);
      requestAnimationFrameRef.current = requestAnimationFrame(updateProgress);
      return;
    }

    // If context is suspended but we need to start fresh (e.g. first play or after singer change),
    // ensure we resume it before creating new sources.
    if (audioCtx && audioCtx.state === "suspended") {
      // console.log("Resuming context before fresh start...");
      await audioCtx.resume();
    }

    // Normal Start Behavior
    stopMix(); // Clear any existing nodes
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

  // Main Action: Pause
  const pauseMix = () => {
    if (audioContextRef.current?.state === "running") {
      audioContextRef.current.suspend();
      setIsPlaying(false);
    }
  };

  // Main Action: Seek
  const seekMix = (time: number) => {
    if (!selectedSong || selectedSingers.length === 0) return;
    stopMix();
    // Assume already loaded if seeking
    playMixInternal(time);
  };

  // Handle Audience Toggle Live
  useEffect(() => {
    if (isPlaying) {
      // calculate current time and seamless seek
      const currentTime =
        offsetRef.current +
        (audioContextRef.current?.currentTime || 0) -
        startTimeRef.current;
      // re-trigger play with new track
      // We do this by stopping current sources and starting new ones at same offset
      // But we must NOT use stopMix() clearing "isPlaying" state if we want seamless.
      // Actually stopMix() sets isPlaying false. Let's manually swap sources or just re-call seek logic.
      // Calling seekMix(currentTime) effectively stops and restarts.

      // We need to stop old sources first manually to avoid "stopMix" state side effects if we want to stay "playing"
      // reuse seek logic:
      seekMix(currentTime);
    }
  }, [useAudience]);

  // Helper: Download
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
      const voiceUrls = selectedSingers.map((s) => s.file);
      const urls = [bgmUrl, ...voiceUrls];

      const buffers = await Promise.all(
        urls.map(async (url) => {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          return await audioCtx.decodeAudioData(arrayBuffer);
        }),
      );

      const maxDuration = Math.max(...buffers.map((b) => b.duration));
      const offlineCtx = new OfflineAudioContext(2, maxDuration * 44100, 44100);

      buffers.forEach((buffer) => {
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(offlineCtx.destination);
        source.start(0);
      });

      const renderedBuffer = await offlineCtx.startRendering();
      const mp3Blob = audioBufferToMp3(renderedBuffer);
      const url = URL.createObjectURL(mp3Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedSong.name} - Mix.mp3`;
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
