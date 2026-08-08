import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/erp/ui-bits";
import { brl, useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/fila")({
  head: () => ({
    meta: [
      { title: "Fila de Impressão | PrintFlow 2K Lab" },
      { name: "description", content: "Peças prontas para rodar organizadas por prioridade, peso e tempo estimado." },
      { property: "og:title", content: "Fila de Impressão — PrintFlow" },
      { property: "og:description", content: "Priorize os jobs da sua farm 3D." },
    ],
  }),
  component: Fila,
});

const order = { alta: 0, media: 1, baixa: 2 } as const;

function Fila() {
  const { orders, moveOrder } = useErp();
  const queue = orders
    .filter((o) => o.stage === "fila" || o.stage === "aprovado")
    .sort((a, b) => order[a.priority] - order[b.priority]);

  return (
    <div>
      <PageHeader title="Fila de Impressão" subtitle={`${queue.length} jobs aguardando máquina livre`} />
      <div className="space-y-3">
        {queue.map((o, i) => (
          <div key={o.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-xl border border-border bg-card p-4 sm:flex sm:justify-between">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-sm font-bold">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate font-medium">{o.title}</p>
                <Badge
                  variant="outline"
                  className={
                    o.priority === "alta"
                      ? "border-danger/40 text-danger"
                      : o.priority === "media"
                        ? "border-warn/40 text-warn"
                        : "border-border text-muted-foreground"
                  }
                >
                  {o.priority}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {o.ref} · {o.client} · {o.weightG}g · {o.hours}h · {brl(o.value)}
              </p>
            </div>
            <Button
              size="sm"
              className="col-span-2 sm:col-auto"
              onClick={() => { moveOrder(o.id, "impressao"); toast.success(`${o.ref} enviado para impressão`); }}
            >
              <Play className="h-3.5 w-3.5" /> Rodar agora
            </Button>
          </div>
        ))}
        {queue.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum job na fila.
          </p>
        )}
      </div>
    </div>
  );
}