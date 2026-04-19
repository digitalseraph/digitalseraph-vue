// app/utils/readingTime.ts

/**
 * Estimate reading time in minutes for a markdown or plain-text string.
 * Uses 220 words per minute. Minimum floor of 1 minute.
 */
export function readingMinutes(text: string): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
