# Monstrinhomon — Notas de Integração de Boot Canônico

Este arquivo documenta como a camada canônica é inicializada durante o boot do jogo.

---

## Objetivo

Garantir que `GameState.config.classAdvantages` seja preenchido com dados canônicos **antes** de qualquer lógica de combate depender dele, sem tornar o boot frágil ou complexo.

---

## Fluxo de Boot (após Fase 1 — melhorado)

```
Módulo JS carregado pelo browser
  └─ import CanonLoader from './js/canon/canonLoader.js'
  └─ CanonLoader.startCanonBoot()       ← inicia fetch imediatamente
        │
        │  (fetch em andamento em paralelo com o resto da avaliação do módulo)
        │
        └─ bootApp() chamado (DOMContentLoaded)
              └─ await init()
                    ├─ loadFromLocalStorage()          ← carrega estado salvo
                    ├─ await applyCanonToConfig(GameState.config)
                    │       ├─ aguarda a promise já iniciada por startCanonBoot()
                    │       ├─ aplica classAdvantages canônico
                    │       └─ se falhar: config permanece com tabela hardcoded (fallback)
                    └─ updateAllViews()                ← UI renderiza com config correta
              └─ mmBoot()                              ← overlay de introdução
```

---

## Contratos

### `startCanonBoot()`
- **Quando:** chamado no bloco de imports do módulo (`index.html`), antes de `init()`
- **O que faz:** inicia `loadCanonData()` e armazena a promise em `_canonBootPromise`
- **Idempotente:** chamadas repetidas retornam a mesma promise
- **Nunca lança:** apenas resolve ou rejeita internamente

### `applyCanonToConfig(config)`
- **Quando:** chamado com `await` dentro de `init()`, após `loadFromLocalStorage()`
- **O que faz:** aguarda `_canonBootPromise` e sobrescreve `config.classAdvantages`
- **Fallback:** se o fetch falhar, emite `console.warn` e mantém `config` intacto
- **Seguro com null/undefined:** retorna imediatamente sem erro

### `loadCanonData()`
- Delega para `startCanonBoot()`
- Mantida para compatibilidade com chamadas externas e testes

---

## Por que esta abordagem é melhor que a anterior

| Aspecto | Antes (Fase 1 original) | Depois (melhoria de boot) |
|---------|------------------------|--------------------------|
| Quando o fetch começa | Dentro de `init()` | Ao parse do módulo (antes de `init()`) |
| Como é aplicado | `Promise.then()` solto, assíncrono | `await` dentro de `init()`, síncrono ao boot |
| Race condition | Sim (combat podia começar antes) | Não (config aplicada antes de `updateAllViews()`) |
| Fallback | Silencioso, sem log claro | `console.warn` com mensagem explícita |
| Testabilidade | Difícil (race condition nos testes) | Clara (startCanonBoot + _resetCanonCache nos testes) |

---

## Comportamento em caso de falha

Se os arquivos JSON canônicos não forem encontrados (404, rede offline, etc.):

1. `applyCanonToConfig()` captura o erro silenciosamente
2. `console.warn('[canonLoader] applyCanonToConfig falhou; mantendo config legada.')` é emitido
3. `GameState.config.classAdvantages` permanece com a tabela hardcoded definida em `DEFAULT_CONFIG`
4. O motor funciona normalmente com o fallback legado
5. Nenhum erro é propagado para o usuário

---

## O que ainda não foi feito (fases posteriores)

- [ ] Integrar `species.json` e `evolution_lines.json` ao runtime
- [ ] Aplicar offsets de espécie sobre o chassis de classe
- [ ] Expandir MVP para Bardo, Ladino, Caçador e Animalista
- [ ] Integrar `level_progression.json` aos marcos de desbloqueio de habilidades
- [ ] Migrar fórmula de combate para modelo canônico com faixas (Fase 4)

---

**Última atualização:** 2026-04-01  
**Responsável:** canonLoader.js + index.html (bootApp/init)
