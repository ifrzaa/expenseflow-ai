// src/components/ThemeToggle.tsx
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
}

export default function ThemeToggle({ theme, setTheme }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative w-16 h-8 flex items-center rounded-full transition-colors duration-500 overflow-hidden ${
        isDark ? "bg-[#505081]" : "bg-gray-300"
      }`}
    >
      {isDark && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-indigo-400 blur-md"
        />
      )}

      <motion.div
        layout
        animate={{
          x: isDark ? 32 : 0,
          boxShadow: isDark
            ? "0 0 12px 3px rgba(129,140,248,0.6)"
            : "0 0 10px 2px rgba(250,204,21,0.6)",
          backgroundColor: isDark ? "#EAEAEA" : "#FFFFFF",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 25,
        }}
        className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 ${
          isDark ? "text-[#0F0E47]" : "text-yellow-500"
        }`}
      >
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.div>
    </motion.button>
  );
}
