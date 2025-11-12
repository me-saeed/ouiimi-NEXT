/**
 * Dynamic Color Scheme Configuration
 * This module allows for easy color scheme changes across the application
 */

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
}

export const colorSchemes: Record<string, ColorScheme> = {
  default: {
    primary: "120 60% 67%", // #77dd77 - MERN primary green (exact match)
    secondary: "23 100% 61%", // #FF8439 - MERN secondary orange (exact match)
    accent: "0 0% 96.1%",
    background: "0 0% 97%", // #F8F8F8 - MERN background (exact match)
    foreground: "72 6% 17%", // #2C2D28 - MERN black (exact match)
    muted: "0 0% 52%", // #858585 - MERN gray (exact match)
    destructive: "0 84.2% 60.2%",
    border: "214.3 31.8% 91.4%",
    input: "214.3 31.8% 91.4%",
    ring: "120 60% 67%", // Match primary
  },
  dark: {
    primary: "120 60% 67%", // Keep MERN primary green
    secondary: "23 100% 61%", // Keep MERN secondary orange
    accent: "72 6% 15%",
    background: "72 6% 10%",
    foreground: "0 0% 97%",
    muted: "0 0% 65%",
    destructive: "0 62.8% 30.6%",
    border: "72 6% 20%",
    input: "72 6% 20%",
    ring: "120 60% 67%",
  },
};

export function getColorScheme(name: string = "default"): ColorScheme {
  return colorSchemes[name] || colorSchemes.default;
}

export function applyColorScheme(scheme: ColorScheme): void {
  if (typeof window !== "undefined") {
    const root = document.documentElement;
    root.style.setProperty("--primary", scheme.primary);
    root.style.setProperty("--secondary", scheme.secondary);
    root.style.setProperty("--accent", scheme.accent);
    root.style.setProperty("--background", scheme.background);
    root.style.setProperty("--foreground", scheme.foreground);
    root.style.setProperty("--muted", scheme.muted);
    root.style.setProperty("--destructive", scheme.destructive);
    root.style.setProperty("--border", scheme.border);
    root.style.setProperty("--input", scheme.input);
    root.style.setProperty("--ring", scheme.ring);
  }
}

