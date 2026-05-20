# Diagnóstico Arquitetural — Evolution System 2026-05

**Data:** 2026-05-20  
**Escopo:** diagnóstico documental e de governança técnica.  
**Modo:** não altera runtime, catálogo, balanceamento, regras de evolução ou saves.

---

## 1. Objetivo

Registrar o diagnóstico real dos sistemas paralelos de evolução antes de qualquer consolidação ou remoção.

Este documento existe porque a auditoria técnica identificou risco alto de divergência entre:

- o módulo de evolução usado pelo runtime;
- o módulo legado/testado em `js/progression`;
- a camada canônica de dados em `design/canon`;
- possíveis fluxos inline dentro de `index.html`.

A meta desta etapa é **mapear e estabilizar a decisão arquitetural**, não mudar comportamento.

---

## 2. Sistemas encontrados

### 2.1 `js/data/evolutionSystem.js`

Estado atual: **módulo alinhado ao runtime**.

Funções relevantes:

- `getEvolutionData(template)`
- `checkEvolution(monster, template)`
- `executeEvolution(monster, newTemplate, opts)`

Características observadas:

- trabalha com template atual + novo template;
- preserva percentual de HP ao evoluir;
- atualiza identidade visual e de gameplay básica;
- atualiza `monsterId` ou `templateId`, conforme o formato da instância;
- atualiza `evolvesTo` e `evolvesAt` para a próxima etapa;
- não aplica boost fixo de stats;
- depende de recalculações externas do fluxo de runtime quando necessário.

Conclusão provisória: **deve ser tratado como fonte de comportamento do runtime atual**, até prova contrária.

### 2.2 `js/progression/evolutionSystem.js`

Estado atual: **módulo legado/testável, mas não deve ser assumido como runtime canônico**.

Funções relevantes:

- `checkEvolution(monster)`
- `getEvolutionTarget(targetId, catalog)`
- `applyEvolution(monster, newTemplate, log)`

Características observadas:

- trabalha diretamente com `monster.evolvesTo` e `monster.evolvesAt`;
- aplica boost fixo de 10% nos stats;
- cura totalmente o monstro ao evoluir;
- limpa buffs;
- atualiza `canonSpeciesId`;
- possui contrato diferente do módulo em `js/data`.

Conclusão provisória: **não remover agora**, mas também **não usar como fonte de verdade do runtime** sem decisão explícita.

### 2.3 `design/canon/evolution_lines.json`

Estado atual: **fonte canônica de dados/linha evolutiva**, carregada pela camada de cânone.

Papel recomendado:

- manter como referência de dados canônicos;
- não misturar com motor de regra sem adaptador claro;
- usar em futura consolidação para alinhar catálogo, linha evolutiva e runtime.

### 2.4 `index.html` e fluxo de level up

Estado atual: **orquestrador do fluxo real de jogo**.

Pontos já protegidos por teste:

- runtime importa `./js/data/evolutionSystem.js` como `EvolutionSystem`;
- `index.html` não deve importar `./js/progression/evolutionSystem.js`;
- fluxo de XP injeta `maybeEvolveAfterLevelUp` nas ações de progressão;
- após `executeEvolution`, o runtime recalcula stats a partir do template.

---

## 3. Diferenças de regra relevantes

| Aspecto | `js/data/evolutionSystem.js` | `js/progression/evolutionSystem.js` | Risco |
|---|---|---|---|
| Contrato de checagem | `checkEvolution(monster, template)` | `checkEvolution(monster)` | Alto |
| Aplicação da evolução | `executeEvolution(monster, newTemplate, opts)` | `applyEvolution(monster, newTemplate, log)` | Alto |
| HP após evolução | preserva HP% | cura totalmente | Alto |
| Stats | não aplica boost fixo diretamente | aplica +10% | Alto |
| Buffs | preserva | limpa | Médio/alto |
| Identidade da espécie | `monsterId`/`templateId` | `canonSpeciesId` | Médio |
| Fonte canônica de linha | template/catálogo recebido | campos do monstro/template | Médio |

Conclusão: estes módulos **não são intercambiáveis**. Um teste passando em um deles não garante que o runtime real esteja correto no outro.

---

## 4. Decisão arquitetural provisória

Até uma consolidação futura, a decisão segura é:

1. **Runtime atual:** `js/data/evolutionSystem.js` + orquestração em `index.html`.
2. **Dados canônicos:** `design/canon/evolution_lines.json` e catálogo de monstros.
3. **Módulo legado/testável:** `js/progression/evolutionSystem.js`, mantido temporariamente para rastreabilidade e comparação.
4. **Proibido remover:** qualquer módulo de evolução antes de haver testes suficientes cobrindo o fluxo real.

---

## 5. Teste de proteção existente

O repositório já contém:

```text
 tests/evolutionRuntimeAlignment.test.js
```

Esse teste protege cinco pontos importantes:

1. `index.html` importa `js/data/evolutionSystem.js`.
2. `index.html` não importa `js/progression/evolutionSystem.js`.
3. o fluxo de level up injeta `maybeEvolveAfterLevelUp` em `xpActions`.
4. a suíte cobre tanto o módulo runtime quanto o módulo legado.
5. as diferenças entre `executeEvolution` e `applyEvolution` são explícitas e testadas.

Esse teste deve ser mantido como guardrail até a consolidação final.

---

## 6. Critérios antes de qualquer consolidação

Antes de remover, renomear ou fundir qualquer sistema de evolução, o projeto deve ter:

- teste cobrindo evolução acionada por ganho de XP real;
- teste cobrindo preservação/alteração de HP após evolução;
- teste cobrindo atualização de identidade (`monsterId`, `templateId`, `canonSpeciesId`, se aplicável);
- teste cobrindo transição de cadeia evolutiva (`evolvesTo`, `evolvesAt`);
- teste cobrindo compatibilidade com saves existentes;
- decisão explícita sobre boost de stats: template recalculado vs +10% fixo;
- decisão explícita sobre cura total vs preservação de HP%.

---

## 7. Próximo PR recomendado

Não consolidar ainda. O próximo PR deve ser pequeno e focado em CI:

1. garantir que dependências sejam instaladas no GitHub Actions;
2. rodar `npm test`;
3. rodar `npm run test:wild-loop:vitest`;
4. rodar `npm run validate-data`;
5. rodar `npm run validate:monster-assets`;
6. rodar `npm run test:wild-loop` em job E2E separado com Playwright/Chromium.

---

## 8. Fora de escopo

Este diagnóstico não autoriza:

- remoção de `js/data/evolutionSystem.js`;
- remoção de `js/progression/evolutionSystem.js`;
- alteração em `index.html`;
- alteração em catálogo de monstros;
- mudança de regra de HP, stats ou buffs;
- migração de saves;
- mudança de balanceamento.

---

## 9. Conclusão

A implementação atual deve considerar `js/data/evolutionSystem.js` como módulo de runtime e `js/progression/evolutionSystem.js` como legado/diagnóstico até consolidação posterior.

O risco original foi reduzido porque agora há um teste explícito de alinhamento (`tests/evolutionRuntimeAlignment.test.js`) e este documento registra a decisão provisória. O risco não está encerrado: ainda será necessário consolidar as fontes de verdade em uma fase futura.