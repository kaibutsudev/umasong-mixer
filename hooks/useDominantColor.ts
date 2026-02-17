"use client";

import { useState, useEffect } from "react";
import ColorThief from "colorthief";

export function useDominantColor(imageUrl: string | undefined): string {
  const [color, setColor] = useState<string>("#ec4899"); // Default pink-500

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    const onLoad = () => {
      try {
        const colorThief = new ColorThief();
        const result = colorThief.getColor(img);
        if (result) {
          const rgb = `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
          setColor(rgb);
        }
      } catch (e) {
        console.warn("Error extracting color, using default", e);
        setColor("#ec4899");
      }
    };
    
    // Also handle error
    img.onerror = () => {
        setColor("#ec4899");
    };

    if (img.complete) {
        onLoad();
    } else {
        img.onload = onLoad;
    }
  }, [imageUrl]);

  return color;
}
