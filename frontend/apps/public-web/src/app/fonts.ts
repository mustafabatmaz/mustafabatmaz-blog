import { Space_Grotesk, Space_Mono } from "next/font/google";

// Downloaded at build time and served from this site: the browser never contacts Google (5a decision 3).
// latin-ext carries ğ, ş, ı and İ.
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-space-grotesk",
});

export const spaceMono = Space_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});
