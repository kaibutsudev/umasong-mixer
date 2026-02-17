"use client";

import { useEffect, useRef } from "react";

interface ParticleBackgroundProps {
  isPlaying: boolean;
  accentColor?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  growing: boolean;
}

export default function ParticleBackground({
  isPlaying,
  accentColor = "#ec4899",
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Refs to track props without re-triggering effect
  const isPlayingRef = useRef(isPlaying);
  const colorRef = useRef(accentColor);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    colorRef.current = accentColor;
  }, [accentColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
        // Set canvas to full window size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    };

    const initParticles = () => {
      const count = 60; // Base count
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(canvas.width, canvas.height));
      }
      particlesRef.current = particles;
    };

    const createParticle = (w: number, h: number): Particle => {
       return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2,
          alpha: Math.random() * 0.5 + 0.1,
          growing: Math.random() > 0.5
       };
    };

    window.addEventListener("resize", resize);
    resize();

    const render = () => {
      animationRef.current = requestAnimationFrame(render);
      
      // Clear with slight fade for trail effect? No, just clear for clean stars.
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const playing = isPlayingRef.current;
      const speedMult = playing ? 3.0 : 0.5; // Faster when playing
      const color = colorRef.current;

      // Update and Draw
      particlesRef.current.forEach((p) => {
        // Move
        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Twinkle (alpha)
        if (playing) {
            if (p.growing) {
                p.alpha += 0.02;
                if (p.alpha >= 1) p.growing = false;
            } else {
                p.alpha -= 0.02;
                if (p.alpha <= 0.2) p.growing = true;
            }
        }

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (playing ? 1.5 : 1), 0, Math.PI * 2);
        
        // Color mix: White + Accent
        // We'll use globalCompositeOperation or just fillStyle
        // Let's use accent color with low opacity for glow, white for core
        
        ctx.fillStyle = color;
        ctx.globalAlpha = p.alpha * 0.6; // Tint
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        
        ctx.globalAlpha = 1.0;
      });

      // Connect particles with lines if close (constellation effect) - Optional, maybe too noisy?
      // Let's skip for "subtle particles"
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen"
    />
  );
}
