import { Suspense } from "react";
import SongMixer from "@/components/features/song-mixer/SongMixer";
import { songs } from "@/lib/data/musicdata";
import { characters } from "@/lib/data/characters";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center text-white">
            Loading Song Mixer...
          </div>
        }
      >
        <SongMixer songs={songs} characterData={characters} />
      </Suspense>
    </main>
  );
}
