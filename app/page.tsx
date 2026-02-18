import { Suspense } from "react";
import SongMixer from "@/components/features/song-mixer/SongMixer";
import { songs } from "@/lib/data/musicdata";
import { characters } from "@/lib/data/characters";

/**
 * Main application entry point.
 * Wraps the SongMixer in a Suspense boundary to handle URL parameter initialization.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center text-white">
            <div className="animate-pulse text-lg font-medium tracking-widest text-[#ec4899]">
              LOADING MIXER...
            </div>
          </div>
        }
      >
        <SongMixer songs={songs} characterData={characters} />
      </Suspense>
    </main>
  );
}

