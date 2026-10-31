# Auditoria inicial de segurança e operação — Polycraft 3D ERP

Data: 30/10/2026  
Branch revisada: `conflict_100926_2032`  
Branch desta auditoria: `auditoria-seguranca-erp-polycraft`

Este documento registra achados de leitura do código e das migrations. Nenhuma consulta foi feita ao banco Supabase ativo e nenhum dado operacional foi lido ou alterado. A configuração efetiva do Supabase precisa ser verificada separadamente antes de qualquer migration.

## Resumo

O repositório confirma que usuário + PIN são consultados no Supabase, então a validação inicial ocorre num serviço compartilhado e pode funcionar entre dispositivos. Porém, o próprio código documenta que não usa Supabase Auth: após a consulta, a aplicação grava uma sessão em `localStorage`. As migrations examinadas concedem CRUD ao papel `anon` e criam políticas permissivas. A validação remota de PIN, por si só, não significa que cada operação subsequente seja autorizada pelo banco como aquele usuário.

## Achados prioritários

### Crítico — identidade e autorização de operadores

- `src/lib/operator-session.ts` consulta `operadores` diretamente no cliente, compara PIN sem hash no banco e persiste `cargo` localmente.
- `src/lib/acl.tsx` deriva o cargo da sessão em `localStorage`; `AdminOnly` e as rotas são controles de interface, não barreiras de banco.
- `supabase/migrations/20260601000000_operadores_pdv_auth.sql` concede SELECT/INSERT/UPDATE/DELETE em `operadores` para `anon, authenticated` com política aberta.
- A migration contém seed de credencial padrão para `flow`. Confirmar se foi removida/alterada no ambiente ativo; não divulgar PINs nem reutilizá-los.

**Direção recomendada:** Supabase Auth para identidades individuais (usuário, esposa e conta mestre `flow`), papel e vínculo empresarial no banco, RLS baseada em `auth.uid()`, administração por função autorizada no servidor. Fazer transição com plano de compatibilidade e rollback para não bloquear os acessos existentes.

### Crítico — dados compartilhados e políticas RLS

- O código usa `WORKSPACE_ID` constante como `user_id`; isso não autentica nem prova que a pessoa pertence à empresa.
- A migration cria políticas `USING (true)` / `WITH CHECK (true)` para o papel anônimo nas tabelas do ERP e nos arquivos do bucket de notas fiscais.
- Consequentemente, a interface de login não limita por si só as operações feitas diretamente contra o Supabase com a chave pública do cliente.

**Direção recomendada:** modelar empresa e membros, e validar a associação em cada política RLS. Os dois logins pessoais e `flow` devem permanecer distintos e compartilhar a mesma empresa. Fazer backfill preservando registros e IDs; não executar SQL até confirmar projeto, estado das migrations e backup restaurável.

### Crítico para integridade — migração pode descartar configuração

A migration remove linhas excedentes de `settings`, mantendo somente uma linha antes de consolidar `user_id` para o workspace comum. Isso pode descartar configurações válidas. A migration também altera constraints, políticas e dados de várias tabelas.

**Ação:** não reaplicar essa migration. Primeiro conferir o histórico de migrações no projeto correto e validar backup restaurável. O estado real ainda não foi confirmado.

### Alto — descontos podem atravessar o piso de margem

Em `src/routes/_authenticated/orcamento.tsx`, a calculadora usa descontos fixos por faixa até 30% e calcula a margem resultante, mas não limita o desconto nem bloqueia o orçamento quando a margem cai abaixo de um mínimo. O preço sugerido usa `custo × (1 + percentual)`: isso é markup sobre custo, não margem sobre preço. Esses conceitos precisam de nomes e campos distintos.

Para margem mínima `m` sobre preço líquido e custo total `C`, o preço mínimo é `C / (1 - m)`. O desconto máximo deve respeitar esse piso e também os limites configurados. Se o preço-base não alcançar o piso, indicar inviabilidade em vez de permitir confirmar.

A fórmula atual considera filamento, energia, desgaste por hora e acabamento; não evidencia taxas de venda, impostos, embalagem, purga/perdas e demais custos indiretos.

### Alto — persistência otimista pode divergir

`src/lib/erp-store.tsx` altera estado local antes da confirmação de várias operações no banco e registra falhas apenas no console. No carregamento, erros individuais não são apresentados claramente, então uma falha pode parecer uma lista vazia.

**Direção recomendada:** feedback visível, estado de erro distinto de vazio e rollback quando a gravação falhar.

### Alto — movimentos de estoque não são atômicos

Consumo e registro de falha atualizam saldo, ocorrência e contadores em operações separadas a partir de valores lidos no cliente. Operações simultâneas podem sobrescrever saldo; perdas podem ser limitadas a zero sem uma movimentação auditável.

**Direção recomendada:** RPC transacional no Postgres para movimentos de estoque, com validação, idempotência e trilha imutável por pedido, bandeja, cor e material.

### Pedido de referência ainda precisa de dados produtivos

Pedido informado: 150 medalhas completas de 75 mm, 300 peças frente/verso, entrega em 20/11/2026. Antes de usar a calculadora, precisamos confirmar se 300 significa dois componentes por medalha e obter peso, tempo por bandeja, cores/materiais, impressoras disponíveis, perdas, acabamento e embalagem. Não foi criado orçamento nem lançado pedido.

## Sequência de implementação recomendada

1. Confirmar o projeto Supabase ativo e o histórico de migrations sem ler dados pessoais/financeiros; validar backup restaurável.
2. Desenhar autenticação Auth + empresa/membros + RLS, preservando os três logins e os dados compartilhados.
3. Migrar identidade e políticas numa branch isolada com plano de rollback; validar dois usuários da mesma empresa e um usuário sem vínculo.
4. Tornar escrita e estoque transacionais, com trilha de auditoria.
5. Corrigir precificação, margem mínima e descontos configuráveis.
6. Adicionar produção por bandeja, cor e impressora e então montar o orçamento real das medalhas.

## Limites desta auditoria

Os achados acima se baseiam no código e migrations da branch indicada. Não confirmam o estado do projeto Supabase ativo, o estado de execução das migrations, nem se a credencial de seed ainda existe. Nenhum segredo é reproduzido neste documento.
