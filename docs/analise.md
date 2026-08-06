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

## Histórias de usuário
| # | História (Como… quero… para…) | INVEST: o que falha |
|---|---|---|

## Critérios de aceite
**História X** — Dado … Quando … Então …

## Riscos
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|

## Hipótese e experimento

## Decisão de análise
- **Problema:**
- **Alternativas:**
- **Decisão e justificativa:**
- **Riscos e limitações:**

## Uso de IA
O que geramos com IA, o que verificamos e o que alteramos.
