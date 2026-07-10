"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-11 h-11 rounded-full bg-foreground/5 animate-pulse" />;
  }

  const isDarkMode = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDarkMode ? "light" : "dark")}
      className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors border border-transparent hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </button>
  );
}
