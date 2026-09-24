# SP-01 técnico — Shieldhorn — baseline pós-PR #288

**Status:** ACTIVE  
**Domain:** técnica / playtest / análise quantitativa  
**Authority:** GitHub  
**VerifiedAgainst:** runtime `ab76fcb4e2dc91e5bcf3da812130ccbe983219b4`; análise executada no PR #290  
**Supersedes:** nenhum

## Objetivo

Executar o equivalente técnico/controlado do cenário SP-01 enquanto o jogo ainda não está em condição de apresentação às crianças.

Este relatório **não substitui playtest humano** e não contém evidência de percepção, compreensão, frustração, diversão ou justiça percebida.

## Configuração

- jogador: Ferrozimon `MON_001`;
- adversário: Vitalex `MON_031`;
- nível: 10 × 10;
- matchup de classe: sem vantagem direta;
- posição: `frontline = true`;
- passiva: `shieldhorn`;
- comparação: mesma seed `sem passiva × com passiva`;
- 20.000 pares no perfil `basic`;
- 20.000 pares no perfil `mixed`;
- máximo: 30 turnos;
- harness: `js/combat/speciesPassiveQuantitativeHarness.js`.

O teste foi executado diretamente pela suíte Vitest do repositório no PR #290. O job de unit tests concluiu com sucesso.

## Limite metodológico

O harness quantitativo é **passiva-isolada**:

- não aplica o pacote completo de offsets de espécie;
- não aplica toda a economia runtime de ENE;
- não representa integralmente o kit swap e decisões humanas;
- usa ações roteirizadas.

Portanto, este teste responde “o que a mitigação faz neste cenário controlado?”, não “qual é o desempenho completo do tank no jogo real?”.

## Resultado — perfil basic

| Métrica | Sem passiva | Com shieldhorn | Delta |
|---|---:|---:|---:|
| Vitória | 100,00% | 100,00% | 0,00 p.p. |
| Turnos médios | 7,03195 | 7,03195 | 0 |
| HP final médio | — | — | +3,40795 |

Efeito da passiva:

- ativação em `98,87%` dos combates;
- `68.159` aplicações de redução em 20.000 combates;
- `68.159` pontos de dano mitigados;
- dano evitado médio: `3,40795` por combate.

## Resultado — perfil mixed

| Métrica | Sem passiva | Com shieldhorn | Delta |
|---|---:|---:|---:|
| Vitória | 100,00% | 100,00% | 0,00 p.p. |
| Turnos médios | 4,8234 | 4,8234 | 0 |
| HP final médio | — | — | +2,15635 |

Efeito da passiva:

- ativação em `93,36%` dos combates;
- `43.127` aplicações de redução em 20.000 combates;
- `43.127` pontos de dano mitigados;
- dano evitado médio: `2,15635` por combate.

## FATOS VERIFICADOS

1. `shieldhorn` está mecanicamente ativo no SP-01 quando o tank está na linha de frente.
2. A mitigação preserva HP de forma mensurável nos dois perfis.
3. Neste matchup específico, a passiva não altera taxa de vitória.
4. Neste matchup específico, a passiva não altera duração média do combate.
5. O cenário está saturado em 100% de vitória e, portanto, não é adequado para estimar magnitude de balanceamento por win rate.

## INFERÊNCIAS

1. SP-01 é adequado para demonstrar/observar resistência, mas fraco como cenário de calibração automática.
2. Neste cenário, a passiva produz exatamente o tipo de efeito desejado para um tank em nível mecânico: sobreviver com mais HP sem acelerar o dano nem transformar o resultado.
3. Essa coerência é específica ao cenário e não invalida os sinais de breakpoints observados em confrontos mais difíceis ou de múltiplos hits pequenos.
4. Não há evidência neste SP-01 para nerf de `damageReduction: 1`.

## NÃO TESTADO

- se uma criança percebe a mitigação;
- se compreende causalmente “primeiro hit + linha de frente”;
- se muda escolhas;
- se considera justo;
- se o feedback visual é claro;
- frustração/diversão;
- ritmo percebido;
- estratégia espontânea.

Esses itens permanecem `EVIDENCE_GAP` até playtest humano.

## CLASSIFICAÇÃO

- `SP01-TECH-01` — **TECHNICAL_CONTROLLED**: passiva ativa e mensurável.
- `SP01-TECH-02` — **EVIDENCE_GAP**: cenário saturado para balanceamento por vitória.
- `SP01-TECH-03` — **EVIDENCE_GAP**: dimensões humanas não testadas.
- `SP01-TECH-04` — **BALANCE**: nenhuma alteração numérica justificada por este cenário.

## Decisão permitida

Manter `damageReduction: 1` congelado.

O playtest humano permanece necessário para UX/percepção, mas pode ser adiado até que a build esteja apresentável às crianças.

## Próximo passo técnico

Enquanto o playtest humano estiver adiado:

1. continuar a validação pré-playtest por simulação dirigida;
2. priorizar SP-02 `wildpace` começando com HP cheio e limiar natural;
3. manter setup passives em cenários que tenham oportunidade real de trigger/consumo;
4. separar sempre evidência técnica de evidência humana;
5. não recalibrar PWR, ENE ou passivas no mesmo passo.
