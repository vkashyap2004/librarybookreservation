import { useEffect, useState } from 'react';

// Light/dark theme: remembers the choice and falls back to the system setting
export default function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* storage blocked: ignore */ }
  }, [dark]);

  return [dark, () => setDark((d) => !d)];
}
