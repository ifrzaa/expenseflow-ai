import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        inline-flex items-center gap-2
        rounded-full px-3 py-2
        bg-gray-200 text-gray-800 hover:bg-gray-300
        dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600
        transition text-sm font-medium
      "
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "🌞 Light" : "🌙 Dark"}
    </button>
  );
}
