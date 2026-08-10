import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";
const KEY = "printflow-theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme | null) ?? "dark";
    setTheme(stored);
    apply(stored);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem(KEY, next);
      apply(next);
      return next;
    });
  };

  return { theme, toggle };
}

export function ThemeToggle({ full, className }: { full?: boolean; className?: string }) {
  const { theme, toggle } = useTheme();
  const label = theme === "dark" ? "Modo claro" : "Modo escuro";
  const Icon = theme === "dark" ? Sun : Moon;

  if (full) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        title={label}
        aria-label={label}
        className={cn("w-full justify-start gap-3 px-3 text-muted-foreground", className)}
      >
        <Icon className="h-4 w-4" /> {label}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={label}
      aria-label={label}
      className={className ?? ""}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
