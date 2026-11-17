import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { nightMode, toggleNightMode } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleNightMode}
      aria-label="Night mode"
      aria-pressed={nightMode}
      title={nightMode ? 'Turn off night mode' : 'Turn on night mode'}
      className="shrink-0 text-slate-600 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-300"
    >
      {nightMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </Button>
  );
}
