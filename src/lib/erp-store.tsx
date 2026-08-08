import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Client,
  ExtraCost,
  Failure,
  Filament,
  Order,
  OrderStage,
  Printer,
  Product,
  Settings,
} from "./erp-types";

const initialPrinters: Printer[] = [
  {
    id: "p1",
    name: "Bambu Lab P1S",
    model: "P1S CoreXY",
    watts: 350,
    depreciationPerHour: 1.35,
    status: "imprimindo",
    currentFile: "suporte_headset_v3.3mf",
    progress: 68,
    remainingMin: 96,
    hoursRun: 1284,
    failures: 3,
  },
  {
    id: "p2",
    name: "Anycubic Kobra 4",
    model: "Kobra 4 Max",
    watts: 300,
    depreciationPerHour: 0.95,
    status: "imprimindo",
    currentFile: "vaso_espiral_grande.gcode",
    progress: 24,
    remainingMin: 312,
    hoursRun: 862,
    failures: 7,
  },
  {
    id: "p3",
    name: "Ender 3 Pro",
    model: "Creality Ender 3 Pro",
    watts: 270,
    depreciationPerHour: 0.55,
    status: "aguardando",
    currentFile: "chaveiro_lote_24un.gcode",
    progress: 100,
    remainingMin: 0,
    hoursRun: 2140,
    failures: 12,
  },
  {
    id: "p4",
    name: "Bambu Lab A1 Mini",
    model: "A1 Mini + AMS Lite",
    watts: 150,
    depreciationPerHour: 0.72,
    status: "disponivel",
    hoursRun: 410,
    failures: 1,
  },
  {
    id: "p5",
    name: "Elegoo Neptune 4",
    model: "Neptune 4 Plus",
    watts: 320,
    depreciationPerHour: 0.8,
    status: "manutencao",
    hoursRun: 733,
    failures: 9,
  },
];

const initialFilaments: Filament[] = [
  { id: "f1", brand: "3D Fila", type: "PLA", color: "Preto", hex: "#111827", totalG: 1000, remainingG: 420, pricePerKg: 109.9 },
  { id: "f2", brand: "Voolt3D", type: "PLA", color: "Branco", hex: "#f8fafc", totalG: 1000, remainingG: 860, pricePerKg: 119.9 },
  { id: "f3", brand: "Sunlu", type: "PETG", color: "Azul", hex: "#3b82f6", totalG: 1000, remainingG: 120, pricePerKg: 139.9 },
  { id: "f4", brand: "Esun", type: "ABS", color: "Cinza", hex: "#64748b", totalG: 1000, remainingG: 640, pricePerKg: 149.9 },
  { id: "f5", brand: "Creality", type: "TPU", color: "Vermelho", hex: "#ef4444", totalG: 800, remainingG: 95, pricePerKg: 189.9 },
  { id: "f6", brand: "Sunlu", type: "Silk", color: "Dourado", hex: "#f59e0b", totalG: 1000, remainingG: 730, pricePerKg: 159.9 },
  { id: "f7", brand: "Bambu Lab", type: "PLA", color: "Verde Neon", hex: "#22c55e", totalG: 1000, remainingG: 510, pricePerKg: 179.9 },
  { id: "f8", brand: "3D Lab", type: "ASA", color: "Roxo", hex: "#a855f7", totalG: 1000, remainingG: 980, pricePerKg: 199.9 },
];

const initialOrders: Order[] = [
  { id: "o1", ref: "#2K-1042", client: "Studio Rocha", title: "Suportes de headset (12un)", value: 780, cost: 291, stage: "orcamento", date: "05/08", channel: "Instagram", priority: "media", weightG: 1440, hours: 26 },
  { id: "o2", ref: "#2K-1043", client: "Mecânica Vitória", title: "Gabaritos técnicos ABS", value: 1250, cost: 470, stage: "orcamento", date: "06/08", channel: "Indicação", priority: "alta", weightG: 2100, hours: 38 },
  { id: "o3", ref: "#2K-1039", client: "Pet Shop Amigo", title: "Comedouros customizados", value: 640, cost: 232, stage: "aprovado", date: "03/08", channel: "WhatsApp", priority: "media", weightG: 1100, hours: 19 },
  { id: "o4", ref: "#2K-1036", client: "Ana Beatriz", title: "Vasos espiral (4un)", value: 320, cost: 118, stage: "fila", date: "02/08", channel: "Venda Direta", priority: "baixa", weightG: 620, hours: 14 },
  { id: "o5", ref: "#2K-1035", client: "Colégio Horizonte", title: "Kit peças didáticas", value: 1890, cost: 705, stage: "fila", date: "01/08", channel: "Licitação", priority: "alta", weightG: 3200, hours: 58 },
  { id: "o6", ref: "#2K-1033", client: "Bar do Léo", title: "Placas de menu", value: 430, cost: 151, stage: "impressao", date: "31/07", channel: "WhatsApp", priority: "media", weightG: 700, hours: 11 },
  { id: "o7", ref: "#2K-1030", client: "Studio Rocha", title: "Prototipagem carcaça", value: 960, cost: 340, stage: "pos", date: "29/07", channel: "Instagram", priority: "alta", weightG: 1500, hours: 27 },
  { id: "o8", ref: "#2K-1028", client: "Marcos Lima", title: "Miniaturas RPG (30un)", value: 720, cost: 214, stage: "envio", date: "28/07", channel: "Venda Direta", priority: "media", weightG: 450, hours: 22 },
  { id: "o9", ref: "#2K-1027", client: "Café Central", title: "Suportes de guardanapo", value: 380, cost: 129, stage: "envio", date: "27/07", channel: "WhatsApp", priority: "baixa", weightG: 610, hours: 9 },
  { id: "o10", ref: "#2K-1021", client: "Mecânica Vitória", title: "Buchas técnicas PETG", value: 1420, cost: 512, stage: "concluido", date: "22/07", channel: "Indicação", priority: "alta", weightG: 2400, hours: 41 },
  { id: "o11", ref: "#2K-1018", client: "Ana Beatriz", title: "Luminária Moon", value: 540, cost: 176, stage: "concluido", date: "18/07", channel: "Instagram", priority: "media", weightG: 900, hours: 17 },
];

const initialProducts: Product[] = [
  { id: "pr1", name: "Luminária Moon 15cm", category: "Decoração", weightG: 260, hours: 9.5, price: 149.9, sold: 38 },
  { id: "pr2", name: "Suporte de Headset", category: "Setup", weightG: 120, hours: 4.2, price: 79.9, sold: 64 },
  { id: "pr3", name: "Vaso Espiral G", category: "Decoração", weightG: 155, hours: 5.8, price: 89.9, sold: 41 },
  { id: "pr4", name: "Miniatura RPG 32mm", category: "Games", weightG: 15, hours: 1.4, price: 29.9, sold: 190 },
  { id: "pr5", name: "Organizador de Bancada", category: "Utilidades", weightG: 340, hours: 11, price: 169.9, sold: 22 },
  { id: "pr6", name: "Gabarito Técnico ABS", category: "Industrial", weightG: 420, hours: 13.5, price: 249.9, sold: 15 },
];

const initialClients: Client[] = [
  { id: "c1", name: "Studio Rocha", phone: "(11) 98812-4410", city: "São Paulo / SP", orders: 9, total: 7420 },
  { id: "c2", name: "Mecânica Vitória", phone: "(11) 99640-2231", city: "Osasco / SP", orders: 6, total: 6180 },
  { id: "c3", name: "Colégio Horizonte", phone: "(11) 3322-8890", city: "Guarulhos / SP", orders: 3, total: 4890 },
  { id: "c4", name: "Ana Beatriz", phone: "(21) 98110-7742", city: "Niterói / RJ", orders: 5, total: 2130 },
  { id: "c5", name: "Marcos Lima", phone: "(31) 99872-1120", city: "Belo Horizonte / MG", orders: 4, total: 1860 },
  { id: "c6", name: "Café Central", phone: "(11) 3987-1200", city: "São Paulo / SP", orders: 2, total: 760 },
];

const initialFailures: Failure[] = [
  { id: "fa1", printerId: "p3", filamentId: "f1", lostG: 180, reason: "Descolamento de mesa", notes: "Warping no canto da peça grande", date: "04/08", cost: 19.78 },
  { id: "fa2", printerId: "p2", filamentId: "f3", lostG: 95, reason: "Bico entupido", notes: "Troca de bico 0.4 realizada", date: "02/08", cost: 13.29 },
  { id: "fa3", printerId: "p5", filamentId: "f4", lostG: 260, reason: "Queda de energia", notes: "Sem nobreak na bancada 2", date: "30/07", cost: 38.97 },
  { id: "fa4", printerId: "p3", filamentId: "f7", lostG: 60, reason: "Arquivo fatiado errado", notes: "Suporte insuficiente", date: "26/07", cost: 10.79 },
];

const initialExtras: ExtraCost[] = [
  { id: "e1", name: "Caixa de papelão", unitPrice: 2.4, unit: "un" },
  { id: "e2", name: "Plástico bolha", unitPrice: 1.1, unit: "m" },
  { id: "e3", name: "Verniz fosco", unitPrice: 3.8, unit: "aplicação" },
  { id: "e4", name: "Fita adesiva 2K Lab", unitPrice: 0.9, unit: "un" },
  { id: "e5", name: "Etiqueta personalizada", unitPrice: 0.6, unit: "un" },
];

const initialSettings: Settings = {
  company: "2K Lab — PrintFlow",
  cnpj: "48.221.900/0001-33",
  energyRate: 0.92,
  defaultMargin: 120,
  failureRate: 5,
};

interface Store {
  printers: Printer[];
  filaments: Filament[];
  orders: Order[];
  products: Product[];
  clients: Client[];
  failures: Failure[];
  extras: ExtraCost[];
  settings: Settings;
  setPrinterStatus: (id: string, status: Printer["status"]) => void;
  moveOrder: (id: string, stage: OrderStage) => void;
  addOrder: (o: Omit<Order, "id">) => void;
  addFilament: (f: Omit<Filament, "id">) => void;
  consumeFilament: (id: string, grams: number) => void;
  addFailure: (f: Omit<Failure, "id" | "cost" | "date">) => void;
  updateSettings: (s: Partial<Settings>) => void;
  failureOpen: boolean;
  setFailureOpen: (v: boolean) => void;
}

const ErpContext = createContext<Store | null>(null);

export function ErpProvider({ children }: { children: ReactNode }) {
  const [printers, setPrinters] = useState(initialPrinters);
  const [filaments, setFilaments] = useState(initialFilaments);
  const [orders, setOrders] = useState(initialOrders);
  const [products] = useState(initialProducts);
  const [clients] = useState(initialClients);
  const [failures, setFailures] = useState(initialFailures);
  const [extras] = useState(initialExtras);
  const [settings, setSettings] = useState(initialSettings);
  const [failureOpen, setFailureOpen] = useState(false);

  const setPrinterStatus = useCallback((id: string, status: Printer["status"]) => {
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              progress: status === "imprimindo" ? 1 : status === "aguardando" ? 100 : undefined,
              remainingMin: status === "imprimindo" ? 180 : 0,
              currentFile: status === "disponivel" || status === "manutencao" ? undefined : p.currentFile ?? "novo_job.gcode",
            }
          : p,
      ),
    );
  }, []);

  const moveOrder = useCallback((id: string, stage: OrderStage) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
  }, []);

  const addOrder = useCallback((o: Omit<Order, "id">) => {
    setOrders((prev) => [{ ...o, id: `o${Date.now()}` }, ...prev]);
  }, []);

  const addFilament = useCallback((f: Omit<Filament, "id">) => {
    setFilaments((prev) => [...prev, { ...f, id: `f${Date.now()}` }]);
  }, []);

  const consumeFilament = useCallback((id: string, grams: number) => {
    setFilaments((prev) =>
      prev.map((f) => (f.id === id ? { ...f, remainingG: Math.max(0, f.remainingG - grams) } : f)),
    );
  }, []);

  const addFailure = useCallback<Store["addFailure"]>(
    (f) => {
      setFilaments((prev) => {
        const fil = prev.find((x) => x.id === f.filamentId);
        const cost = fil ? (f.lostG / 1000) * fil.pricePerKg : 0;
        setFailures((old) => [
          {
            ...f,
            id: `fa${Date.now()}`,
            cost,
            date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          },
          ...old,
        ]);
        return prev.map((x) =>
          x.id === f.filamentId ? { ...x, remainingG: Math.max(0, x.remainingG - f.lostG) } : x,
        );
      });
      setPrinters((prev) =>
        prev.map((p) => (p.id === f.printerId ? { ...p, failures: p.failures + 1 } : p)),
      );
    },
    [],
  );

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
  }, []);

  const value = useMemo(
    () => ({
      printers,
      filaments,
      orders,
      products,
      clients,
      failures,
      extras,
      settings,
      setPrinterStatus,
      moveOrder,
      addOrder,
      addFilament,
      consumeFilament,
      addFailure,
      updateSettings,
      failureOpen,
      setFailureOpen,
    }),
    [
      printers,
      filaments,
      orders,
      products,
      clients,
      failures,
      extras,
      settings,
      setPrinterStatus,
      moveOrder,
      addOrder,
      addFilament,
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