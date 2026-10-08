# ADR 0001 - Migração de SQLite para PostgreSQL

- **Data:** 8 de Outubro de 2026
- **Status:** aceito

## Contexto
Na Unidade 1, adotamos o SQLite embutido (`node:sqlite`) por ser um banco sem configuração que suportava perfeitamente o nosso "walking skeleton". Agora, na Unidade 3, precisamos preparar o produto para suportar uso contínuo. O SQLite armazena os dados em um arquivo local (`dados.sqlite`), o que apresenta falhas de *disk I/O error* ao ser colocado em produção e inviabiliza conexões simultâneas (concorrência) quando múltiplas ONGs tentarem aceitar doações ao mesmo tempo.

## Alternativas consideradas
1. **Manter o SQLite embutido**
   - *Prós:* Nenhuma dependência externa, CI rápido.
   - *Contras:* Inviabiliza deploy escalável; risco de corrupção do arquivo em acessos simultâneos.
2. **PostgreSQL em Contêiner Local (Docker)**
   - *Prós:* Ambiente padronizado para todos os desenvolvedores da equipe, suporta acessos simultâneos e garante consistência transacional robusta.
   - *Contras:* Requer a instalação e manutenção do Docker na máquina de todos os membros do grupo.
3. **PostgreSQL como serviço gerenciado em nuvem (Ex: Neon, Supabase)**
   - *Prós:* Alta disponibilidade sem necessidade de gerenciar infraestrutura.
   - *Contras:* Dependência de internet o tempo todo para o ambiente de desenvolvimento e limitação de conexões nos planos gratuitos.

## Decisão
Decidimos migrar o banco de dados para **PostgreSQL rodando em Contêiner Local (Docker)**. O acesso se dará integralmente pela variável de ambiente `DATABASE_URL` repassada ao script `src/db.js`[cite: 2], isolando a camada de persistência.

## Consequências
- **Positivas:** O sistema suportará concorrência real (várias ONGs acessando ao mesmo tempo sem corromper dados) e o ambiente de desenvolvimento fica idêntico ao ambiente produtivo, garantindo que "funciona na minha máquina, funciona na produção".
- **Negativas:** Exige que todos os integrantes aprendam o básico de Docker e o instalem. O tempo de setup inicial para novos membros aumenta.
- **Riscos e o que fazer se der errado:** Se um membro não conseguir rodar o Docker por limitações de hardware, fallback para um serviço em nuvem gratuito apenas para essa pessoa.

## Rastreabilidade
Atende ao risco de concorrência levantado na Análise (várias pessoas aceitando ao mesmo tempo e o banco quebrando).

## Critério de validação
A implementação na `src/db.js` limitou a abstração ao `query()` retornando `{ rows }`[cite: 2]. A validação é rodar `npm test`[cite: 2]: se os testes atuais da Unidade 1 (`tests/doacoes.test.js`[cite: 2]) passarem com o `DATABASE_URL` apontando para o PostgreSQL em contêiner, a refatoração está validada.

---

## Revisão — 8 de Outubro de 2026
- **O que mudou no contexto:** A Vigilância Sanitária passará a solicitar cópias do Banco de Dados mensalmente.
- **O que da decisão antiga cai:** Nada cai. O uso de Docker continua.
- **O que continua de pé:** Mantemos a decisão de usar o PostgreSQL via Docker (ADR 0001).
- **Por quê:** Fazer dumps mensais em um contêiner PostgreSQL é um procedimento padronizado, seguro e nativo (usando `pg_dump`). A mudança de regra não exige a troca da tecnologia escolhida, apenas a criação de uma rotina extra de exportação.