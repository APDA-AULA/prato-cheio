Pergunta: Como os dados de doação são estruturados para garantir rastreabilidade, controle de ciclo de vida e atendimento às regras de negócio?
Decisão que sustenta: Persistência relacional em tabela única com campos obrigatórios de validade, quantidade e rastreamento de aceite por status (ADR 0001 e ADR 0002).
Situação: retrato da main no commit 99ef39d

```mermaid
erDiagram
    DOACAO {
        int id PK "Identificador único"
        string tipo "Descrição do alimento"
        string quantidade "Volume ou porções"
        date validade "Data limite de consumo"
        string status "disponivel | aceita"
        string ong "Identificação da ONG receptora"
        timestamp criada_em "Data e hora de registro"
    }

    DOADOR ||--o{ DOACAO : "disponibiliza"
    ONG ||--o{ DOACAO : "aceita"
```
