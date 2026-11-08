import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "../hooks/useTheme";

const META: Record<ThemePreference, { icon: typeof Sun; label: string; next: string }> = {
  system: { icon: Monitor, label: "System theme", next: "light" },
  light: { icon: Sun, label: "Light theme", next: "dark" },
  dark: { icon: Moon, label: "Dark theme", next: "system" },
};

type Props = {
  className?: string;
  /** Show the current mode's name next to the icon. */
  showLabel?: boolean;
};

const ThemeToggle: React.FC<Props> = ({ className = "", showLabel = false }) => {
  const { preference, cycle } = useTheme();
  const { icon: Icon, label, next } = META[preference];

  return (
    <button
      type="button"
      onClick={cycle}
      className={`theme-toggle ${className}`}
      title={`${label} — click for ${next}`}
      aria-label={`${label}. Switch to ${next} theme`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {showLabel && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
};

export default ThemeToggle;
