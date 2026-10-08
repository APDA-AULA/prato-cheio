## ADRs
* [ADR 0001 - Migração de SQLite para PostgreSQL](adr/0001-migracao-postgresql.md)

## Requisitos não-funcionais

| Requisito | Como afeta o design |
|---|---|
| **R1 - Concorrência (Restrição do Caso)**: Quando duas ONGs diferentes clicarem em "Aceitar" na mesma doação simultaneamente, o sistema deve registar apenas o primeiro clique e rejeitar o segundo. Medido por: teste automatizado a correr múltiplos requests em paralelo validando que apenas 1 retorna status 200. | Afeta a escolha do banco de dados (ADR 0001). Obrigou o abandono do SQLite local para o PostgreSQL (Docker), utilizando a consistência transacional do banco. Custo: necessidade de gerir contentores na máquina. |
| **R2 - Auditabilidade**: Quando o mês fechar, o sistema deve exportar a cópia dos dados de doação intactos. Medido por: execução mensal de um comando (ex: `pg_dump`) gerando um ficheiro legível para envio externo. | Restrição da Vigilância Sanitária. Afeta a gerência de backups. Mantém o PostgreSQL como tecnologia (que suporta dumps completos de forma nativa), mas adiciona custo operacional para correr a rotina. |
| **R3 - Portabilidade**: Quando o servidor de desenvolvimento precisar de subir, ele deve ser inicializado por apenas um comando sem quebrar por dependências locais em falta. Medido por: teste a correr "npm run dev" e validando que a aplicação sobe sem erros na rota `/api/saude`[cite: 2]. | O `src/db.js`[cite: 2] precisou de ser desenhado para consumir uma única variável de ambiente `DATABASE_URL` do `.env`[cite: 2], abstraindo como o banco sobe, além do próprio uso de contentores que foi formalizado na equipa. |

## Critérios de validação do projeto

* [x] **1.** Existe um ADR a documentar a escolha do PostgreSQL via Docker? (Fonte: `docs/adr/0001-migracao-postgresql.md`)
* [x] **2.** A revisão do ADR cobre a restrição mensal da Vigilância Sanitária? (Fonte: `docs/adr/0001-migracao-postgresql.md`, secção Revisão)
* [x] **3.** O script de persistência expõe uma interface independente do SGBD (ex: função `query`)? (Fonte: `src/db.js`[cite: 2])
* [x] **4.** As requisições de aceite validam se o id existe no banco antes de retornar? (Fonte: `src/doacoes.js`[cite: 2])
* [x] **5.** O repositório possui uma action a correr testes em Continuous Integration (CI)? (Fonte: `.github/workflows/ci.yml`[cite: 2])
* [x] **6.** A aplicação protege o aceite duplicado (ONGs concorrentes)? (Fonte: `tests/doacoes.test.js`, item 5[cite: 2])

---

**Fragilidades apontadas na Revisão (Pull Request)**

* **Fragilidade 1 (Apontada por Lucas Giovani Fruck):** Não temos um limite de paginação (um `LIMIT`) na consulta `SELECT * FROM doacoes`[cite: 2] em `listarDisponiveis`[cite: 2]. Se houver 1000 registos, vai retornar tudo.
  * **Resposta da equipa:** **Aceite como limitação.** Para a "História Zero" atual (piloto reduzido), o volume é pequeno, mas será corrigido na próxima iteração antes de expandir o uso.
* **Fragilidade 2 (Apontada por Gustavo José Paulo):** O ficheiro `.env.example`[cite: 2] mostra uma senha *hardcoded* (`postgres://pratocheio:pratocheio@localhost...`)[cite: 2] que pode acabar por ir para o controlo de versão real de desenvolvimento.
  * **Resposta da equipa:** **Contestada com motivo.** É apenas um `.env.example`[cite: 2] para desenvolvimento local com Docker, dados fictícios padrão são seguros nesse contexto para acelerar o setup. O `.env` verdadeiro está no `.gitignore`[cite: 2].