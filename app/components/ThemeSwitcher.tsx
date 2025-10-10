"use client";

import { useTheme } from './ThemeProvider';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="theme-switcher focusable" aria-label="Mudar tema">
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}