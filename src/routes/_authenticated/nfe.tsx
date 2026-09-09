import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, FileUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/erp/ui-bits";
import { AdminOnly } from "@/lib/acl";
import { supabase } from "@/integrations/supabase/client";
import { brl, useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/nfe")({
  head: () => ({
    meta: [
      { title: "Entrada de Nota Fiscal | VisionFlow ERP" },
      {
        name: "description",
        content:
          "Importe o XML da NF-e, confira os itens, vincule aos filamentos ou produtos e atualize o estoque com lançamento em contas a pagar.",
      },
      { property: "og:title", content: "Entrada de NF-e — VisionFlow ERP" },
      {
        property: "og:description",
        content: "Conferência e entrada automatizada de notas fiscais.",
      },
    ],
  }),
  component: () => (
    <AdminOnly>
      <NfeEntrada />
    </AdminOnly>
  ),
});

type TargetType = "filamento" | "produto" | "nenhum";

interface DraftItem {
  key: string;
  description: string;
  qty: number;
  unitPrice: number;
  targetType: TargetType;
  targetId: string;
}

const emptyItem = (): DraftItem => ({
  key: crypto.randomUUID(),
  description: "",
  qty: 1,
  unitPrice: 0,
  targetType: "nenhum",
  targetId: "",
});

function text(node: Element | null | undefined, tag: string) {
  return node?.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

function NfeEntrada() {
  const { userId, filaments, products, updateFilament, updateProduct, addFinance } = useErp();
  const [accessKey, setAccessKey] = useState("");
  const [supplier, setSupplier] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);

  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  const readXml = async (file: File) => {
    const raw = await file.text();
    const doc = new DOMParser().parseFromString(raw, "application/xml");
    if (doc.getElementsByTagName("parsererror").length > 0) {
      toast.error("Arquivo XML inválido.");
      return;
    }
    const infNFe = doc.getElementsByTagName("infNFe")[0];
    const key = infNFe?.getAttribute("Id")?.replace(/\D/g, "") ?? "";
    if (key) setAccessKey(key);
    const emit = doc.getElementsByTagName("emit")[0];
    if (emit) setSupplier(text(emit, "xNome") || text(emit, "xFant"));
    const ide = doc.getElementsByTagName("ide")[0];
    const dh = text(ide, "dhEmi") || text(ide, "dEmi");
    if (dh) setIssueDate(dh.slice(0, 10));
    const dets = Array.from(doc.getElementsByTagName("det"));
    const parsed: DraftItem[] = dets.map((det) => {
      const prod = det.getElementsByTagName("prod")[0] ?? null;
      return {
        key: crypto.randomUUID(),
        description: text(prod, "xProd"),
        qty: Number(text(prod, "qCom")) || 0,
        unitPrice: Number(text(prod, "vUnCom")) || 0,
        targetType: "nenhum" as TargetType,
        targetId: "",
      };
    });
    setFileName(file.name);
    setItems(parsed.length > 0 ? parsed : [emptyItem()]);
    toast.success(`${parsed.length} item(ns) carregado(s) para conferência.`);
  };

  const patch = (key: string, p: Partial<DraftItem>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...p } : i)));

  const confirm = async () => {
    if (!userId) return;
    if (items.length === 0) {
      toast.error("Nenhum item para dar entrada.");
      return;
    }
    setSaving(true);
    const { data: imp, error } = await supabase
      .from("nfe_imports")
      .insert({
        user_id: userId,
        access_key: accessKey,
        supplier,
        issue_date: issueDate,
        total,
        file_name: fileName || null,
      })
      .select("id")
      .single();
    if (error || !imp) {
      setSaving(false);
      toast.error("Não foi possível registrar a entrada.");
      return;
    }
    await supabase.from("nfe_import_items").insert(
      items.map((i) => ({
        user_id: userId,
        import_id: imp.id,
        description: i.description,
        qty: i.qty,
        unit_price: i.unitPrice,
        target_type: i.targetType,
        target_id: i.targetId || null,
      })),
    );

    items.forEach((i) => {
      if (i.targetType === "filamento" && i.targetId) {
        const f = filaments.find((x) => x.id === i.targetId);
        if (f) {
          const grams = i.qty * 1000;
          updateFilament(f.id, {
            totalG: f.totalG + grams,
            remainingG: f.remainingG + grams,
            pricePerKg: i.unitPrice > 0 ? i.unitPrice : f.pricePerKg,
          });
        }
      }
      if (i.targetType === "produto" && i.targetId) {
        const p = products.find((x) => x.id === i.targetId);
        if (p && i.unitPrice > 0) updateProduct(p.id, { price: p.price });
      }
    });

    addFinance({
      kind: "payable",
      description:
        `Entrada NF-e ${accessKey ? accessKey.slice(-9) : ""} · ${items.length} item(ns)`.trim(),
      party: supplier || "Fornecedor",
      amount: total,
      dueDate: issueDate,
      status: "pendente",
      category: "Filamento/Insumo",
      invoiceNumber: accessKey.slice(25, 34),
      invoiceSeries: accessKey.slice(22, 25),
      invoicePath: null,
      invoiceName: fileName || null,
    });

    setSaving(false);
    setItems([]);
    setAccessKey("");
    setSupplier("");
    setFileName("");
    toast.success("Entrada confirmada: estoque atualizado e despesa lançada em Contas a Pagar.");
  };

  return (
    <div>
      <PageHeader
        title="Entrada de Nota Fiscal (NF-e)"
        subtitle="Importe o XML ou digite a chave, confira os itens e atualize estoque e contas a pagar."
      />

      <div className="grid gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="chave">Chave de acesso da NF-e (44 dígitos)</Label>
            <Input
              id="chave"
              value={accessKey}
              placeholder="0000 0000 0000 0000 …"
              onChange={(e) => setAccessKey(e.target.value.replace(/\D/g, "").slice(0, 44))}
            />
            <p className="text-xs text-muted-foreground">
              A leitura automática dos produtos acontece pelo arquivo XML. Digitando apenas a chave,
              informe os itens manualmente abaixo.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="forn">Fornecedor</Label>
            <Input id="forn" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emissao">Data de emissão</Label>
            <Input
              id="emissao"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <label className="cursor-pointer">
              <FileUp className="h-4 w-4" /> Carregar XML da NF-e
              <input
                type="file"
                accept=".xml,text/xml,application/xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void readXml(file);
                }}
              />
            </label>
          </Button>
          <Button variant="outline" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
            <Plus className="h-4 w-4" /> Adicionar item manual
          </Button>
          {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Conferência dos itens</p>
          <span className="text-sm font-bold tabular-nums">{brl(total)}</span>
        </div>
        {items.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nenhum item carregado. Importe o XML ou adicione itens manualmente.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((i) => (
              <div
                key={i.key}
                className="grid gap-2 p-3 lg:grid-cols-[2fr_90px_120px_150px_1fr_auto] lg:items-end"
              >
                <div className="grid gap-1">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    value={i.description}
                    onChange={(e) => patch(i.key, { description: e.target.value })}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    inputMode="decimal"
                    value={String(i.qty)}
                    onChange={(e) => patch(i.key, { qty: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Vlr. unitário</Label>
                  <Input
                    inputMode="decimal"
                    value={String(i.unitPrice)}
                    onChange={(e) => patch(i.key, { unitPrice: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Vincular a</Label>
                  <Select
                    value={i.targetType}
                    onValueChange={(v) =>
                      patch(i.key, { targetType: v as TargetType, targetId: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Não vincular</SelectItem>
                      <SelectItem value="filamento">Filamento</SelectItem>
                      <SelectItem value="produto">Produto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Item do cadastro</Label>
                  <Select
                    value={i.targetId}
                    disabled={i.targetType === "nenhum"}
                    onValueChange={(v) => patch(i.key, { targetId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(i.targetType === "filamento" ? filaments : products).map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {"brand" in opt ? `${opt.brand} ${opt.type} ${opt.color}` : opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setItems((prev) => prev.filter((x) => x.key !== i.key))}
                >
                  <Trash2 className="h-4 w-4 text-loss" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="lg" disabled={saving || items.length === 0} onClick={confirm}>
          <CheckCircle2 className="h-4 w-4" /> Confirmar entrada
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Itens vinculados a filamentos entram no estoque considerando a quantidade em quilos (1 = 1
        kg).
      </p>
    </div>
  );
}
