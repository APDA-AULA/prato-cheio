# Análise — Prato Cheio

## Problema central e incertezas
O problema central não é a falta de um app, mas sim o **descarte de comida de boa qualidade por estabelecimentos enquanto ONGs enfrentam escassez de alimentos**.
* **Incertezas:** 
  1. Não sabemos o volume real e a frequência das doações.
  2. Não sabemos se o verdadeiro gargalo é a coleta (logística) ou a comunicação.
  3. Não sabemos o nível de adesão e confiabilidade dos voluntários entregadores.

## Stakeholders
| Nome | Tipo | Interesse | Influência | Consequência para a Iteração 1 |
|---|---|---|---|---|
| Doadores (Restaurantes) | Fonte | Alto | Média | Envolver: fluxo de cadastro deve ser rápido. |
| ONGs / Cozinhas | Recebedor | Alto | Média | Envolver: precisam ver o que está disponível. |
| Vigilância Sanitária | Regulador | Baixo | Alta | Manter satisfeito: garantir rastreabilidade básica (validade/tipo). |
| Marta (Coordenadora) | Patrocinadora | Alto | Alta | Envolver e negociar: aprovação do fluxo de aceite. |
| Voluntários | Operacional | Médio | Baixa | Informar: (Fora do escopo do skeleton inicial). |
| Beneficiário Final | Usuário final | Alto | Baixa | Informar: (Stakeholder esquecido, não interage com o sistema). |

## Objetivos de impacto
1. **Reduzir o descarte de alimentos:** (Métrica: kg de comida descartada pelos doadores parceiros | Linha de base: a definir | Direção: Reduzir).
2. **Aumentar refeições resgatadas:** (Métrica: quantidade de doações aceitas e coletadas | Linha de base: 0 no sistema | Direção: Aumentar).
3. **Reduzir tempo até a coleta:** (Métrica: tempo médio entre publicação e aceite | Linha de base: a definir | Direção: Reduzir).

## Regras de negócio
* Doação aceita não fica disponível para outra ONG. (Dita)
* Quem responde primeiro leva. (Praticada)
* Toda doação registra tipo, quantidade e validade. (Imposta)
* Doação com janela expirada não pode ser aceita. (Derivada)
* **Ausente/Decidida:** O que acontece se a ONG aceita e não busca? *Decisão: A doação volta para a lista de disponíveis após 2 horas sem confirmação de coleta.*

## Conflitos de prioridade
* **Lados:** Doador (quer rapidez/poucos campos) × Marta/Vigilância (querem rastreabilidade/rigor).
* **Eixo:** Fricção de cadastro × Qualidade da informação.
* **O que perdem:** Doador perde tempo; Marta perde controle sanitário.
* **Saída adotada:** Reduzir a poucos campos obrigatórios no momento do cadastro (mitigando a preguiça do doador), mas travando a doação se a validade não for informada.

## Histórias de usuário e INVEST
| # | História | Falha INVEST | Ação Corretiva |
|---|---|---|---|
| 1 ★ | Como doador, quero publicar uma doação para evitar o descarte. | Estimable (muito ampla) | Limitar a campos básicos de texto, sem upload de foto na V1. |
| 2 | Como ONG, quero listar as doações disponíveis para escolher o que preciso. | Small (pode ter paginação/filtros) | Remover filtros e paginação; trazer tudo em uma lista simples. |
| 3 | Como ONG, quero aceitar uma doação para garantir a comida da minha cozinha. | Independent (depende da 1 e 2) | Nenhuma. É uma dependência natural do fluxo de negócio. |
| 4 | Como ONG, não quero ver doações já aceitas para não perder tempo. | Valuable (é um critério disfarçado) | Transformar em critério de aceite da História 3. |
| 5 | Como Marta, quero ver relatórios de impacto para prestar contas. | Small (relatório é complexo) | Fatiar: V1 apenas mostra um contador total na tela inicial (adiado). |

*(★) A história zero escolhida foi o ciclo essencial: Publicar → Listar → Aceitar → Sai da lista. Ficaram de fora: login/autenticação, filtros de proximidade e notificações push para simplificar a validação da hipótese.*

## Critérios de aceite (BDD)
**História 1 (Publicar)**
1. **Dado** que sou um doador preenchendo o formulário, **Quando** envio sem os campos obrigatórios, **Então** o sistema recusa e exibe um erro.
2. **Dado** que preenchi corretamente, **Quando** publico a doação, **Então** ela aparece na lista de doações disponíveis.

**História 3 (Aceitar/Sai da lista)**
3. **Dado** que uma doação está disponível, **Quando** uma ONG clica em aceitar, **Então** a doação é marcada como aceita.
4. **Dado** que uma doação foi aceita, **Quando** a lista é atualizada, **Então** essa doação sai da lista de disponíveis.
5. **Dado** que a doação "Bolo" já foi aceita pela ONG A, **Quando** a ONG B tenta aceitar "Bolo" diretamente, **Então** o sistema recusa a ação.

## Riscos e Hipótese
* **Risco 1:** Doador não cadastra por preguiça (Probabilidade: Alta). Mitigação: Reduzir o formulário a 3 campos.
* **Risco 2:** Perecível vence antes da coleta (Probabilidade: Alta). Mitigação: Janela de retirada visível e bem curta.
* **Suposição:** O gargalo é o tempo de comunicação. 
* **Hipótese testável:** Se as ONGs forem avisadas rapidamente, mais de 50% das doações serão aceitas no mesmo dia.
* **Experimento:** Rodar o sistema em 1 bairro por 2 semanas e medir a taxa de aceite/dia.

## Decisão de análise
**Fronteira da História Zero.**
* **Alternativas consideradas:** Incluir sistema de login para identificar qual ONG aceitou; incluir integração com Google Maps para calcular distância.
* **Decisão e Justificativa:** Cortamos Autenticação, Mapas e Notificações Push do escopo inicial. A justificativa é focar na validação da hipótese primária (se as ONGs aceitam rápido quando veem a lista). Desenvolver esses módulos extras agora adicionaria risco técnico e atrasaria o experimento (redução de escopo baseada em risco).

## Uso de IA
* **Geração das histórias 1, 2 e 3:** A IA sugeriu histórias focadas em motoristas voluntários. Mudamos para focar no Doador e ONG, pois o voluntário não faz parte do fluxo vital da História Zero.
* **Geração de Critérios de Aceite:** A IA gerou validações complexas de data. Simplificamos para regras básicas de "marcar como aceito e sumir da lista" para alinhar com os testes do Walking Skeleton.
* **Regras de Negócio:** A IA sugeriu "sistema de punição para quem não busca". Removemos e adotamos a regra de devolver para a lista após 2 horas.
