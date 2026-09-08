# VisionFlow ERP — Farm 3D (PRD)

## Problema (verbatim resumido)
Correções integradas: (1) parsing numérico com vírgula/ponto sem reset a zero,
(2) identidade da loja (nome + logo) persistindo via localStorage/Base64 no header
e no PDF, (3) Calculadora Comercial autônoma dark/glassmorphism com custos avançados,
desconto progressivo por lote e cálculo automático de preço, (4) Painel de resultados
completo, botão "Gerar Orçamento deste Lote" e responsividade mobile.

## Stack
- TanStack Start + React 19 + Vite 8 + Tailwind 4
- Supabase (auth + persistência remota), fallback local em localStorage
- jsPDF (orçamento PDF), lucide-react (ícones)

## Implementado (Jan 2026)
- **orcamento.tsx**: adicionado helper `num()` (aceita "," e "." sem reset), fórmulas
  `custo unitário → preço base sugerido`, tiers de desconto (0/10/16.7/23.3/30 %),
  multiplicação de tempo/peso por lote, cards de faturamento/lucro/margem/50-50 Pix,
  Accordion de custos operacionais avançados (filamento 103, energia 1, potência 250,
  desgaste 1, acabamento 10), botões `Gerar Orçamento`, `Salvar`, `Exportar PDF`,
  `Copiar resumo`. Data-testids em todos os inputs e ações-chave.
- **configuracoes.tsx**: estados-string locais para energia/margem/falha permitindo
  digitar "0.", "1,5" sem reset. Sincronizam para store apenas com o valor parseado.
- **AppShell.tsx**: `Brand` passa a ler `settings.company` e `settings.logoUrl` do
  ErpProvider; header desktop e header mobile exibem nome+logo persistidos.
- **erp-store.tsx** (já existente): `readLocalSettings` prioriza localStorage sobre
  Supabase; `updateSettings` grava no localStorage a cada mudança via `writeLocalSettings`.
- **image-utils.ts** (já existente): `fileToThumbnail` converte via FileReader para
  data URL Base64, salvo em localStorage — não usa `URL.createObjectURL`.
- **quote-pdf.ts** (já existente): PDF inclui logo Base64, nome da empresa,
  produção estimada (tempo total, peso total, unit price, discount), 50/50 Pix.

## User personas
- Dono/gerente de Farm 3D que quer precificar lotes rapidamente sem planilha.

## Requisitos estáticos
- Cálculo determinístico do preço unitário e do lote.
- Persistência offline-first para identidade da loja.
- Mobile-first (single column ≤ sm, expandido em lg).

## Backlog / Próximas melhorias
- P1: Ajuste fino de tokens dark/glass no orcamento (bg-card/50 + border glow).
- P1: Toggle "salvar como preset" (recuperar custos operacionais por perfil).
- P2: Compartilhar orçamento por WhatsApp direto (deep link com resumo).
- P2: Registro histórico de orçamentos com filtros por cliente/data.

## Credenciais de teste
- Não há novas credenciais criadas nesta iteração (autenticação existente via Supabase).
