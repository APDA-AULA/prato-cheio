# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto

| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|
| **1** | **Migração de SQLite para PostgreSQL em Contêiner Docker na Unidade 3** | 1. Manter SQLite embutido em arquivo local.<br>2. Adotar PostgreSQL como serviço de nuvem (Neon/Supabase). | **Risco de Concorrência e Risco 2 da Análise:** O arquivo `dados.sqlite` falha com *disk I/O error* e não suporta acessos simultâneos de múltiplas ONGs tentando aceitar doações concorrentes. |
| **2** | **Controle Atômico de Concorrência no Aceite via SQL (`UPDATE ... WHERE status = 'disponivel'`)** | 1. Trava em memória local no Node.js (Mutex).<br>2. Transação pessimista pesada com locks explícitos (`SELECT ... FOR UPDATE`). | **Regra Praticada da Análise ("Quem responde primeiro leva"):** Garante atomicidade transacional e integridade sem risco de duas ONGs receberem confirmação para a mesma doação. |
| **3** | **Guarda Lógica Ativa contra Limpeza Acidental em Testes (`limparBanco()`)** | 1. Confiar unicamente na configuração estática de variáveis de ambiente externas.<br>2. Criar usuário com permissões restritas (sem `DELETE`) no SGBD. | **Mudança de Contexto (Etapa 4 - Incidente do Piloto):** Risco de perda catastrófica de doações reais caso testes automatizados sejam rodados apontando para o banco de produção. |

---

## Tabela de trade-offs (uma decisão em detalhe)

*Decisão detalhada: **Migração de SQLite para PostgreSQL (ADR 0001)***

| Critério | Alternativa A: SQLite embutido (`node:sqlite`) | Alternativa B: PostgreSQL em Contêiner Local (Docker) | Alternativa C: PostgreSQL Gerenciado em Nuvem (Neon/Supabase) |
|---|---|---|---|
| **Concorrência e Locks** | Fraca. Bloqueia o arquivo inteiro em operações de escrita; falha sob concorrência simultânea. | **Excelente.** Nível de isolamento robusto para transações concorrentes e acessos de múltiplas ONGs. | **Excelente.** Escalabilidade horizontal e conexões simultâneas gerenciadas. |
| **Fidelidade com Produção** | Baixa. Comportamento e tipos SQL diferem do ambiente produtivo. | **Alta.** O mesmo container e versão rodam em desenvolvimento, testes de integração e homologação. | Média/Alta. Pode haver variações de latência de rede e restrições de planos gratuitos. |
| **Autonomia e Dependência de Rede** | Totalmente autônomo e offline. | **Totalmente autônomo e offline** após baixar a imagem do container Docker. | Fraca. Depende de conexão estável e contínua à internet para desenvolvimento e CI. |
| **Custo de Setup e Complexidade** | Zero configuração (já embutido no Node 22). | Médio. Exige instalação e gerenciamento do Docker na máquina dos integrantes. | Médio. Exige gerenciamento de credenciais e risco de esgotar conexões do plano gratuito. |
| **Veredito** | Adotado na Unidade 1 para o Walking Skeleton. | **Adotado para a evolução (ADR 0001).** | Descartado para não tornar o desenvolvimento refém de rede externa em aula. |

---

## Diagramas

* Links dos diagramas:
  * [Diagrama de Contexto](diagramas/contexto.md)
  * [Diagrama de Dados](diagramas/dados.md)

### Três divergências entre o Diagrama de Dados e o `src/db.js`

1. **Tipagem de data e hora (`validade` e `criada_em`):** No diagrama conceitual de dados, os campos são tipados formalmente como `DATE` e `TIMESTAMP`. No `src/db.js` (SQLite), estão definidos como `TEXT` (com padrão `(datetime('now'))`), visto que o SQLite embutido não possui tipos de data nativos e delega o parsing à aplicação.
2. **Restrição de integridade de domínio para `status`:** No diagrama de dados, o ciclo de vida do campo `status` é restrito pelo domínio enumerado (`disponivel` ou `aceita`). No `src/db.js`, o campo foi criado apenas como `TEXT NOT NULL DEFAULT 'disponivel'`, sem uma constraint explícita `CHECK (status IN ('disponivel', 'aceita'))`.
3. **Ausência de chave estrangeira com entidades de atores (`ong` e `doador`):** No diagrama conceitual de dados, o aceite de uma doação relaciona a entidade `DOACAO` à entidade `ONG`. No `src/db.js`, o campo `ong` é armazenado como uma string textual desnormalizada (`TEXT`), simplificada para o escopo da história zero sem tabela relacional própria.

---

## ADRs

* [ADR 0001 — Migração de SQLite para PostgreSQL](adr/0001-migracao-postgresql.md)
* [ADR 0002 — Proteção e Isolamento do Banco de Dados contra Limpeza Acidental em Testes](adr/0002-protecao-banco-testes.md)

---

## Requisitos não-funcionais

| Requisito | Como afeta o design |
|---|---|
| **RNF 1 (Restrição do Caso - Conexão Móvel/Instável na Coleta)**: Quando uma ONG aceita uma doação usando celular em conexão móvel instável na rua, o sistema deve processar a requisição e confirmar o aceite em menos de 1,5 segundos sem travar a interface, medido por teste de carga com latência simulada de rede de 500ms via DevTools. | Isso muda o design do endpoint `/api/doacoes/:id/aceitar` para dispensar chamadas síncronas pesadas ou renderizações no servidor, devolvendo payload mínimo em JSON, a um custo de tratamento de timeouts na interface assumido pela equipe de desenvolvimento. |
| **RNF 2 (Concorrência entre ONGs - Regra do Caso)**: Quando duas ONGs clicarem em "Aceitar" simultaneamente para a mesma doação disponível, o sistema deve registrar apenas o primeiro clique e rejeitar o segundo com código HTTP 400, medido por teste automatizado disparando requisições concorrentes paralelas em `Promise.all`. | Isso muda o design da camada de dados (`src/repositorio.js`) para usar atualização condicional atômica (`UPDATE ... WHERE status = 'disponivel'`), a um custo de validação defensiva de 0 linhas retornadas pago pela equipe de backend. |
| **RNF 3 (Integridade e Segurança de Dados - Etapa 4c)**: Quando uma rotina de testes automatizados for disparada acidentalmente em ambiente de produção ou apontando para arquivo real, o sistema deve abortar imediatamente a exclusão e preservar intactos todos os dados de doações, medido por teste automatizado com `NODE_ENV=production` que valida lançamento de erro e total de registros inalterado. | Isso muda a função `limparBanco()` em `src/db.js`, adicionando uma cláusula de guarda ativa (`ehBancoDeTeste()`), a um custo de parametrização estrita de variáveis de ambiente no `vitest.config.js` mantido pelos desenvolvedores. |

> **Nota da Etapa 4c:** O requisito **RNF 3** e o Critério de Validação **4** foram expressamente adicionados para atender à mudança de contexto do incidente do piloto (equipe da Marta), blindando o banco real contra rotinas de teste.

---

## Critérios de validação do projeto

* [x] **1.** Existe um ADR documentando a escolha do PostgreSQL via Docker? (Fonte: [`docs/adr/0001-migracao-postgresql.md`](adr/0001-migracao-postgresql.md))
* [x] **2.** A revisão do ADR cobre as restrições da Vigilância Sanitária e o incidente do banco no piloto? (Fonte: [`docs/adr/0001-migracao-postgresql.md`](adr/0001-migracao-postgresql.md), seções Revisão)
* [x] **3.** O script de persistência expõe uma interface independente do SGBD com função `query()`? (Fonte: [`src/db.js`](../src/db.js))
* [x] **4.** A função de limpeza recusa apagar dados reais e falha em ambiente que não seja de teste? (Fonte: [`src/db.js`](../src/db.js), `limparBanco()` e teste [`tests/db.test.js`](../tests/db.test.js))
* [x] **5.** O repositório possui uma action rodando testes automatizados em Continuous Integration (CI)? (Fonte: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml))
* [x] **6.** A aplicação protege o aceite duplicado concorrente entre ONGs? (Fonte: [`src/repositorio.js`](../src/repositorio.js) e teste 5 em [`tests/doacoes.test.js`](../tests/doacoes.test.js))

---

### Fragilidades apontadas na Revisão por Pares (Pull Request)

* **Fragilidade 1 (Apontada por Lucas Giovani Fruck):** Não temos um limite de paginação (`LIMIT`) na consulta `SELECT * FROM doacoes` em `listarDisponiveis`. Se houver 1000 registros, o endpoint trará todo o volume de uma vez.
  * **Resposta da equipe:** **Aceita como limitação.** Para a História Zero e o piloto reduzido, o volume diário é baixo. O fatiamento com paginação será tratado na próxima iteração.
* **Fragilidade 2 (Apontada por Gustavo José Paulo):** O arquivo `.env.example` continha credenciais padrão que poderiam ser propagadas inadvertidamente para ambientes produtivos.
  * **Resposta da equipe:** **Contestada com motivo.** O `.env.example` documenta apenas o template de variáveis fictícias para execução de contêiner local de desenvolvimento. O arquivo `.env` real com credenciais sensíveis está devidamente ignorado no `.gitignore`.

---

## Uso de IA

* **O que foi gerado com IA:**
  * Esqueleto estrutural da tabela de trade-offs comparando SQLite e PostgreSQL.
  * Estrutura inicial dos diagramas de contexto e de dados em notação Mermaid.
  * Sugestão de cenários de borda para escrita do teste da trava do banco de dados na Etapa 4b.
* **O que a equipe revisou e alterou:**
  * Adequação dos requisitos não-funcionais à fórmula estrita do PDF (`Quando <estímulo>, o sistema <resposta>, medido por <métrica>. Isso muda <decisão>, a um custo de <quem paga>`).
  * Inclusão das 3 divergências reais entre o modelo conceitual e a implementação em SQLite no `src/db.js`.
* **Erro da IA corrigido pelo grupo:**
  * **O erro:** Ao propor a implementação da trava da Etapa 4b para `limparBanco()`, a IA sugeriu checar apenas se `process.env.DATABASE_URL.includes('localhost')`.
  * **Por que estava errado e como corrigimos:** Essa sugestão é perigosa e incorreta por dois motivos: (1) o piloto roda em máquina local, logo o banco real também está em `localhost`; e (2) no estágio atual da Unidade 2, o banco é SQLite em arquivo (`dados.sqlite`), não usando `DATABASE_URL`. O grupo rejeitou essa lógica e implementou a função `ehBancoDeTeste()`, que valida estritamente se `NODE_ENV === 'production'` e se o banco é `:memory:` ou arquivo específico de teste, garantindo a proteção real do banco do piloto da Marta.
