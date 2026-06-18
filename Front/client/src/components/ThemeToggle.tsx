import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className="grid h-11 w-11 place-items-center rounded-xl border border-vital-border bg-vital-panel text-vital-muted shadow-lg shadow-slate-900/10 transition hover:border-vital-blue/70 hover:text-vital-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60 dark:shadow-black/20"
    >
      <Icon size={20} strokeWidth={2.5} />
    </button>
  );
}
