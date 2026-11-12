# Validação — Prato Cheio

*Trabalho 3 · confronto do produto com os critérios de aceite escritos na Unidade 1*

Confronto rigoroso entre a implementação atual do produto e os critérios de aceite definidos no documento de [analise.md](file:///c:/Users/maria.huida/Documents/prato-cheio/docs/analise.md) na Unidade 1.

| # | Critério de aceite (da Unidade 1) | Atende? | Evidência |
|:--:|---|:--:|---|
| 1 | Dado que sou um doador preenchendo o formulário, Quando envio sem os campos obrigatórios, Então o sistema recusa e exibe um erro. | parcial | Teste `"1. recusa doação sem os campos obrigatórios"` em [doacoes.test.js](file:///c:/Users/maria.huida/Documents/prato-cheio/tests/doacoes.test.js#L38-L45), CI da main. A API bloqueia e retorna 400 com mensagem de erro, mas falta feedback visual de erro na tela [index.html](file:///c:/Users/maria.huida/Documents/prato-cheio/public/index.html) (sem passo na demo visual). |
| 2 | Dado que preenchi corretamente, Quando publico a doação, Então ela aparece na lista de doações disponíveis. | atende | Teste `"2. mostra a doação publicada na lista de disponíveis"` em [doacoes.test.js](file:///c:/Users/maria.huida/Documents/prato-cheio/tests/doacoes.test.js#L47-L57), demo passo 2, CI da main. |
| 3 | Dado que uma doação está disponível, Quando uma ONG clica em aceitar, Então a doação é marcada como aceita. | atende | Teste `"3. marca a doação como aceita pela ONG"` em [doacoes.test.js](file:///c:/Users/maria.huida/Documents/prato-cheio/tests/doacoes.test.js#L70-L83), demo passo 3, CI da main. |
| 4 | Dado que uma doação foi aceita, Quando a lista é atualizada, Então essa doação sai da lista de disponíveis. | atende | Teste `"4. remove a doação da lista de disponíveis depois de aceita"` em [doacoes.test.js](file:///c:/Users/maria.huida/Documents/prato-cheio/tests/doacoes.test.js#L85-L98), demo passo 3, CI da main. |
| 5 | Dado que a doação "Bolo" já foi aceita pela ONG A, Quando a ONG B tenta aceitar "Bolo" diretamente, Então o sistema recusa a ação. | atende | Teste `"5. recusa aceitar uma doação que já foi aceita por outra ONG"` em [doacoes.test.js](file:///c:/Users/maria.huida/Documents/prato-cheio/tests/doacoes.test.js#L100-L116), CI da main. |

## Critérios que não atendem — por quê

### Critério 1: Validação de campos obrigatórios e feedback visual
- **O que funciona:** A validação dos campos obrigatórios (`tipo`, `quantidade` e `validade`) está implementada na camada de domínio em [doacoes.js](file:///c:/Users/maria.huida/Documents/prato-cheio/src/doacoes.js#L7-L17) e na rota `POST /api/doacoes` em [app.js](file:///c:/Users/maria.huida/Documents/prato-cheio/src/app.js#L20-L26), retornando status HTTP 400 com JSON `{ erro: "Tipo, quantidade e validade são obrigatórios." }`. O comportamento é verificado e coberto pelo teste automatizado `"1. recusa doação sem os campos obrigatórios"` em [doacoes.test.js](file:///c:/Users/maria.huida/Documents/prato-cheio/tests/doacoes.test.js#L38-L45) e passa no CI da branch `main`.
- **O que falta:** Falta um elemento visual amigável de alerta na página [index.html](file:///c:/Users/maria.huida/Documents/prato-cheio/public/index.html) para exibir a mensagem de erro diretamente na interface do navegador quando a requisição falha com 400 (atualmente a tela executa o `fetch` sem atualizar a UI com a mensagem de erro).
- **Por que ficou de fora:** A equipe priorizou na iteração corrente a migração da persistência de SQLite para PostgreSQL em contêiner Docker (ADR 0001), as refatorações da camada de acesso a dados em [repositorio.js](file:///c:/Users/maria.huida/Documents/prato-cheio/src/repositorio.js) e [db.js](file:///c:/Users/maria.huida/Documents/prato-cheio/src/db.js), a guarda ativa em `limparBanco()` contra exclusão acidental e a estabilização completa do fluxo principal ponta a ponta na `main`.
- **Plano de ação:** A renderização visual da mensagem de erro na interface será finalizada na noite de trabalho remoto em 26/11 para o fechamento da branch `entrega-3` em 03/12.

## Mudanças de critério

Durante a evolução do projeto nas Unidades 2 e 3, refinamos a especificação do **Critério 5**:
- **Critério original da Unidade 1:** *"Dado que a doação 'Bolo' já foi aceita pela ONG A, Quando a ONG B tenta aceitar 'Bolo' diretamente, Então o sistema recusa a ação."*
- **Refinamento técnico e aprendizado:** A regra de negócio "quem responde primeiro leva" sob conexões móveis exigiu que o critério especificasse o comportamento transacional exato sob concorrência. Uma verificação ingênua na memória da aplicação criava risco de *race condition* (duas ONGs aceitando o mesmo alimento simultaneamente). O critério passou a exigir explicitamente:
  1. Retorno de status HTTP 400 com payload `{ erro: "Doação já foi aceita por outra ONG." }` no endpoint `POST /api/doacoes/:id/aceitar` ([app.js](file:///c:/Users/maria.huida/Documents/prato-cheio/src/app.js#L28-L34) e [doacoes.js](file:///c:/Users/maria.huida/Documents/prato-cheio/src/doacoes.js#L33-L48)).
  2. Execução atômica e condicional na camada de dados via SQL: `UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ? AND status = 'disponivel' RETURNING *` em [repositorio.js](file:///c:/Users/maria.huida/Documents/prato-cheio/src/repositorio.js#L34-L40), garantindo atomicidade no banco de dados.

## Limitações do produto

O produto atual foca estritamente na História Zero (Publicar → Listar → Aceitar → Remover da lista) e apresenta as seguintes limitações deliberadas:
- Ausência de autenticação e controle de acesso: doadores e ONGs não realizam login nem possuem perfis protegidos por senha.
- Ausência de filtros por proximidade geográfica e paginação na listagem de doações disponíveis.
- Inexistência de rotina automática de devolução para a lista após 2 horas sem confirmação de coleta pela ONG/voluntário.

## Uso de IA

- **Uso como copiloto:** A IA foi utilizada para assistência na sintaxe das consultas com parâmetros no driver PostgreSQL (`pg`), apoio na resolução de conflitos de merge e proposição de casos de borda para os testes automatizados, bem como revisão de ambiguidades no texto do roteiro da demo.
- **Verificação e correções manuais da equipe:**
  - Em [repositorio.js](file:///c:/Users/maria.huida/Documents/prato-cheio/src/repositorio.js) e [doacoes.js](file:///c:/Users/maria.huida/Documents/prato-cheio/src/doacoes.js), descartamos trechos sugeridos pela IA que duplicavam checagens de status em memória antes da operação de banco, mantendo a atualização atômica e condicional no SQL.
  - Em [doacoes.test.js](file:///c:/Users/maria.huida/Documents/prato-cheio/tests/doacoes.test.js), substituímos asserções superficiais geradas por IA (que checavam apenas o status HTTP) por validações completas dos valores de retorno no corpo (`body`) e do estado final no banco de dados.
  - Todos os fluxos ponta a ponta foram validados manualmente no navegador em modo de emulação móvel e inspecionados diretamente nas tabelas do PostgreSQL.
