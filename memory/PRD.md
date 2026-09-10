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
- Frontend compila e a tela de login renderiza (verificado via headless Chrome).
- PENDENTE (ação do usuário): rodar a migração SQL no Supabase para criar a tabela `operadores`
  e ajustar RLS. Sem isso, login e carregamento de dados não funcionam.
- Login e dados ainda NÃO validados end-to-end (dependem da migração acima).

## Backlog / Próximos
- Após aplicar a migração: testar login (flow/9999), CRUD de operadores, e carregamento de dados do ERP.
- (Opcional) Hash de PIN, auditoria de acessos, troca de PIN pelo próprio operador.
