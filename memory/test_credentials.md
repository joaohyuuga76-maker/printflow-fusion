# Credenciais de Teste — PrintFlow ERP (PDV / Operadores)

Projeto Supabase atual: `stjbixmtazojeufvfrar`.
Autenticação por tabela pública `operadores` (sem `supabase.auth`).
Sessão do operador em `localStorage` (`printflow:operador`).

> A tabela `operadores` já existe no projeto e o login funciona.
> As tabelas de DADOS do ERP ainda NÃO existem nesse projeto — rode
> `supabase/migrations/20260601010000_full_erp_schema_new_project.sql` no SQL Editor.

## Operador padrão (admin) — VERIFICADO
- Usuário: `flow`
- PIN: `9999`
- Cargo: admin (comparação case-insensitive)

## Tela de login
- Rota: `/auth`
- Campos: "Usuário" (texto) + "PIN / Senha" (4 a 6 números)

## Gerenciar operadores
- Rota (apenas admin): `/usuarios` — "Operadores & Acessos"
- Cadastrar (Nome, Usuário, PIN, Cargo), editar (nome/usuário/PIN/cargo), ativar/desativar e excluir.

## Workspace compartilhado
- Todos os operadores compartilham os dados da loja.
- WORKSPACE_ID = `00000000-0000-0000-0000-000000000001`
