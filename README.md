# PrintFlow Manager

PROMPT COMPLETO: ERP DE IMPRESSÃO 3D (2K LAB PRINTFLOW)

​Crie um sistema ERP completo, responsivo (Desktop e Mobile) e intuitivo para gestão de uma empresa/farm de impressão 3D chamado PrintFlow (2K Lab).

​🎨 1. IDENTIDADE VISUAL E DESIGN SYSTEM

 ​Tema Principal: Dark Mode elegante e moderno (estilo Slate/Navy escuro).

​Fundo principal: #0f172a (Slate-900)

​Cards e superfícies: #1e293b (Slate-800)

​Bordas e divisores: #334155 (Slate-700)

 ​Cores de destaque (Destaques Neon):

​Verde Lucro/Sucesso: #22c55e (Emerald-500)

​Azul Informação/Gráficos: #3b82f6 (Blue-500)

​Roxo/Lilás Produção: #a855f7 (Purple-500)

​Vermelho Alerta/Falha/Custo: #ef4444 (Red-500)

​Amarelo/Laranja Atenção: #f59e0b (Amber-500)

​Tipografia: Limpa, legível e moderna (Sans-serif / Inter ou Sans).

 ​Biblioteca de UI: Tailwind CSS, Shadcn UI (Card, Button, Dialog, Select, Input, Table, Badge, Progress, Tabs, Tooltip) e Lucide Icons (lucide-react).

 ​Responsividade:

​Desktop: Sidebar fixa retrátil à esquerda + Topbar com ações rápidas + Conteúdo principal em Grid.

​Mobile: Bottom Navigation Bar (Barra inferior de navegação rápida) ou Drawer menu hambúrguer para acesso fácil pelo celular.

​📂 2. ESTRUTURA DE NAVEGAÇÃO (SIDEBAR)

​Organize o menu lateral nas seguintes seções com ícones representativos:

​📊 Visão Geral

​Dashboard: Visão geral do negócio (KPIs, pedidos rápidos, gráficos de lucro e falhas).

​🛒 Vendas & Pedidos

​Kanban de Vendas: Quadro interativo de pedidos (Orçamento -> Aprovado -> Na Fila -> Em Impressão -> Pós-Processamento -> Envio -> Concluído).

​Calculadora de Orçamentos: Gerador automático de orçamentos para clientes.

​🖨️ Produção & Farm

​Minha Farm (Impressoras): Painel de status em tempo real de cada máquina.

​Fila de Impressão: Lista de peças prontas para rodar, organizadas por prioridade.

​Registro de Falhas: Botão de ação rápida e histórico de peças perdidas / falhas técnicas.

​📦 Insumos & Cadastros

​Filamentos & Material: Controle de estoque de carretéis (PLA, PETG, ABS, TPU) com peso restante em gramas.

​Catálogo de Produtos: Produtos recorrentes com tempos e pesos pré-salvos.

​Clientes (CRM): Cadastro de clientes e histórico de compras.

​Custos Extras / Máquinas: Cadastro de impressoras (potência em Watts, depreciação por hora), preço da tarifa de energia (R$/kWh) e insumos extras (embalagens, fita, verniz).

​💰 Financeiro & Sistema

​Financeiro: DRE simplificado, receitas, custos de filamento/energia e despesas operacionais.

​Configurações: Configurações de margem padrão, dados da empresa e integração Supabase.

​📱 3. DETALHAMENTO DE TELAS E REQUISITOS DE INTERFACE

​TELA 1: DASHBOARD (Inspirado na referência visual)

 ​Header do Dashboard:

​Título "Dashboard - Visão geral do seu negócio"

​Filtro de data (Mês/Ano ex: Janeiro de 2026)

​Botão de ação rápida em destaque vermelho: "Registrar Falha" (Abre Modal de Falhas)

 ​Cards Superiores de KPI (4 colunas):

 ​Faturamento Total (R$): Valor verde com ícone $.

​Lucro Líquido (R$): Valor verde com ícone de tendência de alta.

​Custo de Produção (R$): Valor vermelho/rosa com ícone de pulso/gráfico.

​Lotes Produzidos: Número roxo com ícone de caixa/pacote.

 ​Resumo de Status dos Pedidos (4 cards em linha):

​Orçamentos Pendentes (Quantidade e lista simples)

​Na Fila (Produção) (Quantidade e lista simples)

​A Enviar (Card com detalhes do pedido: Ref/Cliente, Data, Venda Direta)

​Em Trânsito (Status de logística)

 ​Grid de Gráficos e Análises:

​Evolução do Lucro: Gráfico de linha (Recharts) comparando faturamento x tempo.

​Custos de Produção: Gráfico Donut (Rosca) fatiado em: Depreciação, Energia, Extras, Filamento.

​Top Produtos: Ranking ordenado dos produtos que mais geraram receita.

​Métricas da Farm: Card "Top Impressoras (Horas rodadas)" e Card "Top Falhas (Máquinas com mais problemas)".

​TELA 2: CALCULADORA & GERADOR DE ORÇAMENTOS

​Formulário inteligente que calcula o preço exato da peça:

 ​Entradas do Usuário:

​Nome do Cliente / Nome do Projeto.

​Seleção de Filamento cadastrado (Puxa preço/kg automaticamente).

​Peso da peça (gramas).

​Tempo de impressão estimado (Horas e Minutos).

​Seleção da Impressora (Puxa consumo em Watts e depreciação/hora).

​Custos Adicionais (Embalagem, fita, pós-processamento manual R$).

​Taxa de Falha estimada (% de segurança, ex: 5%).

​Margem de Lucro desejada (%).

 ​Saída / Cálculo Automático:

​Custo do Filamento = (Peso em g / 1000) * Preço do kg

​Custo da Energia = (Tempo em h * (Watts / 1000)) * Tarifa R$/kWh

​Custo de Depreciação = Tempo em h * Depreciação por Hora da máquina

​Custo Total da Peça = Sum de todos os custos + Taxa de falha.

 ​Preço Final Sugerido e Lucro Real em R$.

 ​Ação de Saída:

​Botão "Gerar Pedido" (Envia direto para o Kanban de Vendas).

​Botão "Copiar Resumo para WhatsApp" (Gera um texto formatado amigável para enviar ao cliente).

​TELA 3: MINHA FARM (GESTOR DE IMPRESSORAS)

 ​Grid visual mostrando os cards das impressoras (Exemplo: Anycubic Kobra 4, Ender 3 Pro, Bambu Lab):

 ​Status da Máquina com Badge colorido:

​🟢 Disponível

​🔵 Imprimindo (Com barra de progresso %, tempo restante e arquivo atual)

​🟠 Aguardando Remoção da Peça

​🔴 Manutenção / Com Falha

​Botão em cada card: "Iniciar Impressão", "Pausar", "Concluir / Liberar Mesa", "Reportar Manutenção".

​TELA 4: CONTROLE DE FILAMENTOS (ESTOQUE)

 ​Tabela/Cards de carretéis:

​Campos: Marca, Tipo (PLA, PETG, ABS, Silk, TPU), Cor (com círculo/badge colorido), Peso Total (ex: 1000g), Peso Restante (ex: 450g), Valor por kg (R$).

​Barra visual de progresso de consumo do carretel.

​Alerta em vermelho quando o carretel tiver menos de 150g restantes.

​Botão "Dar Baixa Manual" ou "Adicionar Novo Carretel".

​TELA 5: MODAL "REGISTRAR FALHA" (Ação Global)

​Modal acessível de qualquer tela para registro rápido de perdas:

​Campos: Selecionar Impressora, Selecionar Filamento usado, Peso do filamento perdido (g), Motivo da falha (Descolamento de mesa, Bico entupido, Queda de energia, Arquivo fatiado errado, Outro), Observações.

​Ao salvar, desconta automaticamente o peso do estoque de filamentos e soma nos dados de custo/falhas do Dashboard.

​🛠️ REQUISITOS TÉCNICOS & ARQUITETURA DE DADOS

​Estruture os componentes React utilizando estados locais e prepare o schema pronto para conectar ao Supabase.

​Crie mock-data enriquecido (com valores reais de impressão 3D em R$) para que a interface inicial já abra totalmente preenchida e bonita visualmente.

​Garanta transições suaves, modais interativos e UX impecável em telas mobile e desktop.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://printflow-fusion.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ae54d730-8c8d-40c0-9b9b-99f2f61e5963).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
