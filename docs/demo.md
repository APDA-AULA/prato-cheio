# Roteiro da demo — Prato Cheio

*Trabalho 3 · 3 minutos · outra pessoa precisa conseguir reproduzir só lendo isto*

## Antes de começar

Para reproduzir este roteiro a partir de um clone novo, é necessário ter o Node.js (versão 22.13 ou superior) e uma instância do PostgreSQL 16 no ar, exatamente como descrito no [README.md](file:///c:/Users/maria.huida/Documents/prato-cheio/README.md).

### 1. Subir o PostgreSQL

Execute o contêiner Docker oficial do PostgreSQL (ou utilize um serviço equivalente):

```bash
docker run --name pratocheio-pg -e POSTGRES_USER=pratocheio -e POSTGRES_PASSWORD=pratocheio -e POSTGRES_DB=pratocheio -p 5432:5432 -d postgres:16
```

### 2. Configurar a variável de ambiente

Defina a variável `DATABASE_URL` no terminal ou configure no arquivo `.env` (baseado no [.env.example](file:///c:/Users/maria.huida/Documents/prato-cheio/.env.example)):

```bash
export DATABASE_URL=postgres://pratocheio:pratocheio@localhost:5432/pratocheio

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

Abra o navegador em **modo mobile** (no Chrome/Firefox/Edge: pressione `F12` ou `Ctrl+Shift+I`, clique no ícone de emulação de dispositivos / *Toggle device toolbar* e selecione uma resolução móvel padrão, ex.: iPhone SE ou largura de 375px). O produto foi projetado prioritariamente para uso em celular por doadores na cozinha e voluntários em trânsito.

---

## Roteiro (3 minutos)

| Tempo | O que mostrar | O que se prova |
|---|---|---|
| 0:00–0:20 | **O problema em uma frase:** O Prato Cheio conecta doadores de alimentos excedentes a ONGs antes que a comida se perca e seja descartada. | Por que o produto existe: atende à dor central do descarte de alimentos de boa qualidade enquanto cozinhas comunitárias enfrentam escassez. |
| 0:20–1:50 | **A história funcionando de verdade (Passos 1 a 3):** Doador cadastra uma doação com alimento perecível; a doação aparece em tempo real na lista de disponíveis; uma ONG visualiza a oferta e clica em aceitar; a doação é marcada como aceita no banco PostgreSQL e sai da listagem pública. | O produto executa ponta a ponta sobre o banco relacional PostgreSQL, mantendo consistência e impedindo duplicidade de retirada. |
| 1:50–2:30 | **Um caso de erro tratado (Passo 4):** Tentativa de submeter o formulário sem preencher os campos obrigatórios (ou tentativa de aceitar doação já aceita por outra instituição). O backend recusa a operação com HTTP 400 e erro descritivo. | O limite do sistema foi pensado e protegido: regras de negócio e integridade impedem dados corrompidos ou aceite concorrente inválido. |
| 2:30–3:00 | **O que falta e por quê:** Acompanhamento do ciclo de vida pelo doador (H1) e confirmação de coleta presencial pelo voluntário (H2) estão planejados para as próximas iterações do Trabalho 3, pois a iteração atual priorizou a estabilização da fundação do banco sobre PostgreSQL e testes automatizados no CI. | A equipe tem clareza de escopo, controle do débito técnico e roadmap incremental bem definido. |

---

## Passo a passo reproduzível

1. **Abrir a aplicação em modo mobile:**
   - Acesse `http://localhost:3000` no navegador com a emulação mobile ativada (375px de largura).
   - *Resultado esperado:* A tela exibe o cabeçalho "Prato Cheio", o formulário "Publicar doação" com os campos "Tipo de alimento", "Quantidade" e "Validade / retirar até", o botão "Publicar" e a seção "Doações disponíveis" exibindo "Nenhuma doação disponível." (caso o banco não possua doações pendentes).

2. **Publicar uma nova doação:**
   - No campo **Tipo de alimento**, digite exatamente: `Sopa de Legumes`.
   - No campo **Quantidade**, digite: `15 porções`.
   - No campo **Validade / retirar até**, selecione ou digite a data: `2026-12-31`.
   - Clique no botão **Publicar**.
   - *Resultado esperado:* O formulário dispara um `POST /api/doacoes`, o item é persistido no banco PostgreSQL e a lista "Doações disponíveis" recarrega imediatamente mostrando o item `Sopa de Legumes — 15 porções (até 2026-12-31)` junto a um botão **Aceitar**.

3. **Aceitar a doação:**
   - Na listagem de "Doações disponíveis", localize a doação `Sopa de Legumes`.
   - Clique no botão **Aceitar**.
   - *Resultado esperado:* Uma requisição `POST /api/doacoes/:id/aceitar` é enviada com `{ "ong": "Minha ONG" }`. O status da doação é atualizado para `aceita` no PostgreSQL e a listagem é atualizada, removendo a doação da tela e voltando a exibir `Nenhuma doação disponível.`, garantindo que nenhuma outra ONG a retire em duplicidade.

4. **Testar o caso de erro e validação de limites:**
   - Sem preencher os campos obrigatórios (deixando Tipo, Quantidade ou Validade em branco), clique no botão **Publicar** (ou execute no terminal/console do navegador uma chamada `POST /api/doacoes` com payload incompleto: `fetch('/api/doacoes', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ tipo: 'Sopa de Legumes' }) })`).
   - *Resultado esperado:* A API recusa a gravação e responde com status `HTTP 400 Bad Request` e payload JSON contendo `{"erro": "Tipo, quantidade e validade são obrigatórios."}`. Nenhuma doação inválida é criada no banco nem exibida na lista de disponíveis. (De forma complementar, caso seja feita uma requisição direta para aceitar uma doação que já foi aceita anteriormente, a API recusa com `HTTP 400` e mensagem `"Doação já foi aceita por outra ONG."`).

**O que falta, dito na demo:**
Na apresentação da demo, o grupo esclarece que o fluxo essencial de publicação, visualização e aceite concorrente seguro está 100% estabilizado no PostgreSQL. Ficam pendentes para as iterações H1 e H2 do Trabalho 3: a tela dedicada "Minhas doações" para o doador rastrear o ciclo de vida, feedback visual nativo de mensagens de erro na interface HTML e a confirmação de coleta física realizada pelo voluntário com registro de data/hora (fechando a métrica de tempo até a coleta).

---

## Testado por

Outro integrante executou este roteiro sem ajuda: **Maria Eduarda Huida**, em **19/11/2026**, a partir de um clone limpo em navegador em modo mobile.

Nota do teste: *Travou no Antes de começar pois o README precisava detalhar a DATABASE_URL do PostgreSQL. Correção aplicada no README; depois disso, todos os passos rodaram e nada mais precisou mudar.*
