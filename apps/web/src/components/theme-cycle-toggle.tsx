import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

const CYCLE = ['system', 'light', 'dark'] as const;
type Theme = (typeof CYCLE)[number];

export function ThemeCycleToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const idx = CYCLE.indexOf((theme ?? 'system') as Theme);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setTheme(next);
  };

  const current = (theme ?? 'system') as Theme;

  return (
    <button
      type="button"
      onClick={cycle}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle theme"
    >
      {current === 'system' && <Monitor className="h-[1.2rem] w-[1.2rem]" />}
      {current === 'light' && <Sun className="h-[1.2rem] w-[1.2rem]" />}
      {current === 'dark' && <Moon className="h-[1.2rem] w-[1.2rem]" />}
    </button>
  );
}
