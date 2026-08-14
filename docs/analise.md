# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Problema central

## Incertezas

## Stakeholders

| Stakeholder | Papel | Interesse | Poder e Influência | Consequência na Iteração 1 |
| :--- | :--- | :--- | :--- | :--- |
| Marta | Coordenadora de Operações da ONG | Reduzir gargalos de tempo no processo de coleta | Alto | Entrevistar primeiro e aceitar requisitos prioritários de fluxo operacional |
| Doadores | Restaurantes e supermercados parceiros | Entregar excedentes de alimentos de forma rápida e segura | Médio | Aceitar requisitos de cadastro de itens e deixar para depois integrações complexas |
| Motoristas | Voluntários responsáveis pelo transporte | Rotas otimizadas e facilidade de uso do aplicativo | Médio | Entrevistar na segunda semana e deixar regras avançadas de roteirização para depois |
| Instituições Receptoras | Entidades que recebem os alimentos | Receber mantimentos dentro dos padrões de qualidade | Médio | Consultar requisitos básicos de entrega e deixar relatórios gerenciais para depois |
| Vigilância Sanitária | Órgão regulador externo | Garantir segurança alimentar e conformidade legal | Alto | Aceitar obrigatoriamente exigências legais e descartar flexibilizações |
| Coordenador de Voluntários | Gestor da equipe de apoio operacional | Manter o engajamento e a escala de voluntários | Baixo | Deixar para depois e focar nas entrevistas com a coordenação principal |

## Objetivos de impacto
 
Três objetivos de impacto, cada um com métrica, linha de base e direção.
 
1. Tempo médio de coleta de alimentos
Métrica: Tempo médio em minutos por rota de resgate.
Linha de base: Hoje desconhecida, medir desde o primeiro dia do piloto.
Direção: Redução.
Teste de dezembro: Existe um número que mostra que isso não aconteceu? Sim, se em dezembro a média de tempo por rota não for inferior a 40 minutos, o objetivo falhou.
 
2. Volume de alimentos resgatados
Métrica: Quantidade total (em quilogramas) de alimentos salvos por semana.
Linha de base: Hoje desconhecida, medir desde o primeiro dia do piloto.
Direção: Aumento.
Teste de dezembro: Existe um número que mostra que isso não aconteceu? Sim, se em dezembro o volume semanal acumulado for menor que 500 quilos.
 
3. Taxa de conclusão de coletas agendadas
Métrica: Porcentagem de rotas concluídas sem cancelamento por falhas operacionais.
Linha de base: Hoje desconhecida, medir desde o primeiro dia do piloto.
Direção: Aumento.
Teste de dezembro: Existe um número que mostra que isso não aconteceu? Sim, se em dezembro a taxa de conclusão for inferior a 90 por cento.

## Regras de negócio
 
1. Validade mínima para doação
Origem: Inventada (criada pelo grupo para preencher lacuna do caso).
Enunciado explícito e verificável: O sistema bloqueia o cadastro de itens cuja data de validade seja inferior a 24 horas a partir do horário atual.
Como se verifica: Dois desenvolvedores diferentes tentam cadastrar um item com vencimento em 12 horas. Ambos devem constatar que o sistema exibe mensagem de erro e impede o registro.
 
2. Atribuição automática de rotas
Origem: Praticada na rotina atual da equipe.
Enunciado explícito e verificável: O sistema vincula a rota de coleta ao motorista ativo que estiver geograficamente mais próximo do endereço do doador no momento da solicitação.
Como se verifica: Dois desenvolvedores diferentes simulam solicitações com motoristas a distâncias distintas. Ambos devem observar que o sistema direciona o chamado para o motorista mais próximo.
 
3. Validação de conformidade térmica
Origem: Imposta (pelas normas da Vigilância Sanitária).
Enunciado explícito e verificável: O sistema exige o preenchimento obrigatório do campo de temperatura do alimento antes de habilitar a finalização da coleta.
Como se verifica: Dois desenvolvedores diferentes tentam concluir o registro de coleta deixando o campo de temperatura vazio. Ambos constatam que a operação não é finalizada.

## Conflitos de prioridade
 
As duas falas em conflito:
Marta: Eu preciso de agilidade máxima no cadastro para despachar os motoristas depressa.
Fiscal da Vigilância Sanitária: Eu preciso de rigor absoluto e registro detalhado (foto e temperatura) de cada lote antes de qualquer liberação.
 
O eixo do trade-off:
Velocidade de operação versus rigor de conformidade regulatória.
 
O que cada lado perde:
A coordenação de operações perde tempo e agilidade no fluxo de atendimento. A fiscalização perde a garantia de rastreabilidade e segurança sanitária se o rigor for relaxado.
 
O critério que decide:
Na iteração 1, campo obrigatório é apenas o que a vigilância exige legalmente; ferramentas visuais para agilizar o trabalho da coordenação ficam para depois.
 
Qual das três saídas foi usada:
Decidir.

## Histórias de usuário

| # | História (Como… quero… para…) | INVEST: o que falha |
|---|---|---|
| ★ 1 | Como Doador, quero cadastrar os alimentos excedentes informando a validade, para aumentar o volume de alimentos resgatados antes do descarte. | V |
| 2 | Como Marta (Coord. Operações), quero visualizar as doações pendentes no meu painel, para atribuí-las aos motoristas e reduzir o tempo médio de coleta. | Falha em Negociável → remover a obrigatoriedade de atualização "em tempo real" (WebSockets) e aceitar uma tabela estática atualizada por *refresh* da página. |
| 3 | Como Motorista, quero registrar a foto e a temperatura do alimento no app, para garantir a conformidade com a Vigilância Sanitária e evitar interdição. | Falha em Estimável → spike de 2 h para descobrir como fazer o cache local da foto no navegador do celular quando não houver conexão de internet. |
| 4 | Como Instituição Receptora, quero ser notificada do horário de chegada, para ter equipe pronta no descarregamento e aumentar a taxa de conclusão de coletas. | Falha em Pequena → remover disparo automático de SMS; a fatia entregará apenas um botão para a Coordenação abrir o WhatsApp com mensagem pré-preenchida. |
| 5 | Como Vigilância Sanitária, quero exportar o registro semanal de temperaturas coletadas, para auditar a segurança alimentar e evitar o bloqueio da operação. | S |
| 6 | Como Motorista, quero ver a minha rota de hoje em formato de lista de texto simples (ordem alfabética), para não me perder e reduzir o tempo de coleta. | I |
| 7 | Como Motorista, quero um botão no endereço da coleta que abra as coordenadas no Google Maps, para não precisar digitar na rua e agilizar a viagem. | T |
| 8 | Como Motorista, quero poder marcar um endereço como "doação cancelada", para retirar o item da minha lista do dia sem precisar ligar para a coordenação. | Falha em Independente → depende da modelagem do banco de dados da história 2 (status da doação); fatiar para usar um *mock* de status apenas na interface do motorista nesta iteração. |

**História Zero (★ 1)**
* **Por que ela:** É o gatilho que inicia todo o fluxo do sistema e a única fatia que nos permite testar na prática a regra de negócio crítica de "Validade mínima para doação" (bloqueio de vencimentos menores que 24h).
* **O que ficou FORA da fatia:** Cadastro em massa de itens (via Excel ou lotes), edição da doação após o envio, e integração de catálogo com o estoque do supermercado.
* **Por quê:** O cadastro em massa e integrações escondem o risco de usabilidade; precisamos medir a linha de base primeiro para saber se o doador consegue e tem paciência de cadastrar um único item pelo seu celular de forma avulsa. A edição foi cortada pelo risco arquitetural de ter que tratar concorrência de dados (o motorista já ter aceitado uma viagem enquanto o doador edita o peso).

## Uso de IA
O que geramos com IA, o que verificamos e o que alteramos.

* **História #2:**
  * **O que ela gerou:** "Como Administrador, quero um sistema inteligente de roteamento com IA para distribuir doações aos motoristas."
  * **O que mudamos e por quê:** Trocamos "Administrador" (papel de tela) por "Marta" (stakeholder real). Removemos o roteamento inteligente porque precisamos focar em agilidade básica primeiro.
  * **Qual regra inventou:** A IA inventou que *o sistema faria o balanceamento automático da carga pelo peso do veículo*. Quem decide os critérios de balanceamento é a Marta (Coordenadora de Operações), e, no momento, ela fará a atribuição visualmente. Além disso, a IA ignorou totalmente a restrição de **orçamento próximo de zero**, sugerindo integrações caras de IA logo na iteração 1.
  * 
* **História #3:**
  * **O que ela gerou:** "Como Motorista, quero acessar um mapa 3D com GPS nativo no aplicativo para registrar a coleta."
  * **O que mudamos e por quê:** Removemos o mapa 3D e focamos no registro da foto e temperatura (que é a dor real de conformidade).
  * **Qual regra inventou:** A IA não inventou regra aqui, mas cometeu seu erro mais caro: **esqueceu a restrição do celular e conexão instável**. Um mapa 3D pesado destruiria o uso do app pelos motoristas voluntários na rua com dados móveis limitados.

* **História #4:**
  * **O que ela gerou:** "Como Instituição Receptora, quero receber um email com o relatório nutricional e laudo completo da doação para assinar digitalmente."
  * **O que mudamos e por quê:** Trocamos para uma notificação simples de horário de chegada (para ajudar no descarregamento). O relatório nutricional não tem impacto no nosso objetivo de resgatar o alimento a tempo.
  * **Qual regra inventou:** A IA inventou que *é obrigatório um laudo nutricional para aceitar a doação*. Quem dita os dados exigidos (como temperatura) é a Vigilância Sanitária, e ela não exige quebra nutricional de calorias no ato do transporte de urgência de excedentes.


## Riscos
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|

## Hipótese e experimento

## Decisão de análise
- **Problema:**
- **Alternativas:**
- **Decisão e justificativa:**
- **Riscos e limitações:**
