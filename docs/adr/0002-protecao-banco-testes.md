# ADR 0002 — Proteção e Isolamento do Banco de Dados contra Limpeza Acidental em Testes

- **Data:** 22 de Outubro de 2026
- **Status:** aceito

## Contexto
O piloto do sistema Prato Cheio entrou em operação e conta com doações reais cadastradas por doadores parceiros. Durante uma verificação na máquina do piloto, um membro da equipe executou a suíte de testes (`npm test`) com a configuração apontando para o arquivo de banco real (`dados.sqlite`). A função `limparBanco()`, executada antes de cada teste para garantir isolamento da suíte, executou `DELETE FROM doacoes` e apagou todos os registros reais. A coordenadora Marta solicitou uma garantia inegociável de que testes jamais consigam apagar dados de produção, independentemente da máquina ou da configuração em que forem disparados.

## Alternativas consideradas
1. **Confiar exclusivamente na configuração externa (`DATABASE_FILE=:memory:`)**
   - *Prós:* Não exige código adicional de checagem.
   - *Contras:* Extremamente frágil. Qualquer variável de ambiente sobrescrita por engano em terminal ou script CI roda a limpeza no banco real sem qualquer barreira.
2. **Trava em nível de código no script de banco (`src/db.js`) com checagem de ambiente e tipo de banco**
   - *Prós:* Barreira ativa no runtime da aplicação. Se `NODE_ENV === 'production'` ou se o banco não for comprovadamente em memória (`:memory:`) ou de teste, a função `limparBanco()` lança exceção imediata e aborta antes de qualquer comando SQL.
   - *Contras:* Requer manutenção de uma função de guarda (`ehBancoDeTeste()`) e testes automatizados dedicados a essa trava.
3. **Restrição por usuário e privilégios no SGBD**
   - *Prós:* Segurança na camada de infraestrutura.
   - *Contras:* Inviável no SQLite atual (que é monousuário em arquivo local) e adiciona complexidade desnecessária na Unidade 2 antes da migração para PostgreSQL.

## Decisão
Decidimos adotar a **Trava em nível de código combinada com SQLite em memória**. No arquivo `src/db.js`, a função `limparBanco()` agora invoca a guarda `ehBancoDeTeste()`. A limpeza é abortada com erro se `NODE_ENV === 'production'` ou se `DATABASE_FILE` for um arquivo persistente não marcado para testes. Adicionalmente, `vitest.config.js` injeta permanentemente `DATABASE_FILE: ':memory:'` e `NODE_ENV: 'test'`.

## Consequências
- **Positivas:** Mesmo que alguém rode `npm test` na máquina do piloto ou em produção, o comando é bloqueado antes de apagar qualquer doação cadastrada.
- **Negativas:** Adiciona um acoplamento sutil entre as variáveis de ambiente e a rotina de limpeza, exigindo que os scripts de teste declarem o ambiente de teste.
- **Riscos e o que fazer se der errado:** Se um teste precisar de persistência temporária em arquivo, o nome do arquivo deve conter a palavra `test` (ex: `temp.test.sqlite`), respeitando a regra da guarda.

## Rastreabilidade
Atende à restrição de integridade crítica do projeto decorrente da mudança de contexto na Etapa 4 (demanda da Marta contra perda de dados do piloto).

## Critério de validação
A suíte `tests/db.test.js` testa explicitamente que:
1. Em ambiente normal de teste (`:memory:`), `limparBanco()` executa com sucesso.
2. Quando configurado com `NODE_ENV = 'production'` ou apontando para `dados.sqlite`, `limparBanco()` lança exceção com a mensagem de operação abortada e nenhuma linha da tabela é deletada.
