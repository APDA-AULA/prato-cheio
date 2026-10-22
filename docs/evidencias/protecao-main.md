# Evidência de Proteção da Branch Main

*Disciplina: Análise, Projeto e Desenvolvimento Ágil — Trabalho 2*  
*Repositório: https://github.com/APDA-AULA/prato-cheio*

---

## 1. Regra de Proteção Ativa no GitHub

Conforme estipulado nas regras gerais do Trabalho 2 (*"Toda mudança entra por PR revisado por outro integrante, com CI verde"*), a branch `main` está configurada com as seguintes regras de proteção no GitHub:

1. **Require a pull request before merging:**
   - Ativado.
   - Exigência mínima de **1 aprovação** de outro membro da equipe antes de habilitar o botão de merge.
   - Bloqueio de commits diretos na `main` (`git push origin main` rejeitado pelo servidor).

2. **Require status checks to pass before merging:**
   - Ativado.
   - Status check obrigatório: `ci / test` configurado em `.github/workflows/ci.yml`.
   - Se os testes automatizados ou o linter falharem, o merge é travado pelo GitHub Actions.

3. **Do not allow bypassing the above settings:**
   - Ativado para todos os colaboradores do repositório.

---

## 2. Evidência do Fluxo de Trabalho por Pull Request

Todo o desenvolvimento das histórias e documentações seguiu o fluxo obrigatório:

```bash
git checkout -b historia/<nome-da-historia>
# implementação + testes automatizados
git commit -m "feat/docs: descrição da contribuição"
git push -u origin historia/<nome-da-historia>
```

- Abertura de Pull Request utilizando o template oficial em `.github/pull_request_template.md`.
- Verificação de execução com sucesso da action de CI (`npm test`).
- Revisão por pares com apontamentos técnicos (registrados na seção de validação).
- Merge na branch de entrega somente após aprovação e CI verde.
