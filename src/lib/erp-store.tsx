import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Client,
  ExtraCost,
  Failure,
  Filament,
  FinanceEntry,
  Order,
  OrderStage,
  Printer,
  Product,
  Settings,
} from "./erp-types";
import {
  readLocalImages,
  readLocalSettings,
  removeLocalImage,
  saveLocalImage,
  writeLocalSettings,
} from "./local-cache";

const defaultSettings: Settings = {
  company: "Minha Farm 3D",
  cnpj: "",
  energyRate: 0.92,
  defaultMargin: 120,
  failureRate: 5,
  phone: "",
  pixKey: "",
  logoUrl: null,
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

interface Store {
  loading: boolean;
  userId: string | null;
  printers: Printer[];
  filaments: Filament[];
  orders: Order[];
  products: Product[];
  clients: Client[];
  failures: Failure[];
  extras: ExtraCost[];
  finance: FinanceEntry[];
  settings: Settings;
  setPrinterStatus: (id: string, status: Printer["status"]) => void;
  moveOrder: (id: string, stage: OrderStage) => void;
  addOrder: (o: Omit<Order, "id">) => void;
  addPrinter: (p: Omit<Printer, "id" | "hoursRun" | "failures" | "status">) => void;
  addFilament: (f: Omit<Filament, "id">) => void;
  addProduct: (p: Omit<Product, "id" | "sold">) => void;
  addClient: (c: Omit<Client, "id" | "orders" | "total">) => void;
  addExtra: (e: Omit<ExtraCost, "id">) => void;
  updatePrinter: (id: string, patch: Partial<Printer>) => void;
  deletePrinter: (id: string) => void;
  updateFilament: (id: string, patch: Partial<Filament>) => void;
  deleteFilament: (id: string) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addFinance: (e: Omit<FinanceEntry, "id">) => void;
  updateFinance: (id: string, patch: Partial<FinanceEntry>) => void;
  deleteFinance: (id: string) => void;
  consumeFilament: (id: string, grams: number) => void;
  addFailure: (f: Omit<Failure, "id" | "cost" | "date">) => void;
  updateSettings: (s: Partial<Settings>) => void;
  failureOpen: boolean;
  setFailureOpen: (v: boolean) => void;
}

const ErpContext = createContext<Store | null>(null);

export function ErpProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [extras, setExtras] = useState<ExtraCost[]>([]);
  const [finance, setFinance] = useState<FinanceEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [failureOpen, setFailureOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (!active) return;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }

      const [pr, fi, or_, pd, cl, fa, ex, st, fn] = await Promise.all([
        supabase.from("printers").select("*").order("created_at"),
        supabase.from("filaments").select("*").order("created_at"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at"),
        supabase.from("clients").select("*").order("created_at"),
        supabase.from("failures").select("*").order("created_at", { ascending: false }),
        supabase.from("extra_costs").select("*").order("created_at"),
        supabase.from("settings").select("*").maybeSingle(),
        supabase.from("finance_entries").select("*").order("due_date"),
      ]);
      if (!active) return;

      setFinance(
        (fn.data ?? []).map((e) => ({
          id: e.id,
          kind: e.kind as FinanceEntry["kind"],
          description: e.description,
          party: e.party,
          amount: Number(e.amount),
          dueDate: e.due_date,
          status: e.status as FinanceEntry["status"],
          category: e.category,
          invoiceNumber: e.invoice_number ?? "",
          invoiceSeries: e.invoice_series ?? "",
          invoicePath: e.invoice_path ?? null,
          invoiceName: e.invoice_name ?? null,
        })),
      );

      setPrinters(
        (pr.data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          model: p.model,
          watts: Number(p.watts),
          depreciationPerHour: Number(p.depreciation_per_hour),
          status: p.status as Printer["status"],
          currentFile: p.current_file ?? undefined,
          progress: p.progress === null ? undefined : Number(p.progress),
          remainingMin: p.remaining_min === null ? undefined : Number(p.remaining_min),
          hoursRun: Number(p.hours_run),
          failures: p.failures,
        })),
      );
      const localFilamentImages = readLocalImages("filaments");
      const localProductImages = readLocalImages("products");
      setFilaments(
        (fi.data ?? []).map((f) => ({
          id: f.id,
          brand: f.brand,
          type: f.type as Filament["type"],
          color: f.color,
          hex: f.hex,
          totalG: Number(f.total_g),
          remainingG: Number(f.remaining_g),
          pricePerKg: Number(f.price_per_kg),
          imageUrl:
            (f as { image_url?: string | null }).image_url ?? localFilamentImages[f.id] ?? null,
        })),
      );
      setOrders(
        (or_.data ?? []).map((o) => ({
          id: o.id,
          ref: o.ref,
          client: o.client,
          title: o.title,
          value: Number(o.value),
          cost: Number(o.cost),
          stage: o.stage as OrderStage,
          date: o.date || shortDate(o.created_at),
          channel: o.channel,
          priority: o.priority as Order["priority"],
          weightG: Number(o.weight_g),
          hours: Number(o.hours),
        })),
      );
      setProducts(
        (pd.data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          weightG: Number(p.weight_g),
          hours: Number(p.hours),
          price: Number(p.price),
          sold: p.sold,
          imageUrl:
            (p as { image_url?: string | null }).image_url ?? localProductImages[p.id] ?? null,
        })),
      );
      const orderRows = or_.data ?? [];
      setClients(
        (cl.data ?? []).map((c) => {
          const own = orderRows.filter((o) => o.client === c.name);
          return {
            id: c.id,
            name: c.name,
            phone: c.phone,
            city: c.city,
            orders: own.length,
            total: own.reduce((s, o) => s + Number(o.value), 0),
          };
        }),
      );
      setFailures(
        (fa.data ?? []).map((f) => ({
          id: f.id,
          printerId: f.printer_id ?? "",
          filamentId: f.filament_id ?? "",
          lostG: Number(f.lost_g),
          reason: f.reason,
          notes: f.notes,
          date: shortDate(f.created_at),
          cost: Number(f.cost),
        })),
      );
      setExtras(
        (ex.data ?? []).map((e) => ({
          id: e.id,
          name: e.name,
          unitPrice: Number(e.unit_price),
          unit: e.unit,
        })),
      );
      if (st.data) {
        const localSettings = readLocalSettings<Settings>();
        setSettings({
          company: st.data.company,
          cnpj: st.data.cnpj,
          energyRate: Number(st.data.energy_rate),
          defaultMargin: Number(st.data.default_margin),
          failureRate: Number(st.data.failure_rate),
          phone: (st.data as { phone?: string }).phone ?? "",
          pixKey: (st.data as { pix_key?: string }).pix_key ?? "",
          logoUrl: (st.data as { logo_url?: string | null }).logo_url ?? null,
          ...localSettings,
        });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setPrinterStatus = useCallback<Store["setPrinterStatus"]>((id, status) => {
    const patch = {
      status,
      progress: status === "imprimindo" ? 1 : status === "aguardando" ? 100 : null,
      remaining_min: status === "imprimindo" ? 180 : 0,
      current_file: status === "disponivel" || status === "manutencao" ? null : "novo_job.gcode",
    };
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              progress: patch.progress ?? undefined,
              remainingMin: patch.remaining_min,
              currentFile:
                patch.current_file === null ? undefined : p.currentFile ?? "novo_job.gcode",
            }
          : p,
      ),
    );
    void supabase.from("printers").update(patch).eq("id", id);
  }, []);

  const moveOrder = useCallback<Store["moveOrder"]>((id, stage) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
    void supabase.from("orders").update({ stage }).eq("id", id);
  }, []);

  const addOrder = useCallback<Store["addOrder"]>(
    (o) => {
      if (!userId) return;
      void (async () => {
        const { data } = await supabase
          .from("orders")
          .insert({
            user_id: userId,
            ref: o.ref,
            client: o.client,
            title: o.title,
            value: o.value,
            cost: o.cost,
            stage: o.stage,
            date: o.date,
            channel: o.channel,
            priority: o.priority,
            weight_g: o.weightG,
            hours: o.hours,
          })
          .select()
          .single();
        if (data) setOrders((prev) => [{ ...o, id: data.id }, ...prev]);
      })();
    },
    [userId],
  );

  const addPrinter = useCallback<Store["addPrinter"]>(
    (p) => {
      if (!userId) return;
      void (async () => {
        const { data } = await supabase
          .from("printers")
          .insert({
            user_id: userId,
            name: p.name,
            model: p.model,
            watts: p.watts,
            depreciation_per_hour: p.depreciationPerHour,
          })
          .select()
          .single();
        if (data)
          setPrinters((prev) => [
            ...prev,
            { ...p, id: data.id, status: "disponivel", hoursRun: 0, failures: 0 },
          ]);
      })();
    },
    [userId],
  );

  const addFilament = useCallback<Store["addFilament"]>(
    (f) => {
      if (!userId) return;
      void (async () => {
        const { data } = await supabase
          .from("filaments")
          .insert({
            user_id: userId,
            brand: f.brand,
            type: f.type,
            color: f.color,
            hex: f.hex,
            total_g: f.totalG,
            remaining_g: f.remainingG,
            price_per_kg: f.pricePerKg,
            image_url: f.imageUrl ?? null,
          })
          .select()
          .single();
        if (data) {
          saveLocalImage("filaments", data.id, f.imageUrl ?? null);
          setFilaments((prev) => [...prev, { ...f, id: data.id }]);
        }
      })();
    },
    [userId],
  );

  const addProduct = useCallback<Store["addProduct"]>(
    (p) => {
      if (!userId) return;
      void (async () => {
        const { data } = await supabase
          .from("products")
          .insert({
            user_id: userId,
            name: p.name,
            category: p.category,
            weight_g: p.weightG,
            hours: p.hours,
            price: p.price,
            image_url: p.imageUrl ?? null,
          })
          .select()
          .single();
        if (data) {
          saveLocalImage("products", data.id, p.imageUrl ?? null);
          setProducts((prev) => [...prev, { ...p, id: data.id, sold: 0 }]);
        }
      })();
    },
    [userId],
  );

  const addClient = useCallback<Store["addClient"]>(
    (c) => {
      if (!userId) return;
      void (async () => {
        const { data } = await supabase
          .from("clients")
          .insert({ user_id: userId, name: c.name, phone: c.phone, city: c.city })
          .select()
          .single();
        if (data) setClients((prev) => [...prev, { ...c, id: data.id, orders: 0, total: 0 }]);
      })();
    },
    [userId],
  );

  const addExtra = useCallback<Store["addExtra"]>(
    (e) => {
      if (!userId) return;
      void (async () => {
        const { data } = await supabase
          .from("extra_costs")
          .insert({ user_id: userId, name: e.name, unit_price: e.unitPrice, unit: e.unit })
          .select()
          .single();
        if (data) setExtras((prev) => [...prev, { ...e, id: data.id }]);
      })();
    },
    [userId],
  );

  const consumeFilament = useCallback<Store["consumeFilament"]>(
    (id, grams) => {
      const current = filaments.find((f) => f.id === id);
      if (!current) return;
      const remaining = Math.max(0, current.remainingG - grams);
      setFilaments((prev) => prev.map((f) => (f.id === id ? { ...f, remainingG: remaining } : f)));
      void supabase.from("filaments").update({ remaining_g: remaining }).eq("id", id);
    },
    [filaments],
  );

  const addFailure = useCallback<Store["addFailure"]>(
    (f) => {
      if (!userId) return;
      const fil = filaments.find((x) => x.id === f.filamentId);
      const printer = printers.find((x) => x.id === f.printerId);
      const cost = fil ? (f.lostG / 1000) * fil.pricePerKg : 0;
      void (async () => {
        const { data } = await supabase
          .from("failures")
          .insert({
            user_id: userId,
            printer_id: f.printerId || null,
            filament_id: f.filamentId || null,
            lost_g: f.lostG,
            reason: f.reason,
            notes: f.notes,
            cost,
          })
          .select()
          .single();
        if (!data) return;
        setFailures((prev) => [
          { ...f, id: data.id, cost, date: shortDate(data.created_at) },
          ...prev,
        ]);
        if (fil) {
          const remaining = Math.max(0, fil.remainingG - f.lostG);
          setFilaments((prev) =>
            prev.map((x) => (x.id === fil.id ? { ...x, remainingG: remaining } : x)),
          );
          await supabase.from("filaments").update({ remaining_g: remaining }).eq("id", fil.id);
        }
        if (printer) {
          const count = printer.failures + 1;
          setPrinters((prev) =>
            prev.map((p) => (p.id === printer.id ? { ...p, failures: count } : p)),
          );
          await supabase.from("printers").update({ failures: count }).eq("id", printer.id);
        }
      })();
    },
    [userId, filaments, printers],
  );

  const updateSettings = useCallback<Store["updateSettings"]>(
    (s) => {
      setSettings((prev) => {
        const next = { ...prev, ...s };
        writeLocalSettings(next);
        if (userId) {
          void supabase.from("settings").upsert(
            {
              user_id: userId,
              company: next.company,
              cnpj: next.cnpj,
              energy_rate: next.energyRate,
              default_margin: next.defaultMargin,
              failure_rate: next.failureRate,
              phone: next.phone,
              pix_key: next.pixKey,
              logo_url: next.logoUrl,
            },
            { onConflict: "user_id" },
          );
        }
        return next;
      });
    },
    [userId],
  );

  const updatePrinter = useCallback<Store["updatePrinter"]>((id, patch) => {
    setPrinters((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const row = {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.model !== undefined ? { model: patch.model } : {}),
      ...(patch.watts !== undefined ? { watts: patch.watts } : {}),
      ...(patch.depreciationPerHour !== undefined ? { depreciation_per_hour: patch.depreciationPerHour } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.hoursRun !== undefined ? { hours_run: patch.hoursRun } : {}),
    };
    void supabase.from("printers").update(row).eq("id", id);
  }, []);

  const deletePrinter = useCallback<Store["deletePrinter"]>((id) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
    void supabase.from("printers").delete().eq("id", id);
  }, []);

  const updateFilament = useCallback<Store["updateFilament"]>((id, patch) => {
    if (patch.imageUrl !== undefined) saveLocalImage("filaments", id, patch.imageUrl ?? null);
    setFilaments((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    const row = {
      ...(patch.brand !== undefined ? { brand: patch.brand } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.hex !== undefined ? { hex: patch.hex } : {}),
      ...(patch.totalG !== undefined ? { total_g: patch.totalG } : {}),
      ...(patch.remainingG !== undefined ? { remaining_g: patch.remainingG } : {}),
      ...(patch.pricePerKg !== undefined ? { price_per_kg: patch.pricePerKg } : {}),
      ...(patch.imageUrl !== undefined ? { image_url: patch.imageUrl } : {}),
    };
    void supabase.from("filaments").update(row).eq("id", id);
  }, []);

  const deleteFilament = useCallback<Store["deleteFilament"]>((id) => {
    removeLocalImage("filaments", id);
    setFilaments((prev) => prev.filter((f) => f.id !== id));
    void supabase.from("filaments").delete().eq("id", id);
  }, []);

  const updateOrder = useCallback<Store["updateOrder"]>((id, patch) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    const row = {
      ...(patch.ref !== undefined ? { ref: patch.ref } : {}),
      ...(patch.client !== undefined ? { client: patch.client } : {}),
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.value !== undefined ? { value: patch.value } : {}),
      ...(patch.cost !== undefined ? { cost: patch.cost } : {}),
      ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
      ...(patch.channel !== undefined ? { channel: patch.channel } : {}),
      ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
      ...(patch.weightG !== undefined ? { weight_g: patch.weightG } : {}),
      ...(patch.hours !== undefined ? { hours: patch.hours } : {}),
    };
    void supabase.from("orders").update(row).eq("id", id);
  }, []);

  const deleteOrder = useCallback<Store["deleteOrder"]>((id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    void supabase.from("orders").delete().eq("id", id);
  }, []);

  const updateClient = useCallback<Store["updateClient"]>((id, patch) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const row = {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.city !== undefined ? { city: patch.city } : {}),
    };
    void supabase.from("clients").update(row).eq("id", id);
  }, []);

  const deleteClient = useCallback<Store["deleteClient"]>((id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    void supabase.from("clients").delete().eq("id", id);
  }, []);

  const updateProduct = useCallback<Store["updateProduct"]>((id, patch) => {
    if (patch.imageUrl !== undefined) saveLocalImage("products", id, patch.imageUrl ?? null);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const row = {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.weightG !== undefined ? { weight_g: patch.weightG } : {}),
      ...(patch.hours !== undefined ? { hours: patch.hours } : {}),
      ...(patch.price !== undefined ? { price: patch.price } : {}),
      ...(patch.sold !== undefined ? { sold: patch.sold } : {}),
      ...(patch.imageUrl !== undefined ? { image_url: patch.imageUrl } : {}),
    };
    void supabase.from("products").update(row).eq("id", id);
  }, []);

  const deleteProduct = useCallback<Store["deleteProduct"]>((id) => {
    removeLocalImage("products", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    void supabase.from("products").delete().eq("id", id);
  }, []);

  const addFinance = useCallback<Store["addFinance"]>(
    (e) => {
      if (!userId) return;
      void (async () => {
        const { data } = await supabase
          .from("finance_entries")
          .insert({
            user_id: userId,
            kind: e.kind,
            description: e.description,
            party: e.party,
            amount: e.amount,
            due_date: e.dueDate,
            status: e.status,
            category: e.category,
            invoice_number: e.invoiceNumber,
            invoice_series: e.invoiceSeries,
            invoice_path: e.invoicePath,
            invoice_name: e.invoiceName,
          })
          .select()
          .single();
        if (data) setFinance((prev) => [...prev, { ...e, id: data.id }]);
      })();
    },
    [userId],
  );

  const updateFinance = useCallback<Store["updateFinance"]>((id, patch) => {
    setFinance((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    const row = {
      ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.party !== undefined ? { party: patch.party } : {}),
      ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
      ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
      ...(patch.status !== undefined
        ? { status: patch.status, paid_at: patch.status === "pago" ? new Date().toISOString() : null }
        : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.invoiceNumber !== undefined ? { invoice_number: patch.invoiceNumber } : {}),
      ...(patch.invoiceSeries !== undefined ? { invoice_series: patch.invoiceSeries } : {}),
      ...(patch.invoicePath !== undefined ? { invoice_path: patch.invoicePath } : {}),
      ...(patch.invoiceName !== undefined ? { invoice_name: patch.invoiceName } : {}),
    };
    void supabase.from("finance_entries").update(row).eq("id", id);
  }, []);

  const deleteFinance = useCallback<Store["deleteFinance"]>((id) => {
    setFinance((prev) => prev.filter((e) => e.id !== id));
    void supabase.from("finance_entries").delete().eq("id", id);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      userId,
      printers,
      filaments,
      orders,
      products,
      clients,
      failures,
      extras,
      finance,
      settings,
      setPrinterStatus,
      moveOrder,
      addOrder,
      addPrinter,
      addFilament,
      addProduct,
      addClient,
      addExtra,
      updatePrinter,
      deletePrinter,
      updateFilament,
      deleteFilament,
      updateOrder,
      deleteOrder,
      updateClient,
      deleteClient,
      updateProduct,
      deleteProduct,
      addFinance,
      updateFinance,
      deleteFinance,
      consumeFilament,
      addFailure,
      updateSettings,
      failureOpen,
      setFailureOpen,
    }),
    [
      loading,
      userId,
      printers,
      filaments,
      orders,
      products,
      clients,
      failures,
      extras,
      finance,
      settings,
      setPrinterStatus,
      moveOrder,
      addOrder,
      addPrinter,
      addFilament,
      addProduct,
      addClient,
      addExtra,
      updatePrinter,
      deletePrinter,
      updateFilament,
      deleteFilament,
      updateOrder,
      deleteOrder,
      updateClient,
      deleteClient,
      updateProduct,
      deleteProduct,
      addFinance,
      updateFinance,
      deleteFinance,
      consumeFilament,
      addFailure,
      updateSettings,
      failureOpen,
    ],
  );

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
}

export function useErp() {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error("useErp must be used inside ErpProvider");
  return ctx;
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
