# Refatorações — Prato Cheio

*Trabalho 3 · uma seção por refatoração · o que importa é o motivo e a evidência*

## Refatoração 1 — Migração de SQLite para PostgreSQL

- **Motivo:** Conforme decidido no [ADR 0001](adr/0001-migracao-postgresql.md), o SQLite em arquivo local (`dados.sqlite`) não suporta concorrência real entre múltiplas ONGs aceitando doações simultaneamente, apresenta falhas de *disk I/O error* sob escrita concorrente e diverge do ambiente produtivo. A migração para PostgreSQL 16 garante concorrência real, elimina os erros de I/O e assegura paridade entre desenvolvimento, CI e produção.
- **O que mudou:**
  - `package.json`: adição da dependência `pg` (driver oficial PostgreSQL para Node.js).
  - `src/db.js`: substituição de `node:sqlite` por `Pool` do PostgreSQL conectado via `DATABASE_URL`, criação de schema compatível com PostgreSQL e atualização da guarda `ehBancoDeTeste()` (ADR 0002) para validar URLs/bancos de teste no PostgreSQL antes de permitir `limparBanco()`.
  - `src/repositorio.js`: conversão dos placeholders SQL de `?` para placeholders posicionais do PostgreSQL (`$1, $2...`).
  - `vitest.config.js`: injeção das variáveis de ambiente de teste (`NODE_ENV=test` e `DATABASE_URL` apontando para banco de teste PostgreSQL).
  - `tests/db.test.js`: adaptação dos testes da guarda `ehBancoDeTeste()` / `limparBanco()` para o driver PostgreSQL.
  - `.github/workflows/ci.yml`: ativação do serviço `services: postgres` (PostgreSQL 16) e configuração de `DATABASE_URL` de teste no pipeline.
  - `.env.example`: atualização dos exemplos de `DATABASE_URL` e `DATABASE_URL_TEST` para PostgreSQL.
- **O que NÃO mudou:** `src/doacoes.js` (regras de negócio 100% fora do diff da migração), `src/app.js`, `public/index.html` e `tests/doacoes.test.js`. O contrato `query()` devolvendo `{ rows }` isolou completamente a troca do SGBD na camada de persistência.
- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança: `11 passando` (7 em `tests/doacoes.test.js` + 4 em `tests/db.test.js`)
  - testes depois da mudança: `11 passando` (7 em `tests/doacoes.test.js` + 4 em `tests/db.test.js`, sem alterar nenhum teste de domínio/API)
  - link da execução do CI verde: (será vinculado ao abrir o PR da Iteração 0 no GitHub Actions)

## Refatoração 2 — Planejada para a Iteração 3 (H3 — extração pela Regra de Três em `src/doacoes.js`)

*Planejada para a Iteração 3 (história H3 — devolução de doação aceita pela ONG).*

- **Cheiro de código atacado:** Duplicação da lógica de validação de existência e transição de estado em `src/doacoes.js` (Regra de Três ao atingir três transições: aceitar em H0, confirmar coleta em H2 e devolver em H3).
- **Qual dor concreta isso resolverá:** Concentrar o grafo de transições permitidas (`disponivel -> aceita`, `aceita -> coletada`, `aceita -> disponivel`) e a recusa padronizada em um único ponto, evitando divergência entre regras de transição e mensagens de erro.
- **O que mudará:** Extração de função/mapa auxiliar de validação de transições dentro de `src/doacoes.js`, mantendo rotas e contratos HTTP inalterados.
- **Evidência (testes verdes antes e depois):** A ser registrada na entrega da Iteração 3 com a contagem de testes antes e depois da extração e o link do CI verde.

---

**Limitações e o que ficou de fora:** Nesta Iteração 0, optamos deliberadamente por não alterar `src/doacoes.js`, `src/app.js` nem a modelagem relacional de atores (`doador`/`ong`), e deixamos a paginação (`LIMIT`) em `listarDisponiveis` fora de escopo. O objetivo foi manter o diff da Refatoração 1 estritamente restrito à camada de banco e infraestrutura para provar que o contrato `query()` isolou a troca do SGBD sem regressões.
