"use client";

import { useEffect, useState } from "react";
import { THEME_KEY } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./Icons";

type Theme = "light" | "dark";

function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Alterna entre modo claro e escuro. Sem escolha salva, segue o sistema. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- o tema só é conhecido no navegador
  useEffect(() => setTheme(current()), []);

  const toggle = () => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    setTheme(next);
  };

  const label = theme === "dark" ? "Mudar para o modo claro" : "Mudar para o modo escuro";
  return (
    <button className="theme-toggle" type="button" onClick={toggle} aria-label={label} title={label}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
