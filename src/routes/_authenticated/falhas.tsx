import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, StatCard } from "@/components/erp/ui-bits";
import { brl, useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/falhas")({
  head: () => ({
    meta: [
      { title: "Registro de Falhas | VisionFlow ERP" },
      {
        name: "description",
        content:
          "Histórico de peças perdidas, motivos técnicos e prejuízo em filamento da farm 3D.",
      },
      { property: "og:title", content: "Registro de Falhas — VisionFlow ERP" },
      {
        property: "og:description",
        content: "Controle de perdas e falhas técnicas na impressão 3D.",
      },
    ],
  }),
  component: Falhas,
});

function Falhas() {
  const { failures, printers, filaments, setFailureOpen } = useErp();
  const totalG = failures.reduce((s, f) => s + f.lostG, 0);
  const totalR = failures.reduce((s, f) => s + f.cost, 0);

  return (
    <div>
      <PageHeader
        title="Registro de Falhas"
        subtitle="Histórico de peças perdidas e falhas técnicas"
        action={
          <Button variant="destructive" onClick={() => setFailureOpen(true)}>
            <AlertTriangle className="h-4 w-4" /> Registrar Falha
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Falhas registradas"
          value={String(failures.length)}
          icon={AlertTriangle}
          tone="danger"
        />
        <StatCard
          label="Filamento perdido"
          value={`${totalG} g`}
          icon={AlertTriangle}
          tone="warn"
        />
        <StatCard label="Prejuízo total" value={brl(totalR)} icon={AlertTriangle} tone="danger" />
        <StatCard
          label="Custo médio/falha"
          value={brl(failures.length ? totalR / failures.length : 0)}
          icon={AlertTriangle}
          tone="production"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Impressora</TableHead>
              <TableHead>Filamento</TableHead>
              <TableHead>Perda</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Prejuízo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {failures.map((f) => {
              const p = printers.find((x) => x.id === f.printerId);
              const fil = filaments.find((x) => x.id === f.filamentId);
              return (
                <TableRow key={f.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {f.date}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{p?.name ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: fil?.hex }} />
                      {fil ? `${fil.type} ${fil.color}` : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-warn">{f.lostG}g</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{f.reason}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-danger">
                    {brl(f.cost)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
