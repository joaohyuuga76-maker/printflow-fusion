import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fileToThumbnail } from "@/lib/image-utils";

export function ImageField({
  label,
  value,
  onChange,
  max = 480,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background/60">
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
            {value ? "Trocar foto" : "Enviar foto"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger"
              onClick={() => onChange("")}
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            void fileToThumbnail(file, max)
              .then(onChange)
              .catch(() => toast.error("Não foi possível carregar a imagem."));
          }}
        />
      </div>
    </div>
  );
}
