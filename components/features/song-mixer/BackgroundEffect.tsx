import Image from "next/image";

interface BackgroundEffectProps {
  coverUrl: string;
}

export function BackgroundEffect({ coverUrl }: BackgroundEffectProps) {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-black/40 z-10" />
      <Image
        src={coverUrl}
        alt="Background"
        fill
        className="object-cover blur-[80px] scale-110 opacity-40 animate-pulse-slow"
        priority
      />
    </div>
  );
}
