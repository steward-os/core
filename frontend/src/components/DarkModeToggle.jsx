import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export const DarkModeToggle = ({ onToggle, variant = "icon" }) => {
  // Check system preference on initial load
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  // Listen for system changes (only effective if user hasn't manually overridden)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      if (!localStorage.getItem("theme")) {
        setIsDark(e.matches);
      }
    };

    // Modern browsers use addEventListener
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = (newDark) => {
    if (newDark === isDark) return;
    setIsDark(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    if (onToggle) onToggle(newDark);
  };

  if (variant === "segmented") {
    return (
      <div className="flex p-1 bg-black/5 dark:bg-white/10 rounded-xl w-full overflow-hidden">
        <button
          onClick={() => setTheme(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${!isDark
              ? "bg-white dark:bg-gray-800 text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
        >
          <SunIcon className="w-4 h-4" />
          <span>Licht</span>
        </button>
        <button
          onClick={() => setTheme(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${isDark
              ? "bg-white dark:bg-gray-800 text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
        >
          <MoonIcon className="w-4 h-4" />
          <span>Donker</span>
        </button>
      </div>
    );
  }

  const toggleTheme = () => setTheme(!isDark);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
  );
};

export default DarkModeToggle;
