# PrintFlow ERP — PRD / Memória do Projeto

## Stack
- Frontend: TanStack Start (React 19 + TypeScript + Vite 8), Tailwind v4, shadcn/ui.
- Backend/Dados: Supabase (Postgres + RLS + Storage). Sem FastAPI/Mongo.
- Preview roda via `vite dev` na porta 3000 (supervisor `frontend`, com symlink `/app/frontend -> /app`).

## Problema / Objetivo (2026-06)
Converter a autenticação do ERP para o formato PDV / Operadores internos:
1. Tabela pública `operadores` (id, nome, usuario, pin, cargo, ativo).
2. Login apenas com Usuário + PIN (4–6 números), validado direto na tabela `operadores`
   (usuario, pin, ativo=true). Sem `supabase.auth`, sem e-mail/confirmação.
   Sessão salva em localStorage; libera o painel.
3. Operador padrão inicial: usuário `flow` / PIN `9999`.
4. Painel Admin (/usuarios): cadastrar/editar/desativar/excluir operadores.

## Decisões do usuário
- Manter Supabase. PIN em texto simples. Dados COMPARTILHADOS entre operadores (workspace único).
- Migrar dados existentes para o workspace compartilhado.
- Usuário roda a migração SQL manualmente no SQL Editor do Supabase.

## Arquitetura da mudança
- `WORKSPACE_ID = 00000000-0000-0000-0000-000000000001` usado como `user_id` de todas as tabelas do ERP.
- RLS de todas as tabelas do ERP reescrita para permitir o papel `anon` (chave publishable no browser),
  pois o app agora acessa o Supabase sem sessão de auth.
- Storage `notas-fiscais`: política ajustada para a pasta do workspace.

## Implementado (2026-06)
- `src/lib/operator-session.ts` (novo): WORKSPACE_ID, get/set/clear sessão, `loginOperator()`.
- `src/routes/auth.tsx`: login Usuário + PIN.
- `src/routes/_authenticated/route.tsx`: guarda via localStorage (getOperator).
- `src/lib/acl.tsx`: cargo do operador define admin/operador.
- `src/components/erp/AppShell.tsx`: logout limpa a sessão local; mostra nome do operador.
- `src/lib/erp-store.tsx`: usa WORKSPACE_ID (removido supabase.auth.getUser).
- `src/routes/_authenticated/usuarios.tsx`: CRUD de operadores (Nome/Usuário/PIN/Cargo, ativar/desativar/excluir).
- `src/integrations/supabase/types.ts`: tipo da tabela `operadores`.
- `supabase/migrations/20260601000000_operadores_pdv_auth.sql`: cria `operadores`, seed flow/9999,
  abre RLS das tabelas para o workspace e migra os dados.
- Removido `src/lib/users.functions.ts` (server fns de auth antigo).

## Status
- `.env` atualizado para o projeto Supabase `stjbixmtazojeufvfrar` (chave anon JWT em ANON_KEY e PUBLISHABLE_KEY).
- Autenticação VERIFICADA end-to-end (Playwright local contra localhost:3000):
  login flow/9999 → dashboard; sessão no localStorage (cargo normalizado p/ "admin");
  painel /usuarios acessível; guard redireciona p/ /auth sem sessão; CRUD de operadores (INSERT/DELETE) OK via anon.
- Comparação de `cargo` agora é case-insensitive (aceita "Admin"/"admin").
- PENDENTE (ação do usuário): rodar `supabase/migrations/20260601010000_full_erp_schema_new_project.sql`
  no SQL Editor do projeto novo — as 14 tabelas do ERP ainda NÃO existem lá (settings/printers/... = 404),
  então as telas de dados do ERP ficam vazias até criar o schema.
- Observação: a screenshot tool renderiza em branco atrás do proxy (peculiaridade Vite dev + HMR);
  o app renderiza normal no Chrome local. Teste de regressão: `tests/e2e_login.py`.

## Backlog / Próximos
- Após aplicar a migração: testar login (flow/9999), CRUD de operadores, e carregamento de dados do ERP.
- (Opcional) Hash de PIN, auditoria de acessos, troca de PIN pelo próprio operador.
