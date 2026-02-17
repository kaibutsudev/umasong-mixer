"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  color?: string;
}

export default function AudioVisualizer({
  analyser,
  isPlaying,
  color = "#ec4899", // Default pink-500
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size (visualizer should be larger than the vinyl)
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Config
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = 170; // Slightly larger than max vinyl radius (160px)
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw circular bars
      const bars = 120; // More bars for smoother circle
      const step = Math.ceil(bufferLength / bars);
      
      for (let i = 0; i < bars; i++) {
        // Get frequency value
        const value = dataArray[i * step] || 0; 
        
        // Scale bar height - modulate with value
        const barHeight = (value / 255) * 100; // Max 100px length
        
        const angle = (i * 2 * Math.PI) / bars;
        
        // Start point (on the radius)
        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        
        // End point (outwards)
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        // Create gradient for the bar
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "transparent");
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        
        // Optional: Add glow only if value is high enough to save perf
        if (value > 100) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isPlaying, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 transition-opacity duration-500 ${isPlaying ? "opacity-100" : "opacity-0"}`}
      style={{
        width: "140%", // Scale relative to container
        height: "140%",
      }}
    />
  );
}
