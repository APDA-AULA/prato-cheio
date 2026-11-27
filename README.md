# Prato Cheio — Pafrui

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Maria Eduarda Huida — `@Madu-huida`
- Lucas Giovani Fruck — `@LucasGiovaniFruck`
- Gustavo José Paulo — `@0gudu`
- Murilo Calixto Nascimento — `@MuriloCalixto`

## Como rodar

Requisitos:
- **Node.js 22.13 ou superior**.
- **PostgreSQL 16** (via contêiner Docker local ou serviço PostgreSQL instalado localmente).

### 1. Subir o PostgreSQL 16 (Docker ou serviço local)

Conforme decidido no [ADR 0001](docs/adr/0001-migracao-postgresql.md), o jeito recomendado é subir o PostgreSQL 16 em contêiner Docker local (criando o banco de desenvolvimento e o banco isolado de testes):

```bash
docker run --name pratocheio-pg -e POSTGRES_USER=pratocheio -e POSTGRES_PASSWORD=pratocheio -e POSTGRES_DB=pratocheio -p 5432:5432 -d postgres:16
docker exec pratocheio-pg createdb -U pratocheio pratocheio_test
```

Caso prefira usar o **PostgreSQL 16 como serviço local**, garanta que o serviço esteja ativo na porta `5432` com os bancos `pratocheio` (desenvolvimento) e `pratocheio_test` (testes) criados.

### 2. Configurar as variáveis de ambiente

A aplicação conecta-se ao PostgreSQL via `DATABASE_URL`, e os testes usam um banco dedicado via `DATABASE_URL_TEST` (ou `DATABASE_URL` com nome de banco contendo `test`). Copie [.env.example](.env.example) para `.env` ou exporte no terminal — **nunca utilize senhas reais de produção em arquivos de exemplo ou commits**:

```bash
# Exemplo local (valores fictícios de desenvolvimento — nunca use senha real):
export DATABASE_URL="postgres://pratocheio:pratocheio@localhost:5432/pratocheio"
export DATABASE_URL_TEST="postgres://pratocheio:pratocheio@localhost:5432/pratocheio_test"

# No Windows PowerShell:
# $env:DATABASE_URL="postgres://pratocheio:pratocheio@localhost:5432/pratocheio"
# $env:DATABASE_URL_TEST="postgres://pratocheio:pratocheio@localhost:5432/pratocheio_test"
```

### 3. Comandos a partir de um clone limpo

```bash
npm install       # instala dependências (só na primeira vez)
npm run db:migrar # executa as migrações e cria o schema no PostgreSQL
npm test          # executa a suíte de testes automatizados com Vitest
npm start         # sobe a aplicação em http://localhost:3000
npm run dev       # sobe recarregando a cada alteração
```

Os testes contam com banco isolado e trava ativa contra limpeza acidental do banco real (`limparBanco()` com validação `ehBancoDeTeste()`, conforme [ADR 0002](docs/adr/0002-protecao-banco-testes.md)).

## Definição de pronto

Uma história ou tarefa só é considerada pronta quando atende a todos os critérios abaixo:

1. **Critérios de aceite implementados:** Todos os cenários da história funcionam ponta a ponta conforme especificado — **onde é conferido:** diff em `src/` e `public/` comparado com [docs/analise.md](docs/analise.md) e [docs/projeto.md](docs/projeto.md).
2. **Testes automatizados cobrindo caminho feliz e casos de borda:** Suíte automatizada criada ou atualizada validando regras de domínio, banco e respostas HTTP — **onde é conferido:** arquivos em `tests/` e execução de `npm test`.
3. **CI verde no GitHub Actions:** Pipeline executando com PostgreSQL 16 e todos os testes passando sem falhas — **onde é conferido:** aba *Actions* do repositório (workflow `.github/workflows/ci.yml`).
4. **Revisão de código por outro integrante:** Pull Request aberto com template preenchido, registro da seção *Uso de IA* e aprovação formal do revisor designado antes do merge na `main` — **onde é conferido:** aba *Pull Requests* do repositório.
5. **Documentação atualizada:** Alterações arquiteturais, refatorações, validação e roteiro de demo sincronizados com o código entregue — **onde é conferido:** `README.md` e arquivos pertinentes em `docs/` no mesmo PR.

## Donos e revisores (Trabalho 3)

| Iteração / História | Dono(a) | Revisor(a) |
|---|---|---|
| Iteração 0 — Base (PostgreSQL) | Maria Eduarda Huida (`@Madu-huida`) | Lucas Giovani Fruck (`@LucasGiovaniFruck`) |
| H1 — O doador acompanha as suas doações | Lucas Giovani Fruck (`@LucasGiovaniFruck`) | Maria Eduarda Huida (`@Madu-huida`) |
| H2 — O voluntário confirma a coleta | Gustavo José Paulo (`@0gudu`) | Murilo Calixto (`@MuriloCalixto`) |
| H3 — A ONG devolve uma doação aceita + Refatoração 2 | Maria Eduarda Huida (`@Madu-huida`) | Gustavo José Paulo (`@0gudu`) |
| H4 — A Marta vê o resultado do mês | Murilo Calixto (`@MuriloCalixto`) | Lucas Giovani Fruck (`@LucasGiovaniFruck`) |

## O banco: SQLite na U1/U2, PostgreSQL na U3

| Unidade | Banco | O que precisa instalar |
|---|---|---|
| 1 — Análise | **SQLite** (`node:sqlite`, embutido) | nada além do Node |
| 2 — Projeto | SQLite | nada |
| 3 — Construção | **PostgreSQL 16** (ativo após a Refatoração 1) | PostgreSQL 16 (Docker ou serviço local) |

A decisão foi registrada na Unidade 2 no [ADR 0001](docs/adr/0001-migracao-postgresql.md) e executada na Iteração 0 da Unidade 3 (documentada em [docs/refatoracoes.md](docs/refatoracoes.md)). Como `src/db.js` expõe o contrato `query()` devolvendo `{ rows }`, a troca do banco ficou isolada na camada de persistência sem alterar as regras de negócio em `src/doacoes.js`.

## Estrutura

```
src/server.js        entrypoint (npm start)
src/db.js            conexão PostgreSQL, schema e guarda de teste (limparBanco)
src/app.js           rotas da API Express
src/doacoes.js       regras de negócio e validação de transições
src/repositorio.js   acesso ao banco (SQL parametrizado para PostgreSQL)
public/index.html    interface web (responsiva para celular)
tests/               testes automatizados (Vitest + Supertest)
docs/analise.md      documento de análise   (Trabalho 1)
docs/projeto.md      documento de projeto   (Trabalho 2 e contrato U3)
docs/adr/            decisões arquiteturais (ADRs 0001 e 0002)
docs/validacao.md    validação e testes     (Trabalho 3)
docs/refatoracoes.md refatorações feitas    (Trabalho 3)
docs/demo.md         roteiro da demo        (Trabalho 3)
docs/retrospectivas/ retrospectiva de cada iteração
.github/workflows/   pipeline de CI com PostgreSQL 16
```

## Como trabalhar (fluxo de Pull Request)

A partir da Unidade 2, **nada entra direto na `main`**:

```bash
git checkout -b historia/ong-aceita-doacao
# ... implementa, escreve o teste, roda npm test ...
git commit -m "ONG aceita uma doação e ela sai da lista"
git push -u origin historia/ong-aceita-doacao
```

Abra o Pull Request no GitHub, preencha o template, espere o **CI ficar verde** e
peça a revisão de **outro integrante**. Só então faça o merge.

## O que já está pronto e o que falta

**Pronto (Unidades 1, 2 e Iteração 0 do Trabalho 3):**
- História Zero funcionando ponta a ponta: doador publica doação, ONG visualiza disponíveis e aceita a doação (removendo-a da lista de disponíveis e impedindo aceite concorrente duplicado).
- Persistência migrada para **PostgreSQL 16** (Refatoração 1, sem alterar `src/doacoes.js` nem `tests/doacoes.test.js`), com guarda ativa `ehBancoDeTeste()` contra limpeza acidental do banco real.
- Pipeline de CI no GitHub Actions com serviço PostgreSQL 16 e suíte de testes automatizados (11 testes passando).
- Documentação de análise, projeto, ADRs e contrato de estados/políticas do Trabalho 3.

**Falta (Iterações 1 a 4 do Trabalho 3):**
- **H1:** O doador acompanha as suas doações (`doador` obrigatório e tela "Minhas doações").
- **H2:** O voluntário confirma a coleta (`disponivel -> aceita -> coletada`, com primeiro nome/apelido do voluntário).
- **H3 + Refatoração 2:** A ONG devolve uma doação aceita (`aceita -> disponivel`, com motivo de devolução para auditoria) e extração pela Regra de Três em `src/doacoes.js`.
- **H4:** A Marta vê o resultado do mês (métricas mensais de publicadas, aceitas, coletadas e tempo médio até coleta).

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
