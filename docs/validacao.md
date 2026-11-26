# Validação — Prato Cheio

*Trabalho 3 · confronto do produto com os critérios de aceite da Unidade 1 e das histórias H1–H4*

Confronto rigoroso entre a implementação atual do produto e os critérios de aceite definidos em [docs/analise.md](analise.md) (Unidade 1, copiados integralmente) seguidos pelos critérios das histórias da Unidade 3.

| # | Critério de aceite | Atende? | Evidência |
|:--:|---|:--:|---|
| U1·1 | Dado que sou um doador preenchendo o formulário, Quando envio sem os campos obrigatórios, Então o sistema recusa e exibe um erro. | atende | Teste `"1. recusa doação sem os campos obrigatórios"` em [tests/doacoes.test.js](../tests/doacoes.test.js), banner visual `#alerta-erro` em [public/index.html](../public/index.html), passo 5 de [docs/demo.md](demo.md) e CI verde. |
| U1·2 | Dado que preenchi corretamente, Quando publico a doação, Então ela aparece na lista de doações disponíveis. | atende | Teste `"2. mostra a doação publicada na lista de disponíveis"` em [tests/doacoes.test.js](../tests/doacoes.test.js), passo 2 de [docs/demo.md](demo.md) e CI verde. |
| U1·3 | Dado que uma doação está disponível, Quando uma ONG clica em aceitar, Então a doação é marcada como aceita. | atende | Teste `"3. marca a doação como aceita pela ONG"` em [tests/doacoes.test.js](../tests/doacoes.test.js), passo 3 de [docs/demo.md](demo.md) e CI verde. |
| U1·4 | Dado que uma doação foi aceita, Quando a lista é atualizada, Então essa doação sai da lista de disponíveis. | atende | Teste `"4. remove a doação da lista de disponíveis depois de aceita"` em [tests/doacoes.test.js](../tests/doacoes.test.js), passo 3 de [docs/demo.md](demo.md) e CI verde. |
| U1·5 | Dado que a doação "Bolo" já foi aceita pela ONG A, Quando a ONG B tenta aceitar "Bolo" diretamente, Então o sistema recusa a ação. | atende | Teste `"5. recusa aceitar uma doação que já foi aceita por outra ONG"` em [tests/doacoes.test.js](../tests/doacoes.test.js) e CI verde. |
| H1·CA1 | Dado que a "Padaria Pão Bom" publicou duas doações e a "Casa Esperança" aceitou uma delas, quando a padaria consulta as suas doações, então vê as duas: uma disponível e outra aceita por Casa Esperança. | atende | Teste `"H1 CA1: lista as doações do doador com situação disponível e aceita pela ONG"` em [tests/doacoes.test.js](../tests/doacoes.test.js), seção "Minhas doações" em [public/index.html](../public/index.html) e passo 4 de [docs/demo.md](demo.md). |
| H1·CA2 | Dado que outro doador publicou uma doação, quando a "Padaria Pão Bom" consulta as suas, então essa doação não aparece. | atende | Testes `"H1 CA2: não exibe doações publicadas por outros doadores"` e `"H1 limite: doações antigas sem doador identificado não aparecem na consulta"` em [tests/doacoes.test.js](../tests/doacoes.test.js). |
| H1·CA3 | Dado que o doador não é informado na publicação, quando a doação é enviada, então ela é recusada com uma mensagem clara e nada é gravado. | atende | Testes `"H1 CA3: recusa publicação quando o doador não é informado e não grava nada"` e `"H1 limite: recusa doador preenchido apenas com espaços em branco"` em [tests/doacoes.test.js](../tests/doacoes.test.js), alerta `#alerta-erro` em [public/index.html](../public/index.html) e passo 5 de [docs/demo.md](demo.md). |

## Critérios que não atendem — por quê

Nenhum critério da Unidade 1 nem da Iteração 1 (H1) encontra-se como `parcial` ou `não atende`. O **Critério 1 da Unidade 1** (que estava `parcial` antes da Iteração 1 por falta de feedback visual na página HTML) passou a `atende` com a entrega do banner `#alerta-erro` em [public/index.html](../public/index.html), exibindo na tela do celular qualquer erro HTTP 400 retornado pela API e limpando o alerta após uma operação válida.

## Mudanças de critério

Durante a evolução do projeto nas Unidades 2 e 3, refinamos a especificação de dois pontos:
- **Critério 5 da Unidade 1 (Concorrência no aceite):** A regra "quem responde primeiro leva" sob conexões móveis passou a exigir retorno HTTP 400 com `{ erro: "Doação já foi aceita por outra ONG." }` em [src/app.js](../src/app.js) / [src/doacoes.js](../src/doacoes.js) e atualização condicional atômica no PostgreSQL (`UPDATE doacoes SET status = 'aceita', ong = $1 WHERE id = $2 AND status = 'disponivel' RETURNING *`) em [src/repositorio.js](../src/repositorio.js).
- **Doações legadas na Iteração 1 (H1):** Ao tornar `doador` obrigatório em tabelas já povoadas, definimos `DEFAULT 'Doador não informado'` na migração em [src/db.js](../src/db.js) para não perder histórico, mantendo esses registros legados fora de `/api/minhas-doacoes` para evitar vazamento entre doadores.

## Limitações do produto

- **Identificação simples sem autenticação (H1):** O doador identifica-se digitando seu nome/estabelecimento (memorizado em `localStorage` no navegador do celular), sem login ou senha; qualquer pessoa que digite exatamente o mesmo nome visualiza a situação dessas doações, e doações antigas (`'Doador não informado'`) ficam fora da consulta individual.
- **Listagem sem geolocalização ou paginação:** A consulta de doações disponíveis retorna todos os itens pendentes em ordem de criação, adequada ao volume local do piloto mas sem filtro de raio geográfico.
- **Expiração automática de 2 horas ainda manual:** O sistema ainda não devolve automaticamente doações aceitas após 2 horas sem coleta em background (a confirmação de coleta entra em H2 e a devolução explícita pela ONG em H3).

## Uso de IA

- **O que a IA fez:** Auxiliou na sintaxe de placeholders `$1, $2...` do `pg` na Iteração 0, sugeriu casos de borda para doador em branco/legado em H1 e gerou o rascunho de estilos responsivos (`375px`) da seção "Minhas doações" e do alerta `#alerta-erro` em [public/index.html](../public/index.html).
- **O que verificamos e erro da IA que corrigimos:**
  - Em [tests/doacoes.test.js](../tests/doacoes.test.js), corrigimos o posicionamento de `afterAll(encerrar)`: havia blocos `afterAll` repetidos dentro de `describe` intermediários que encerravam o pool compartilhado antes das suítes seguintes; unificamos o encerramento uma única vez no fim do arquivo e exigimos asserções sobre os valores reais retornados (`status`, `ong`, `situacao`) em vez de apenas status HTTP.
  - Em [src/repositorio.js](../src/repositorio.js) e [src/doacoes.js](../src/doacoes.js), descartamos sugestões da IA que duplicavam checagens ou acoplavam formatação de tela à SQL, mantendo `listarPorDoador` preservando os campos da linha para que o estado `coletada` (H2) funcione sem retrabalho.
