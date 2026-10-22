Pergunta: Quem interage com o sistema Prato Cheio e quais fluxos de dados conectam os doadores, beneficiários e órgãos reguladores?
Decisão que sustenta: Aplicação web centralizada para intermediação de alimentos excedentes com registro auditável para fiscalização (ADR 0001).
Situação: retrato da main no commit 99ef39d

```mermaid
flowchart TD
    Doador["🍽️ Doador (Restaurantes e Mercados)"]
    ONG["🏢 ONG (Cozinhas Comunitárias)"]
    Sistema["🍲 Sistema Prato Cheio"]
    Marta["👩‍💼 Marta (Coordenação do Projeto)"]
    Vigilancia["📋 Vigilância Sanitária"]

    Doador -->|"1. Cadastra alimento excedente"| Sistema
    Sistema -->|"2. Notifica doação disponível"| ONG
    ONG -->|"3. Aceita doação para retirada"| Sistema
    Sistema -->|"4. Emite comprovante de aceite"| ONG
    Sistema -->|"5. Fornece relatórios de impacto"| Marta
    Sistema -->|"6. Envia cópia mensal dos dados"| Vigilancia
```
