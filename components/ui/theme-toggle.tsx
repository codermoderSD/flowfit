"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else if (stored === "light") {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    } else {
      // default: follow prefers-color-scheme
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
        setTheme("dark");
      } else {
        document.documentElement.classList.remove("dark");
        setTheme("light");
      }
    }
  }, []);

  const setDark = () => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
    setTheme("dark");
  };

  const setLight = () => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
    setTheme("light");
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={theme === "light" ? "default" : "ghost"}
        onClick={setLight}
      >
        Light
      </Button>
      <Button
        size="sm"
        variant={theme === "dark" ? "default" : "ghost"}
        onClick={setDark}
      >
        Dark
      </Button>
    </div>
  );
}
