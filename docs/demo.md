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
| 0:20–1:55 | **A vida da doação funcionando no celular (Passos 1 a 5):** "Padaria Pão Bom" publica duas doações; a ONG "Casa Esperança" aceita uma delas; o voluntário `"Rui"` confirma a coleta presencial em **Doações aceitas (aguardando coleta)**; e o doador acompanha ambas em **Minhas doações** (`disponivel` e `coletada (voluntário: Rui)`). | O produto executa o ciclo `disponivel -> aceita -> coletada` sobre PostgreSQL, registrando voluntário e horário de coleta (H2) e exibindo cada estado ao doador sem retrabalho (H1). |
| 1:55–2:30 | **Um caso de erro tratado com alerta visual (Passo 6):** Tentativa de publicar sem informar o doador (ou confirmar coleta sem informar o voluntário). O backend recusa com HTTP 400 e a tela mobile exibe imediatamente o banner vermelho `#alerta-erro` com mensagem clara sem alterar o banco. | Os limites do sistema estão protegidos na camada de domínio e comunicados visualmente no celular (Critério 1 da U1 + H1 CA3 + H2). |
| 2:30–3:00 | **O que falta e por quê:** A devolução de doação aceita pela ONG acompanhada da Refatoração 2 pela Regra de Três (H3) e o painel mensal da Marta (H4) entram nas próximas iterações do Trabalho 3 sobre a base PostgreSQL já validada. | A equipe evolui o produto em fatias verticais testadas, mantendo controle de escopo e de qualidade a cada iteração. |

---

## Passo a passo reproduzível

1. **Abrir a aplicação em modo mobile (`375px`):**
   - Acesse `http://localhost:3000` no navegador com a emulação mobile ativada (`375px` de largura).
   - *Resultado esperado:* A tela exibe o cabeçalho "Prato Cheio", o formulário "Publicar doação", o painel "Doações disponíveis" (com `Casa Esperança` preenchida), o painel "Doações aceitas (aguardando coleta)" e o painel "Minhas doações".

2. **Publicar duas doações como "Padaria Pão Bom":**
   - No campo **Seu nome / estabelecimento**, digite: `Padaria Pão Bom`.
   - Preencha **Tipo de alimento** com `Pão Francês`, **Quantidade** com `30 unidades`, **Validade / retirar até** com `2026-12-31` e clique em **Publicar**.
   - Em seguida, mantendo `Padaria Pão Bom` (já salvo automaticamente no `localStorage`), preencha **Tipo de alimento** com `Sopa de Legumes`, **Quantidade** com `15 porções`, **Validade / retirar até** com `2026-12-31` e clique em **Publicar**.
   - *Resultado esperado:* Ambas as doações aparecem em "Doações disponíveis" com o botão **Aceitar**, e o painel "Minhas doações" já sincroniza `Padaria Pão Bom` exibindo os dois itens com `Situação: disponivel`.

3. **Aceitar uma das doações pela ONG "Casa Esperança":**
   - No painel "Doações disponíveis", confirme que o campo **Identificação da ONG (para aceitar)** contém `Casa Esperança`.
   - Localize o item `Sopa de Legumes — 15 porções (até 2026-12-31) · Doador: Padaria Pão Bom` e clique em **Aceitar**.
   - *Resultado esperado:* `Sopa de Legumes` é marcada como `aceita` no PostgreSQL, sai imediatamente de "Doações disponíveis", entra em **Doações aceitas (aguardando coleta)** como `Sopa de Legumes — 15 porções · ONG: Casa Esperança` e aparece em "Minhas doações" com `Situação: aceita por Casa Esperança`.

4. **Confirmar a coleta presencial com o voluntário "Rui" (H2 no celular):**
   - No painel **Doações aceitas (aguardando coleta)** (`#lista-aceitas`), localize o item `Sopa de Legumes — 15 porções · ONG: Casa Esperança`.
   - No campo `Primeiro nome do voluntário (ex.: Rui)`, digite `Rui` e clique em **Confirmar coleta**.
   - *Resultado esperado:* A API `POST /api/doacoes/:id/coletar` responde `HTTP 200` gravando `status = 'coletada'`, `voluntario = 'Rui'` e o horário `coletada_em` no PostgreSQL; a doação sai da lista de aguardando coleta (`Nenhuma doação aguardando coleta.`).

5. **Acompanhar a situação atualizada em "Minhas doações" (H1 + H2 CA3 no celular):**
   - Role até o painel **Minhas doações**, confirme o texto `Padaria Pão Bom` no campo `#filtro-doador` e clique em **Consultar minhas doações** (a lista também atualiza automaticamente após a coleta).
   - *Resultado esperado:* A rota `GET /api/minhas-doacoes?doador=Padaria%20P%C3%A3o%20Bom` responde `HTTP 200` e a lista `#lista-minhas` exibe exatamente as duas doações da padaria (uma `disponivel` e a outra `coletada`):
     - `Pão Francês — 30 unidades (até 2026-12-31) · Situação: disponivel`
     - `Sopa de Legumes — 15 porções (até 2026-12-31) · Situação: coletada (voluntário: Rui)`

6. **Testar o caso de erro com feedback visual na tela (`#alerta-erro`):**
   - No formulário "Publicar doação", apague o campo **Seu nome / estabelecimento**, preencha **Tipo de alimento** com `Bolo`, **Quantidade** com `2 unidades` e **Validade / retirar até** com `2026-12-31`, e clique em **Publicar**.
   - *Resultado esperado:* A API recusa com `HTTP 400` e o banner vermelho `#alerta-erro` aparece no topo da tela do celular exibindo `"O nome do doador é obrigatório."` (da mesma forma, clicar em **Confirmar coleta** sem informar o voluntário exibe `"O nome do voluntário é obrigatório."`). Nenhum dado inválido é gravado no banco; ao realizar uma ação válida em seguida, o alerta vermelho desaparece automaticamente.

**O que falta, dito na demo:**
Na apresentação da demo ao fim da Iteração 2, o grupo destaca que a base em PostgreSQL (Iteração 0), o acompanhamento das doações pelo doador (H1), a confirmação de coleta pelo voluntário com registro de horário (H2) e o alerta visual de erro na interface mobile estão prontos e cobertos por testes automatizados. Entram nas próximas iterações do Trabalho 3: a devolução de doação aceita pela ONG acompanhada da Refatoração 2 (H3) e o resumo mensal de impacto para a Marta (H4).

---

## Testado por

Outro integrante executou este roteiro sem ajuda: **Maria Eduarda Huida**, em **19/11/2026**, a partir de um clone limpo em navegador em modo mobile.

Nota do teste: *Travou no Antes de começar pois o README precisava detalhar a DATABASE_URL do PostgreSQL. Correção aplicada no README; depois disso, todos os passos rodaram e nada mais precisou mudar.*
