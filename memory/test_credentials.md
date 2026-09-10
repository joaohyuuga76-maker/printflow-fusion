# Credenciais de Teste — PrintFlow ERP (PDV / Operadores)

Autenticação por tabela pública `operadores` (Supabase), sem `supabase.auth`.
Sessão do operador salva em `localStorage` (`printflow:operador`).

> IMPORTANTE: os logins abaixo só funcionam DEPOIS de rodar a migração
> `supabase/migrations/20260601000000_operadores_pdv_auth.sql` no SQL Editor do Supabase.

## Operador padrão (admin)
- Usuário: `flow`
- PIN: `9999`
- Cargo: `admin` (acesso total)

## Tela de login
- Rota: `/auth`
- Campos: "Usuário" (texto) + "PIN / Senha" (4 a 6 números)

## Gerenciar operadores
- Rota (apenas admin): `/usuarios` — "Operadores & Acessos"
- Cadastrar (Nome, Usuário, PIN, Cargo), editar (nome/usuário/PIN/cargo), ativar/desativar e excluir.

## Workspace compartilhado
- Todos os operadores compartilham os dados da loja.
- WORKSPACE_ID = `00000000-0000-0000-0000-000000000001`
