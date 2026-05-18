# Auditoria prática — Issue #201 (Wild Loop)

Data: 2026-05-18  
Ambiente: GitHub Codex/Copilot (headless + Playwright)  
Escopo: `novo jogo → starter → wild battle → ataque/captura → recompensa → save → continue`

## Preparação técnica

- `npm test`: ✅ passou (149 arquivos, 5453 testes)
- `npm run validate-data`: ✅ passou com 8 avisos de balanceamento de `baseHp`
- `npm run validate:monster-assets`: ✅ passou sem avisos

## O que funciona

- ✅ jogo abre sem tela branca
- ✅ novo jogo não trava
- ✅ criação de jogador funciona
- ✅ classe escolhida persistida
- ✅ starter corresponde à classe (Mago → `MON_013`)
- ✅ wild battle inicia com player e inimigo válidos
- ✅ ataque no modo automático atualiza HP (inimigo e contra-ataque)
- ✅ ataque no modo manual funciona e atualiza HP
- ✅ captura consome orb
- ✅ captura bem-sucedida adiciona no time/box (neste teste: time)
- ✅ vitória concede recompensa (XP observado)
- ✅ cenário de KO não travou UI (sem soft-lock observado)
- ✅ save + reload + continue preservam progresso
- ✅ sem erro crítico de runtime no console

## O que falha

Nenhuma falha funcional P0/P1/P2 foi reproduzida neste roteiro.

### Observações não bloqueantes

1. **Erro de rede não crítico no console** (`ERR_NAME_NOT_RESOLVED`) em recurso externo.  
   - Severidade: **P3**
2. **Warnings de fallback de skills** na inicialização (`SKILL_DEFS_FALLBACK`).  
   - Severidade: **P4** (telemetria/ruído de log no ambiente auditado)

## Passos de reprodução (observações)

### Obs 1 — erro de recurso externo
1. Abrir `index.html` no ambiente atual.
2. Ver console.
3. Mensagem observada: `Failed to load resource: net::ERR_NAME_NOT_RESOLVED`.

### Obs 2 — warning de fallback de skills
1. Abrir `index.html` e observar logs iniciais.
2. Mensagem observada: `[initSkillDefs] SKILL_DEFS_FALLBACK em uso — JSON de skills não disponível ainda.`

## Arquivos prováveis (para observações)

- `index.html` (bootstrap/recursos externos + init)
- `js/data/skillsLoader.js` (sequência de carregamento/fallback)

## Evidência

- Screenshot da execução: `/tmp/wild-loop-auditoria-ui.png`

## Próximas issues recomendadas

1. **P3** — reduzir ruído de console para recursos externos indisponíveis (com fallback explícito e log amigável).
2. **P4** — revisar timing de inicialização de skills para evitar warning de fallback quando o JSON já carrega em seguida.
3. **P3** — transformar roteiro de auditoria prática em job de smoke test (headless) para regressão contínua do Wild Loop.

## Conclusão

- Wild Loop está jogável: **sim**
- Save está confiável no roteiro auditado: **sim**
- Captura está confiável no roteiro auditado: **sim**
- Soft-lock reproduzido: **não**
- Recomendação para milestone MVP 0.3: **pode avançar**, mantendo monitoramento de logs não críticos.
