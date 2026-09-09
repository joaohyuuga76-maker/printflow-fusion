import {
  LayoutDashboard,
  KanbanSquare,
  Calculator,
  Printer,
  ListOrdered,
  AlertTriangle,
  Boxes,
  Package,
  Users,
  Settings2,
  Wallet,
  Cog,
  ShoppingCart,
  FileInput,
  ShieldCheck,
  Palette,
} from "lucide-react";

export const navSections = [
  {
    label: "Visão Geral",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Vendas & Pedidos",
    items: [
      { to: "/pdv", label: "Frente de Caixa (PDV)", icon: ShoppingCart },
      { to: "/vendas", label: "Kanban de Vendas", icon: KanbanSquare },
      { to: "/orcamento", label: "Calculadora", icon: Calculator },
    ],
  },
  {
    label: "Produção & Farm",
    items: [
      { to: "/farm", label: "Minha Farm", icon: Printer },
      { to: "/fila", label: "Fila de Impressão", icon: ListOrdered },
      { to: "/falhas", label: "Registro de Falhas", icon: AlertTriangle },
    ],
  },
  {
    label: "Insumos & Cadastros",
    items: [
      { to: "/filamentos", label: "Filamentos", icon: Boxes },
      { to: "/nfe", label: "Entrada de NF-e", icon: FileInput },
      { to: "/catalogo", label: "Catálogo", icon: Package },
      { to: "/clientes", label: "Clientes (CRM)", icon: Users },
      { to: "/maquinas", label: "Máquinas & Custos", icon: Settings2 },
    ],
  },
  {
    label: "Financeiro & Sistema",
    items: [
      { to: "/financeiro", label: "Financeiro", icon: Wallet },
      { to: "/usuarios", label: "Usuários & Permissões", icon: ShieldCheck },
      { to: "/aparencia", label: "Aparência e Cores", icon: Palette },
      { to: "/configuracoes", label: "Configurações", icon: Cog },
    ],
  },
] as const;

export const mobileNav = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/pdv", label: "Caixa", icon: ShoppingCart },
  { to: "/vendas", label: "Vendas", icon: KanbanSquare },
  { to: "/farm", label: "Farm", icon: Printer },
  { to: "/filamentos", label: "Estoque", icon: Boxes },
] as const;
