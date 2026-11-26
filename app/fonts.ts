import { Corben, Manrope } from "next/font/google";

// Manrope for headings and body text, Corben only as an accent (accent words, Satria's wordmark).
export const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
export const corben = Corben({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-corben", display: "swap" });
