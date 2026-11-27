# Roteiro da demo — Prato Cheio

*Trabalho 3 · 3 minutos · outra pessoa precisa conseguir reproduzir só lendo isto*

## Antes de começar

Para reproduzir este roteiro a partir de um clone novo, é necessário ter o Node.js (versão 22.13 ou superior) e uma instância do PostgreSQL 16 no ar, exatamente como descrito no [README.md](../README.md).

### 1. Subir o PostgreSQL

Execute o contêiner Docker oficial do PostgreSQL (ou utilize um serviço equivalente):

```bash
docker run --name pratocheio-pg -e POSTGRES_USER=pratocheio -e POSTGRES_PASSWORD=pratocheio -e POSTGRES_DB=pratocheio -p 5432:5432 -d postgres:16
docker exec pratocheio-pg createdb -U pratocheio pratocheio_test
```

### 2. Configurar a variável de ambiente

Defina a variável `DATABASE_URL` no terminal ou configure no arquivo `.env` (baseado no [.env.example](../.env.example)):

```bash
export DATABASE_URL="postgres://pratocheio:pratocheio@localhost:5432/pratocheio"

# No Windows PowerShell:
# $env:DATABASE_URL="postgres://pratocheio:pratocheio@localhost:5432/pratocheio"
```

### 3. Comandos de inicialização (clone limpo)

No diretório raiz do repositório clonado:

```bash
npm install
npm run db:migrar
npm start
```

O servidor sobe e fica disponível em `http://localhost:3000`.

### 4. Modo de visualização

Abra o navegador em **modo mobile** (no Chrome/Firefox/Edge: pressione `F12` ou `Ctrl+Shift+I`, clique no ícone de emulação de dispositivos / *Toggle device toolbar* e selecione uma resolução móvel padrão, ex.: iPhone SE ou largura de `375px`). O produto foi projetado prioritariamente para uso em celular por doadores na cozinha e voluntários em trânsito.

---

## Roteiro (3 minutos)

| Tempo | O que mostrar | O que se prova |
|---|---|---|
| 0:00–0:20 | **O problema em uma frase:** O Prato Cheio conecta doadores de alimentos excedentes a ONGs antes que a comida se perca e seja descartada. | Por que o produto existe: atende à dor central do descarte de alimentos de boa qualidade enquanto cozinhas comunitárias enfrentam escassez. |
| 0:20–2:00 | **A vida completa da doação e o resultado do mês no celular (Passos 1 a 7):** "Padaria Pão Bom" publica duas doações; "Casa Esperança" aceita a primeira e o voluntário `"Rui"` confirma a coleta (H2), refletida em **Minhas doações** (H1); a ONG aceita e devolve a segunda com motivo `"sem voluntário hoje"` (H3); e a Marta consulta o **Resultado do mês** (H4). | O produto executa ponta a ponta `disponivel -> aceita -> coletada`, o retorno `aceita -> disponivel` sem rastro da ONG anterior e a consolidação mensal sobre PostgreSQL. |
| 2:00–2:35 | **Um caso de erro tratado com alerta visual (Passo 8):** Tentativa de publicar sem informar o doador (ou devolver sem motivo). O backend recusa com HTTP 400 e a tela mobile exibe imediatamente o banner vermelho `#alerta-erro` sem alterar o banco. | Os limites do domínio estão protegidos em `src/doacoes.js` e comunicados visualmente no celular (U1·1, H1·CA3, H2 e H3). |
| 2:35–3:00 | **O que falta e por quê:** Autenticação com login/senha, expiração automática em background após 2 horas sem coleta e paginação/geolocalização ficaram fora do piloto para validar o ciclo essencial sem atrito de cadastro. | A equipe conhece os limites atuais do produto e priorizou fatias verticais testadas de maior impacto. |

---

## Passo a passo reproduzível

1. **Abrir a aplicação em modo mobile (`375px`):**
   - Acesse `http://localhost:3000` no navegador com a emulação mobile ativada (`375px` de largura).
   - *Resultado esperado:* A tela exibe o cabeçalho "Prato Cheio", o formulário "Publicar doação", o painel "Doações disponíveis" (com `Casa Esperança` preenchida), "Doações aceitas (aguardando coleta)", "Minhas doações" e "Resultado do mês (Painel da Marta)".

2. **Publicar duas doações como "Padaria Pão Bom":**
   - No campo **Seu nome / estabelecimento**, digite: `Padaria Pão Bom`.
   - Preencha **Tipo de alimento** com `Pão Francês`, **Quantidade** com `30 unidades`, **Validade / retirar até** com `2026-12-31` e clique em **Publicar**.
   - Em seguida, mantendo `Padaria Pão Bom` (salvo automaticamente no `localStorage`), preencha **Tipo de alimento** com `Sopa de Legumes`, **Quantidade** com `15 porções`, **Validade / retirar até** com `2026-12-31` e clique em **Publicar**.
   - *Resultado esperado:* Ambas as doações aparecem em "Doações disponíveis" com o botão **Aceitar**, e o painel "Minhas doações" sincroniza `Padaria Pão Bom` exibindo os dois itens com `Situação: disponivel`.

3. **Aceitar uma das doações pela ONG "Casa Esperança":**
   - No painel "Doações disponíveis", confirme que o campo **Identificação da ONG (para aceitar)** contém `Casa Esperança`.
   - Localize o item `Sopa de Legumes — 15 porções (até 2026-12-31) · Doador: Padaria Pão Bom` e clique em **Aceitar**.
   - *Resultado esperado:* `Sopa de Legumes` é marcada como `aceita` no PostgreSQL, sai de "Doações disponíveis", entra em **Doações aceitas (aguardando coleta)** como `Sopa de Legumes — 15 porções · ONG: Casa Esperança` e aparece em "Minhas doações" com `Situação: aceita por Casa Esperança`.

4. **Confirmar a coleta presencial com o voluntário "Rui" (H2 no celular):**
   - No painel **Doações aceitas (aguardando coleta)** (`#lista-aceitas`), localize o item `Sopa de Legumes — 15 porções · ONG: Casa Esperança`.
   - No campo `Primeiro nome do voluntário (ex.: Rui)`, digite `Rui` e clique em **Confirmar coleta**.
   - *Resultado esperado:* A API `POST /api/doacoes/:id/coletar` responde `HTTP 200` gravando `status = 'coletada'`, `voluntario = 'Rui'` e o horário `coletada_em`; a doação sai da lista de aguardando coleta (`Nenhuma doação aguardando coleta.`).

5. **Acompanhar a situação atualizada em "Minhas doações" (H1 + H2 CA3 no celular):**
   - No painel **Minhas doações**, confirme `Padaria Pão Bom` em `#filtro-doador` e clique em **Consultar minhas doações** (a lista também atualiza automaticamente após a coleta).
   - *Resultado esperado:* `GET /api/minhas-doacoes?doador=Padaria%20P%C3%A3o%20Bom` responde `HTTP 200` exibindo `Pão Francês` como `Situação: disponivel` e `Sopa de Legumes` como `Situação: coletada (voluntário: Rui)`.

6. **Devolver uma doação aceita pela ONG com motivo (H3 no celular):**
   - Em **Doações disponíveis**, clique em **Aceitar** no item `Pão Francês — 30 unidades`. Em seguida, em **Doações aceitas (aguardando coleta)**, mantenha `Casa Esperança` em **ONG responsável (para devolução)**, digite `sem voluntário hoje` em **Motivo da devolução** e clique em **Devolver doação**.
   - *Resultado esperado:* `POST /api/doacoes/:id/devolver` responde `HTTP 200` gravando `motivo_devolucao = 'sem voluntário hoje'` para auditoria e limpando `ong = null`; `Pão Francês` volta inteira para **Doações disponíveis** (sem rastro da ONG anterior) e retorna a `Situação: disponivel` em **Minhas doações**.

7. **Consultar o resultado do mês da Marta (H4 no celular):**
   - Role até **Resultado do mês (Painel da Marta)**, confirme o mês vigente no seletor **Mês de referência** (`#mes-resultado`, ex.: `2026-11`) e clique em **Consultar resultado**.
   - *Resultado esperado:* `GET /api/resultados?mes=2026-11` responde `HTTP 200` e `#painel-resultado` lista `Publicadas: 2`, `Aceitas: 1` (a devolvida não infla os aceites), `Coletadas: 1` e `Tempo médio até a coleta: 0 h` (ou o tempo decorrido em horas; ao consultar um mês sem coletas, como `2026-09`, exibe `Tempo médio até a coleta: sem coletas no mês`).

8. **Testar o caso de erro com feedback visual na tela (`#alerta-erro`):**
   - No formulário "Publicar doação", apague **Seu nome / estabelecimento**, preencha **Tipo de alimento** com `Bolo`, **Quantidade** com `2 unidades` e **Validade / retirar até** com `2026-12-31`, e clique em **Publicar**.
   - *Resultado esperado:* A API recusa com `HTTP 400` e o banner vermelho `#alerta-erro` aparece no topo da tela exibindo `"O nome do doador é obrigatório."` (o mesmo ocorre ao tentar confirmar coleta sem voluntário ou devolver sem motivo). Nenhum dado inválido é gravado no banco; na próxima ação válida, o alerta desaparece automaticamente.

**O que falta, dito na demo:**
Com a base em PostgreSQL 16 (Refatoração 1), as quatro histórias (**H1 a H4**) e a máquina de estados extraída pela Regra de Três (Refatoração 2) prontas e cobertas por 33 testes automatizados na `entrega-3`, ficam fora do escopo atual do piloto: autenticação com login/senha (mantida identificação leve via `localStorage`), expiração automática em background após 2 horas sem coleta (hoje atendida pela devolução explícita em H3) e paginação/filtro geográfico.

---

## Testado por

Outro integrante executou este roteiro sem ajuda: **Gustavo José Paulo**, em **25/11/2026**, a partir de um clone limpo em navegador em modo mobile.

Nota do teste: *Todos os comandos do README subiram o banco e os 33 testes de primeira; no roteiro, ajustamos a ordem para reutilizar o item "Pão Francês" na devolução de H3 (Passo 6) logo antes da consulta da Marta em H4 (Passo 7), comprovando na tela que a doação devolvida conta apenas em `Publicadas`.*
