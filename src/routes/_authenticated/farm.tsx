import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Pause, Play, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/erp/ui-bits";
import { EmptyState, QuickAdd } from "@/components/erp/QuickAdd";
import { useErp } from "@/lib/erp-store";
import type { PrinterStatus } from "@/lib/erp-types";

export const Route = createFileRoute("/_authenticated/farm")({
  head: () => ({
    meta: [
      { title: "Minha Farm | PrintFlow 2K Lab" },
      { name: "description", content: "Status em tempo real de cada impressora 3D: progresso, arquivo atual e manutenções." },
      { property: "og:title", content: "Minha Farm — PrintFlow" },
      { property: "og:description", content: "Gestão visual das impressoras da sua farm 3D." },
    ],
  }),
  component: Farm,
});

const statusMap: Record<PrinterStatus, { label: string; cls: string; dot: string }> = {
  disponivel: { label: "Disponível", cls: "border-profit/40 bg-profit/10 text-profit", dot: "bg-profit" },
  imprimindo: { label: "Imprimindo", cls: "border-info/40 bg-info/10 text-info", dot: "bg-info" },
  aguardando: { label: "Aguardando remoção", cls: "border-warn/40 bg-warn/10 text-warn", dot: "bg-warn" },
  manutencao: { label: "Manutenção", cls: "border-danger/40 bg-danger/10 text-danger", dot: "bg-danger" },
};

function Farm() {
  const { printers, setPrinterStatus, addPrinter } = useErp();

  return (
    <div>
      <PageHeader
        title="Minha Farm"
        subtitle={`${printers.length} impressoras cadastradas · status em tempo real`}
        action={
          <QuickAdd
            trigger="Nova impressora"
            title="Cadastrar impressora"
            successMessage="Impressora cadastrada!"
            fields={[
              { key: "name", label: "Nome", placeholder: "Bambu Lab P1S" },
              { key: "model", label: "Modelo", placeholder: "P1S CoreXY" },
              { key: "watts", label: "Potência (W)", numeric: true, defaultValue: "300" },
              { key: "dep", label: "Depreciação por hora (R$)", numeric: true, defaultValue: "1.00" },
            ]}
            onSubmit={(v) =>
              addPrinter({
                name: v['name'] || "Nova impressora",
                model: v['model'] || "",
                watts: Number(v['watts']) || 0,
                depreciationPerHour: Number(v['dep']) || 0,
              })
            }
          />
        }
      />
      {printers.length === 0 && <EmptyState text="Nenhuma impressora cadastrada ainda. Adicione a primeira máquina da sua farm." />}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {printers.map((p) => {
          const s = statusMap[p.status];
          return (
            <div key={p.id} className="flex flex-col rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.model}</p>
                </div>
                <Badge variant="outline" className={`shrink-0 gap-1.5 ${s.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </Badge>
              </div>

              <div className="mt-4 min-h-[64px]">
                {p.status === "imprimindo" ? (
                  <>
                    <p className="truncate text-xs text-muted-foreground">{p.currentFile}</p>
                    <Progress value={p.progress ?? 0} className="mt-2 h-2" />
                    <div className="mt-1.5 flex justify-between text-xs">
                      <span className="font-medium text-info">{p.progress}%</span>
                      <span className="text-muted-foreground">
                        restam {Math.floor((p.remainingMin ?? 0) / 60)}h{String((p.remainingMin ?? 0) % 60).padStart(2, "0")}
                      </span>
                    </div>
                  </>
                ) : p.status === "aguardando" ? (
                  <p className="rounded-lg bg-warn/10 p-3 text-xs text-warn">
                    Peça pronta na mesa: {p.currentFile}
                  </p>
                ) : p.status === "manutencao" ? (
                  <p className="rounded-lg bg-danger/10 p-3 text-xs text-danger">
                    Máquina parada — aguardando reparo técnico.
                  </p>
                ) : (
                  <p className="rounded-lg bg-profit/10 p-3 text-xs text-profit">Mesa livre e pronta para novo job.</p>
                )}
              </div>

              <div className="mt-3 flex justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{p.watts}W · {p.hoursRun}h rodadas</span>
                <span className="text-danger">{p.failures} falhas</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => { setPrinterStatus(p.id, "imprimindo"); toast.success(`${p.name}: impressão iniciada`); }}>
                  <Play className="h-3.5 w-3.5" /> Iniciar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setPrinterStatus(p.id, "aguardando"); toast(`${p.name} pausada`); }}>
                  <Pause className="h-3.5 w-3.5" /> Pausar
                </Button>
                <Button size="sm" onClick={() => { setPrinterStatus(p.id, "disponivel"); toast.success(`${p.name}: mesa liberada`); }}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Liberar mesa
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { setPrinterStatus(p.id, "manutencao"); toast.error(`${p.name} em manutenção`); }}>
                  <Wrench className="h-3.5 w-3.5" /> Manutenção
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}