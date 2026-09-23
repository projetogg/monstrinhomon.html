# Shieldhorn — correção do gate de linha de frente

**Status:** ACTIVE  
**Domain:** técnica / combate / passivas de espécie  
**Authority:** GitHub  
**VerifiedAgainst:** `9594c80895669f7764a34044fdcec73e392d8c6f`  
**Supersedes:** nenhum

## Contexto

Durante a validação pré-playtest, foi identificado um drift entre a regra canônica de `shieldhorn` e o runtime posicional do combate Group.

A fonte canônica em `design/canon/species.json` define:

> "Quando está na frente, recebe +1 de mitigação no primeiro ataque sofrido por turno."

O runtime aplicava o primeiro-hit gate, mas não verificava a posição do defensor no Group.

## Intenção de produto reafirmada

O autor reafirmou em 2026-09-23 que o arquétipo `tank_puro` deve:

- representar resistência defensiva clara;
- manter pressão ofensiva inferior a perfis de burst;
- não transformar defesa, por si só, em condição dominante de vitória;
- não criar combates estagnados do tipo "não morre, mas não mata";
- preservar a função de linha de frente como parte da identidade do tank.

Essa reafirmação é coerente com `docs/MATRIZ_MESTRA_BALANCEAMENTO.md`, `docs/ATRIBUTOS_BASE_POR_CLASSE_V2.md` e a definição canônica de `shieldhorn`.

## Correção

### Group

O evento `on_hit_received` de `shieldhorn` agora recebe `isFrontline` derivado de `enc.positions`.

- defensor inimigo: `enemy_<index>`;
- defensor jogador: `playerId`;
- somente `POSITION.FRONT` autoriza a mitigação.

### Wild

Wild não possui linha posicional equivalente. O combatente ativo é tratado explicitamente como linha de frente com `isFrontline: true`.

### Resolver

`resolvePassiveModifier()` bloqueia `shieldhorn` quando `context.isFrontline === false`.

Contextos não posicionais que omitem o campo permanecem compatíveis e são tratados como linha de frente.

### Harness

O harness quantitativo explicita `isFrontline: true`, preservando o significado dos cenários 1v1 existentes. A correção de posição, portanto, não altera retroativamente a matriz quantitativa 1v1; ela corrige especificamente o comportamento posicional do Group.

## Escopo

Esta correção **não altera**:

- `damageReduction: 1`;
- gate de primeiro hit por turno;
- atributos de espécie;
- matchups de classe;
- fórmula de dano;
- ENE;
- skills;
- posicionamento em si.

## Validação esperada

- `shieldhorn` ativa na frente;
- `shieldhorn` não ativa na retaguarda no Group;
- Wild mantém a mitigação do combatente ativo;
- harness continua tratando o duelo 1v1 como frontline;
- testes de paridade e passivas permanecem verdes.

## Próximo passo

Após a correção técnica, a investigação de balanceamento deve separar:

1. resistência percebida;
2. ganho de sobrevivência;
3. delta de vitória;
4. duração/TTK;
5. pressão ofensiva do tank;
6. cenários posicionais reais de Group.

Nenhum buff ou nerf é autorizado por este documento.
