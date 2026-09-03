import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Banknote, CreditCard, LockKeyhole, Plus, QrCode, ShoppingCart, Trash2, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/erp/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { brl, useErp } from "@/lib/erp-store";

export const Route = createFileRoute("/_authenticated/pdv")({
  head: () => ({
    meta: [
      { title: "Frente de Caixa (PDV) | VisionFlow ERP" },
      {
        name: "description",
        content:
          "Abertura e fechamento de caixa, registro de vendas em dinheiro, Pix e cartão e resumo diário para conferência.",
      },
      { property: "og:title", content: "Frente de Caixa — VisionFlow ERP" },
      { property: "og:description", content: "PDV com controle de caixa diário da sua farm 3D." },
    ],
  }),
  component: Pdv,
});

type Payment = "dinheiro" | "pix" | "cartao";

const paymentLabels: Record<Payment, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
};

interface CartItem {
  key: string;
  productId: string | null;
  name: string;
  qty: number;
  unitPrice: number;
}

interface SaleRow {
  id: string;
  client: string;
  payment_method: string;
  total: number;
  created_at: string;
}

interface SessionRow {
  id: string;
  opening_amount: number;
  opened_at: string;
}

function Pdv() {
  const { products, clients, userId, updateProduct, addFinance } = useErp();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCash, setOpenCash] = useState(false);
  const [closeCash, setCloseCash] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [opening, setOpening] = useState("0");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [client, setClient] = useState("");
  const [payment, setPayment] = useState<Payment>("dinheiro");
  const [discount, setDiscount] = useState("0");
  const [manual, setManual] = useState({ name: "", qty: "1", price: "0" });

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("cash_sessions")
        .select("id, opening_amount, opened_at")
        .eq("status", "aberto")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSession({ ...data, opening_amount: Number(data.opening_amount) });
        const { data: rows } = await supabase
          .from("sales")
          .select("id, client, payment_method, total, created_at")
          .eq("cash_session_id", data.id)
          .order("created_at", { ascending: false });
        setSales((rows ?? []).map((r) => ({ ...r, total: Number(r.total) })));
      }
      setLoading(false);
    })();
  }, []);

  const totals = useMemo(() => {
    const by = (m: string) =>
      sales.filter((s) => s.payment_method === m).reduce((acc, s) => acc + s.total, 0);
    const dinheiro = by("dinheiro");
    const pix = by("pix");
    const cartao = by("cartao");
    return {
      dinheiro,
      pix,
      cartao,
      total: dinheiro + pix + cartao,
      esperadoGaveta: (session?.opening_amount ?? 0) + dinheiro,
    };
  }, [sales, session]);

  const cartTotal = Math.max(
    0,
    cart.reduce((s, i) => s + i.qty * i.unitPrice, 0) - (Number(discount) || 0),
  );

  const handleOpenCash = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("cash_sessions")
      .insert({ user_id: userId, opening_amount: Number(opening) || 0 })
      .select("id, opening_amount, opened_at")
      .single();
    if (error || !data) {
      toast.error("Não foi possível abrir o caixa.");
      return;
    }
    setSession({ ...data, opening_amount: Number(data.opening_amount) });
    setSales([]);
    setOpenCash(false);
    toast.success("Caixa aberto.");
  };

  const handleCloseCash = async () => {
    if (!session) return;
    await supabase
      .from("cash_sessions")
      .update({
        status: "fechado",
        closed_at: new Date().toISOString(),
        closing_amount: totals.esperadoGaveta,
        notes,
      })
      .eq("id", session.id);
    setSession(null);
    setSales([]);
    setNotes("");
    setCloseCash(false);
    toast.success("Caixa fechado com sucesso.");
  };

  const addProductToCart = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setCart((prev) => {
      const found = prev.find((i) => i.productId === p.id);
      if (found)
        return prev.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [
        ...prev,
        { key: crypto.randomUUID(), productId: p.id, name: p.name, qty: 1, unitPrice: p.price },
      ];
    });
  };

  const addManual = () => {
    if (!manual.name.trim()) return;
    setCart((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        productId: null,
        name: manual.name.trim(),
        qty: Number(manual.qty) || 1,
        unitPrice: Number(manual.price) || 0,
      },
    ]);
    setManual({ name: "", qty: "1", price: "0" });
  };

  const finishSale = async () => {
    if (!userId || !session) return;
    if (cart.length === 0) {
      toast.error("Adicione ao menos um item.");
      return;
    }
    const { data, error } = await supabase
      .from("sales")
      .insert({
        user_id: userId,
        cash_session_id: session.id,
        client,
        payment_method: payment,
        discount: Number(discount) || 0,
        total: cartTotal,
      })
      .select("id, client, payment_method, total, created_at")
      .single();
    if (error || !data) {
      toast.error("Não foi possível registrar a venda.");
      return;
    }
    await supabase.from("sale_items").insert(
      cart.map((i) => ({
        user_id: userId,
        sale_id: data.id,
        product_id: i.productId,
        name: i.name,
        qty: i.qty,
        unit_price: i.unitPrice,
      })),
    );
    cart.forEach((i) => {
      if (!i.productId) return;
      const p = products.find((x) => x.id === i.productId);
      if (p) updateProduct(p.id, { sold: p.sold + i.qty });
    });
    addFinance({
      kind: "receivable",
      description: `Venda PDV · ${cart.map((i) => i.name).join(", ").slice(0, 60)}`,
      party: client || "Consumidor final",
      amount: cartTotal,
      dueDate: new Date().toISOString().slice(0, 10),
      status: "pago",
      category: "Venda Direta",
      invoiceNumber: "",
      invoiceSeries: "",
      invoicePath: null,
      invoiceName: null,
    });
    setSales((prev) => [{ ...data, total: Number(data.total) }, ...prev]);
    setCart([]);
    setClient("");
    setDiscount("0");
    setSaleOpen(false);
    toast.success(`Venda de ${brl(cartTotal)} registrada.`);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando caixa…</p>;

  return (
    <div>
      <PageHeader
        title="Frente de Caixa (PDV)"
        subtitle="Abertura e fechamento de caixa diário, vendas rápidas em Pix, dinheiro e cartão."
        action={
          session ? (
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={() => setSaleOpen(true)}>
                <ShoppingCart className="h-4 w-4" /> Iniciar Venda
              </Button>
              <Button variant="outline" onClick={() => setCloseCash(true)}>
                <LockKeyhole className="h-4 w-4" /> Fechar Caixa
              </Button>
            </div>
          ) : (
            <Button size="lg" onClick={() => setOpenCash(true)}>
              <Unlock className="h-4 w-4" /> Abrir Caixa
            </Button>
          )
        }
      />

      {!session ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-medium">Caixa fechado</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Para realizar a primeira venda do dia é obrigatório abrir o caixa informando o saldo
            inicial (troco).
          </p>
          <Button className="mt-4" onClick={() => setOpenCash(true)}>
            <Unlock className="h-4 w-4" /> Abrir Caixa
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Saldo inicial", value: brl(session.opening_amount), icon: Banknote },
              { label: "Dinheiro", value: brl(totals.dinheiro), icon: Banknote },
              { label: "Pix", value: brl(totals.pix), icon: QrCode },
              { label: "Cartão", value: brl(totals.cartao), icon: CreditCard },
              { label: "Total vendido", value: brl(totals.total), icon: ShoppingCart },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <c.icon className="h-3.5 w-3.5" /> {c.label}
                </div>
                <p className="mt-1 text-lg font-bold tabular-nums">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Vendas do caixa atual</p>
              <Badge variant="outline">{sales.length} venda(s)</Badge>
            </div>
            {sales.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma venda registrada neste caixa.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {sales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.client || "Consumidor final"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {paymentLabels[s.payment_method as Payment] ?? s.payment_method}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">{brl(s.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={openCash} onOpenChange={setOpenCash}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abertura de caixa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="opening">Saldo inicial / troco (R$)</Label>
            <Input
              id="opening"
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleOpenCash}>Abrir caixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeCash} onOpenChange={setCloseCash}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechamento de caixa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 text-sm">
            {[
              ["Saldo inicial", brl(session?.opening_amount ?? 0)],
              ["Dinheiro", brl(totals.dinheiro)],
              ["Pix", brl(totals.pix)],
              ["Cartão", brl(totals.cartao)],
              ["Total vendido", brl(totals.total)],
              ["Saldo final em gaveta", brl(totals.esperadoGaveta)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium tabular-nums">{v}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações da conferência</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseCash(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCloseCash}>Confirmar fechamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saleOpen} onOpenChange={setSaleOpen}>
        <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova venda</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Input
                list="pdv-clients"
                value={client}
                placeholder="Consumidor final"
                onChange={(e) => setClient(e.target.value)}
              />
              <datalist id="pdv-clients">
                {clients.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-2">
              <Label>Forma de pagamento</Label>
              <Select value={payment} onValueChange={(v) => setPayment(v as Payment)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {products.length > 0 && (
            <div className="grid gap-2">
              <Label>Adicionar do catálogo</Label>
              <Select value="" onValueChange={addProductToCart}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {brl(p.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-[1fr_80px_110px_auto] sm:items-end">
            <div className="grid gap-2">
              <Label>Item avulso</Label>
              <Input
                value={manual.name}
                placeholder="Ex.: Peça sob medida"
                onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
              />
            </div>
            <Input
              inputMode="decimal"
              value={manual.qty}
              onChange={(e) => setManual((m) => ({ ...m, qty: e.target.value }))}
            />
            <Input
              inputMode="decimal"
              value={manual.price}
              onChange={(e) => setManual((m) => ({ ...m, price: e.target.value }))}
            />
            <Button type="button" variant="outline" onClick={addManual}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-xl border border-border">
            {cart.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Carrinho vazio.</p>
            ) : (
              cart.map((i) => (
                <div
                  key={i.key}
                  className="flex items-center gap-2 border-b border-border px-3 py-2 last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{i.name}</span>
                  <Input
                    className="w-16"
                    inputMode="decimal"
                    value={String(i.qty)}
                    onChange={(e) =>
                      setCart((prev) =>
                        prev.map((x) =>
                          x.key === i.key ? { ...x, qty: Number(e.target.value) || 0 } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    className="w-24"
                    inputMode="decimal"
                    value={String(i.unitPrice)}
                    onChange={(e) =>
                      setCart((prev) =>
                        prev.map((x) =>
                          x.key === i.key ? { ...x, unitPrice: Number(e.target.value) || 0 } : x,
                        ),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCart((prev) => prev.filter((x) => x.key !== i.key))}
                  >
                    <Trash2 className="h-4 w-4 text-loss" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="grid w-32 gap-2">
              <Label>Desconto (R$)</Label>
              <Input
                inputMode="decimal"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <p className="text-right text-xl font-bold tabular-nums">{brl(cartTotal)}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={finishSale}>Finalizar venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}