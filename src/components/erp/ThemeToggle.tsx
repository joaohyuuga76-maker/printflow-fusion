import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/lib/theme";

export function ThemeToggle({ full, className }: { full?: boolean; className?: string }) {
  const { config, toggleMode } = useAppearance();
  const label = config.mode === "dark" ? "Modo claro" : "Modo escuro";
  const Icon = config.mode === "dark" ? Sun : Moon;

  if (full) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMode}
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
      onClick={toggleMode}
      title={label}
      aria-label={label}
      className={className ?? ""}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
