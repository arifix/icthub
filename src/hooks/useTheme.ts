import { useCallback, useEffect, useSyncExternalStore } from "react";

export type ThemePreference = "system" | "light" | "dark";

// Keep in sync with the pre-paint script in index.html.
const STORAGE_KEY = "icthub:theme";
const THEME_COLOR = { light: "#176b5b", dark: "#0e1513" } as const;
const ORDER: ThemePreference[] = ["system", "light", "dark"];

const media = () => window.matchMedia("(prefers-color-scheme: dark)");

const readPreference = (): ThemePreference => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
};

const resolve = (pref: ThemePreference): "light" | "dark" =>
  pref === "system" ? (media().matches ? "dark" : "light") : pref;

const apply = (pref: ThemePreference) => {
  const theme = resolve(pref);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
};

// Tiny shared store so every toggle on the page stays in sync.
const listeners = new Set<() => void>();
let current: ThemePreference = typeof window === "undefined" ? "system" : readPreference();

const setPreference = (pref: ThemePreference) => {
  current = pref;
  try {
    if (pref === "system") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // storage blocked: the choice still applies for this visit
  }
  // Briefly animate colours so a manual switch fades instead of flashing.
  const root = document.documentElement;
  root.classList.add("theme-transition");
  window.setTimeout(() => root.classList.remove("theme-transition"), 250);
  apply(pref);
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, () => current, () => "system" as ThemePreference);

  // Follow the device setting live while on "system"; sync choices made in other tabs.
  useEffect(() => {
    const mq = media();
    const onDeviceChange = () => current === "system" && apply("system");
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setPreference(readPreference());
    };
    mq.addEventListener("change", onDeviceChange);
    window.addEventListener("storage", onStorage);
    return () => {
      mq.removeEventListener("change", onDeviceChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const cycle = useCallback(() => {
    setPreference(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]);
  }, []);

  return { preference, setPreference, cycle };
}
