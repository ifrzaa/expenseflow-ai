import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "theme"; // "light" | "dark"

export function useTheme() {
  // Try localStorage; else follow OS
  const getInitial = (): "light" | "dark" => {
    const saved = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };

  const [theme, setTheme] = useState<"light" | "dark">(getInitial);

  // Apply to <html> and save
  useEffect(() => {
    const root = document.documentElement; // <html>
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}
