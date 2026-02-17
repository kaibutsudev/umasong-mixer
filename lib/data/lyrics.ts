import { lyrics1004 } from "./lyrics/1004";
import { lyrics1005 } from "./lyrics/1005";
import { lyrics1009 } from "./lyrics/1009";
import { lyrics1028 } from "./lyrics/1028";

export type LyricLine = {
  time: number; // in seconds
  romaji: string;
  kanji: string;
  english: string;
};

export const songLyrics: Record<number, LyricLine[]> = {
  1004: lyrics1004,
  1009: lyrics1009,
  1005: lyrics1005,
  1028: lyrics1028,
};
