# Plano de Migração Incremental — Trade 2026-05

**Data:** 2026-05-20  
**Escopo:** governança e migração segura dos sistemas paralelos de Trade.  
**Modo:** não altera comportamento de runtime nesta etapa.

---

## 1. Situação atual

A auditoria `docs/trade_source_of_truth_audit.md` e o teste `tests/tradeArchitecture.test.js` já estabeleceram que existem dois sistemas de Trade:

- `js/combat/tradeSystem.js` — sistema canônico, usado pelo painel principal de trocas via `js/ui/tradeUI.js`.
- `js/trade/tradeSystem.js` — sistema legado, usado para compatibilidade com fluxo/modal antigo de transferência unilateral.

A decisão arquitetural vigente é:

> `js/combat/tradeSystem.js` é a fonte canônica de verdade para Trade.  
> `js/trade/tradeSystem.js` permanece temporariamente como legado/compatibilidade até migração completa.

---

## 2. Objetivo da migração

Eliminar a duplicidade funcional sem quebrar fluxos existentes.

A migração deve fazer com que qualquer interface de troca use uma única regra canônica, preservando comportamento esperado de UI, mensagens, persistência e compatibilidade com saves.

---

## 3. Risco principal

Os dois módulos não são equivalentes:

| Aspecto | `js/combat/tradeSystem.js` | `js/trade/tradeSystem.js` |
|---|---|---|
| Modelo | troca bilateral A ↔ B | transferência unilateral A → B |
| Box | suporta Box compartilhada | não suporta Box |
| Sugestões | possui `getTradeSuggestions` | não possui |
| Terapia/log | suporta `therapyLog` | não suporta no mesmo contrato |
| Erros | mensagens amigáveis | códigos de erro |
| Uso atual | painel principal de troca | fluxo legado/modal |

Por isso, a remoção direta do módulo legado seria insegura.

---

## 4. Estratégia segura

### Fase 1 — Marcar legado

Status: iniciado.

- Atualizar comentário de topo em `js/trade/tradeSystem.js`.
- Deixar explícito que o módulo é legado/compatibilidade.
- Proibir expansão de novas regras nesse módulo.
- Manter todos os exports atuais.
- Não alterar comportamento.

### Fase 2 — Adaptador de compatibilidade

Criar um adaptador pequeno que traduza o fluxo legado para a regra canônica quando possível.

Possível arquivo:

```text
js/trade/tradeLegacyAdapter.js
```

Responsabilidade:

- aceitar chamadas no formato legado;
- localizar jogador cedente, receptor e monstro;
- decidir se o caso pode ser expresso como troca bilateral canônica;
- quando não puder, preservar comportamento legado sem quebrar;
- registrar claramente casos ainda não migrados.

Essa fase deve ser feita com testes antes de qualquer uso em runtime.

### Fase 3 — Migrar fluxo legado/modal

Após o adaptador estar testado:

- alterar o fluxo legado em `index.html` para usar o adaptador ou o painel canônico;
- manter UI e mensagens equivalentes;
- garantir `saveGame` e refresh de listas;
- cobrir com teste de integração.

### Fase 4 — Deprecar oficialmente o módulo legado

Quando nenhum fluxo real chamar diretamente `js/trade/tradeSystem.js`:

- atualizar auditoria;
- manter o arquivo por mais um ciclo como deprecated;
- manter testes regressivos do comportamento final.

### Fase 5 — Remoção controlada

Somente após pelo menos um ciclo estável:

- remover `js/trade/tradeSystem.js`;
- remover testes antigos que testem apenas o contrato legado isolado;
- manter testes do fluxo real canônico.

---

## 5. Critérios antes de mexer em runtime

Antes de alterar `index.html` ou qualquer UI:

- CI verde em `main`;
- teste arquitetural de Trade preservado;
- testes do módulo canônico preservados;
- teste de adaptador cobrindo sucesso e falhas;
- decisão sobre como representar transferência unilateral no modelo bilateral;
- decisão sobre mensagens de erro para o usuário;
- decisão sobre interação com Box.

---

## 6. Testes mínimos do adaptador

O próximo PR de código deve adicionar testes para:

1. jogador inválido;
2. tentativa de troca consigo mesmo;
3. instância inexistente;
4. monstro KO;
5. monstro ativo durante batalha;
6. transferência bem-sucedida em formato legado;
7. paridade de erro entre legado e adaptador;
8. não mutar estado quando a validação falha.

---

## 7. Fora de escopo deste ciclo

Este plano não autoriza:

- remover `js/trade/tradeSystem.js`;
- alterar regra de troca;
- alterar Box;
- alterar `index.html`;
- alterar save/localStorage;
- mudar UX da aba Trocas;
- alterar balanceamento ou regras de classe.

---

## 8. Próximo passo recomendado

Abrir PR pequeno para criar `js/trade/tradeLegacyAdapter.js` e seus testes, sem ainda conectar ao runtime.

Esse PR deve provar que conseguimos expressar o fluxo legado com segurança antes de mexer na interface real.
