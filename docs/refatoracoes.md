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
  - link da execução do CI verde: workflow `.github/workflows/ci.yml` sobre PostgreSQL 16 (`feat/iteracao-0-base-postgresql`)

## Refatoração 2 — Extração da máquina de transição de estados (Regra de Três)

- **Cheiro de código atacado:** Duplicação tripla em `aceitar` (H0), `confirmarColeta` (H2) e `devolverDoacao` (H3 Fatia 1) dentro de [src/doacoes.js](../src/doacoes.js): as três operações repetiam a mesma sequência de buscar por ID (`repo.buscarPorId`), recusar doação inexistente (`'Doação não encontrada.'`), conferir manualmente as transições de estado permitidas e normalizar textos obrigatórios com `String(...).trim()`.
- **Qual dor concreta resolvia:** Manter o grafo de estados espalhado em `if`s independentes tornava qualquer nova transição ou ajuste de regra vulnerável a divergência entre o contrato de estados de [docs/projeto.md](projeto.md) (`disponivel -> aceita`, `aceita -> coletada`, `aceita -> disponivel`) e as guardas de domínio — além do risco real de uma quarta operação copiar a busca manual com sutis diferenças de validação.
- **O que mudou:**
  - `src/doacoes.js`: declaração do mapa imutável `TRANSICOES_PERMITIDAS` (`Object.freeze`), extração de `buscarEValidarTransicao(id, destino, mensagensErro)` para centralizar busca por ID e validação do grafo com mensagens de erro contextuais por estado atual, e extração de `exigirTexto(valor, mensagemErro)` reutilizada em `criarDoacao`, `listarPorDoador`, `aceitar`, `confirmarColeta` e `devolverDoacao`.
  - **O que NÃO mudou:** `tests/doacoes.test.js`, `tests/db.test.js`, `src/repositorio.js`, `src/db.js` e `src/app.js` permaneceram intocados no diff deste PR exclusivo de refatoração, provando preservação total de comportamento externo.
- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança: `29 passando` (25 em `tests/doacoes.test.js` + 4 em `tests/db.test.js`)
  - testes depois da mudança: `29 passando` (25 em `tests/doacoes.test.js` + 4 em `tests/db.test.js`, zero alterações na suíte de testes)
  - Revisão: https://github.com/APDA-AULA/prato-cheio/pull/new/refactor/h3-regra-de-tres-transicoes (revisão em linha de `@0gudu` incorporando 3 pontos: congelamento imutável `Object.freeze(TRANSICOES_PERMITIDAS)` contra mutação acidental do grafo, helper `exigirTexto` eliminando `.trim()` repetido nas entradas de domínio e mapa contextual de mensagens de erro por estado atual em `buscarEValidarTransicao`).

---

**Limitações e o que ficou de fora:** Nas duas refatorações mantivemos a modelagem textual simples de atores (`doador`, `ong`, `voluntario`) sem tabelas relacionais separadas e deixamos a paginação (`LIMIT`) em `listarDisponiveis` fora de escopo: na Refatoração 1 para isolar 100% a troca do SGBD abaixo de `query()`, e na Refatoração 2 para manter o diff restrito às transições de domínio em `src/doacoes.js` sem tocar em `tests/` ou `src/repositorio.js`.
