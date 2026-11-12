# Prato Cheio — Pafrui

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Gustavo José Paulo — @0gudu
- Lucas Giovani Fruck — @LucasGiovaniFruck
- Maria Eduarda Huida — @Madu-huida
-  Murilo Calixto Nascimento - @MuriloCalixto

## Como rodar

Requisitos:
- **Node.js 22.13 ou superior**.
- **PostgreSQL 16** (acessível via contêiner Docker local ou serviço gerenciado).

### 1. Subir o PostgreSQL (via Docker)

Conforme decidido no [0001-migracao-postgresql.md](file:///c:/Users/maria.huida/Documents/prato-cheio/docs/adr/0001-migracao-postgresql.md), o PostgreSQL roda em contêiner local:

```bash
docker run --name pratocheio-pg -e POSTGRES_USER=pratocheio -e POSTGRES_PASSWORD=pratocheio -e POSTGRES_DB=pratocheio -p 5432:5432 -d postgres:16
```

### 2. Configurar a variável de ambiente

O produto conecta-se ao banco exclusivamente via `DATABASE_URL`. Configure no seu ambiente ou copie o arquivo [.env.example](file:///c:/Users/maria.huida/Documents/prato-cheio/.env.example) para `.env`:

```bash
# Exemplo de DATABASE_URL (nunca utilize senhas reais de produção em exemplos):
export DATABASE_URL=postgres://pratocheio:pratocheio@localhost:5432/pratocheio

# No Windows PowerShell:
# $env:DATABASE_URL="postgres://pratocheio:pratocheio@localhost:5432/pratocheio"
```

### 3. Comandos a partir de um clone limpo

```bash
npm install       # instala dependências (só na primeira vez)
npm run db:migrar # executa as migrações e cria o schema no PostgreSQL
npm start         # sobe a aplicação em http://localhost:3000
npm test          # executa a suíte de testes automatizados com Vitest
npm run dev       # sobe recarregando a cada alteração
```

Os testes unitários e de integração contam com banco isolado e proteção contra limpeza acidental do banco de produção (`limparBanco()` com verificação estrita de ambiente de teste conforme [0002-protecao-banco-testes.md](file:///c:/Users/maria.huida/Documents/prato-cheio/docs/adr/0002-protecao-banco-testes.md)).

## Definição de pronto (DoD)

Uma história ou tarefa só é considerada pronta quando atende aos seguintes critérios:

1. **Critérios de aceite implementados:** A funcionalidade cumpre todos os cenários da análise (conferido no diff de `src/` e [analise.md](file:///c:/Users/maria.huida/Documents/prato-cheio/docs/analise.md)).
2. **Testes automatizados cobrindo caminho feliz e casos de borda:** Suíte de testes criada ou atualizada com asserções de valor e status HTTP (conferido em `tests/` e execução de `npm test`).
3. **CI verde no GitHub Actions:** Pipeline de integração contínua executando sem erros e com testes passando (conferido na aba *Actions* do repositório).
4. **Revisão de código por outro integrante:** Pull Request aberto com template preenchido, declaração da seção *Uso de IA* e aprovação formal de um par antes do merge na `main` (conferido na aba *Pull Requests*).

## O banco: SQLite agora, PostgreSQL depois

| Unidade | Banco | O que precisa instalar |
|---|---|---|
| 1 — Análise | **SQLite** (`node:sqlite`, embutido) | nada além do Node |
| 2 — Projeto | SQLite | nada |
| 3 — Construção | **PostgreSQL** (após refatorar) | um PostgreSQL acessível — o caminho é escolha do grupo |

A troca não é acidente de percurso: na Unidade 2 vocês registram a decisão em um **ADR** (alternativas, consequências, riscos) e na Unidade 3 executam a **refatoração** — com os testes existentes provando que o comportamento se manteve.

O `src/db.js` foi desenhado para isso: ele expõe `query()` devolvendo `{ rows }`, então a troca do banco fica contida nele e não vaza para as regras de negócio.

**Como o PostgreSQL vai subir é decisão do grupo**, comparada no mesmo ADR: instalar o PostgreSQL na máquina, subir um contêiner, ou usar um serviço gerenciado gratuito (Neon, Supabase, Render). A disciplina não impõe o caminho — exige o banco alcançável por `DATABASE_URL`, o schema migrado e o CI verde. Cada opção tem custo e risco diferentes, e reconhecê-los é parte da decisão.

## Estrutura

```
src/server.js        entrypoint (npm start)
src/db.js            conexão e schema do banco (pronto)
src/app.js           rotas da API
src/doacoes.js       regras de negócio      <- implementar (U1)
src/repositorio.js   acesso ao banco (SQL)  <- implementar (U1)
public/index.html    interface (funciona no celular)
tests/               testes automatizados
docs/analise.md      documento de análise   (Trabalho 1)
docs/projeto.md      documento de projeto   (Trabalho 2)
docs/adr/            decisões arquiteturais (Trabalho 2)
docs/validacao.md    validação e testes     (Trabalho 3)
docs/refatoracoes.md refatorações feitas    (Trabalho 3)
docs/demo.md         roteiro da demo        (Trabalho 3)
docs/retrospectivas/ retrospectiva de cada iteração
.github/workflows/   pipeline de CI
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

Pronto: estrutura do projeto, interface básica, rota de saúde, **conexão com o banco e o schema** (`src/db.js`), CI configurado e um teste passando (prova que a aplicação sobe).

Falta (Trabalho 1 — walking skeleton): implementar `src/doacoes.js` (regras) e
`src/repositorio.js` (SQL) para que a história zero funcione ponta a ponta —
**um doador publica uma doação → uma ONG vê a doação → a ONG a aceita e ela sai da lista.**
Os critérios de aceite estão em `tests/doacoes.test.js` como `it.todo`: troque cada um
por um teste de verdade conforme implementa.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
