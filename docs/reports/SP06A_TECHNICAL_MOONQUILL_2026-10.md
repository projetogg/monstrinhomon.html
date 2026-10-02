# SP-06A técnico — moonquill

**Status:** ACTIVE  
**Domain:** playtest técnico / passivas de espécie  
**Authority:** GitHub  
**VerifiedAgainst:** `b78bc8878e0bb7f644657644861e66ec1ce911d1`  
**Supersedes:** nenhum  
**Classificação de evidência:** `TECHNICAL_CONTROLLED`

## Objetivo

Verificar a cadeia mecânica de `moonquill` antes do playtest humano:

`debuff válido → +1 SPD por 1 turno → efeito posterior utilizável`.

Esta rodada não mede percepção, compreensão, diversão, frustração, justiça nem estratégia espontânea de crianças.

## Cenário oficial

- jogador: Dracoflamemon `MON_015`, Mago, Nv30;
- espécie canônica: `moonquill`;
- oponente: Vitalion `MON_031B`, Curandeiro, Nv30;
- Dracoflamemon SPD efetivo-base: 41;
- Vitalion SPD: 29;
- passiva: ao aplicar debuff, `+1 SPD` por 1 turno.

## Drifts encontrados antes da medição final

A primeira caracterização foi executada no PR experimental #299 e revelou dois drifts funcionais. O PR foi fechado sem merge.

### 1. Iniciativa Group ignorava buffs/debuffs de SPD

`calculateTurnOrder()` lia apenas `mon.spd` base. Mesmo um recálculo explícito não consumia o buff de `moonquill`.

Correção: PR #300, merge `f50f02e0b6dacdbb477925c359e09a366fc3c6ec`.

A correção:
- usa SPD efetivo na construção da ordem;
- marca a ordem para recálculo quando `moonquill` modifica SPD;
- recalcula somente na virada da rodada.

Nenhum valor da passiva foi alterado.

### 2. O buff expirava antes da próxima ação

O runtime criava `{ power: 1, duration: 1 }`, mas `updateBuffs()` decrementava a duração no início da próxima ação do próprio usuário. Assim, o buff podia aparecer no estado/log e desaparecer antes do ataque que deveria aproveitá-lo.

Correção: PR #301, merge `b78bc8878e0bb7f644657644861e66ec1ce911d1`.

A representação runtime ganhou um marcador interno para preservar o primeiro tick. A duração canônica continua sendo 1 turno.

Após a correção:

`SPD 41 → buff 42 → primeiro tick mantém 42 durante a próxima ação → tick seguinte retorna a 41`.

## Reexecução pós-correção

A bancada final foi o PR experimental #302, fechado sem merge após CI verde.

### Ciclo de vida

Resultado:

- SPD-base: 41;
- imediatamente após o buff: 42;
- durante a próxima ação, após o primeiro tick: 42;
- depois da janela: 41.

Conclusão factual: o efeito agora é mecanicamente consumível na ação seguinte.

### Cenário oficial — 20.000 confrontos pareados

```text
Dracoflamemon SPD 41
Vitalion SPD 29

sem moonquill: bônus de SPD no confronto = +1
com moonquill: bônus de SPD no confronto = +1

mudança de categoria RC: 0%
mudança de hit: 0%
mudança de dano: 0%
delta médio de dano: 0
```

O cenário oficial é saturado para esta métrica: Dracoflamemon já ultrapassa o limiar de vantagem de SPD antes da passiva.

Ausência de efeito neste cenário não demonstra que a passiva seja inútil ou fraca.

### Breakpoint ofensivo — 20.000 confrontos pareados

Cenário controlado:
- jogador SPD 41;
- inimigo SPD 39;
- sem buff: diferença 2 → bônus 0;
- com buff: diferença 3 → bônus +1.

Resultado:

```text
mudança de categoria RC: 0,23%
mudança de hit: 0%
mudança de dano: 0%
delta médio de dano: 0
```

O +1 SPD cruza de fato o breakpoint do sistema de vantagem, mas neste recorte a alteração de categoria foi rara e não alterou o dano final.

### Breakpoint de iniciativa Group — 20.000 execuções

Cenário controlado:
- jogador SPD-base 41;
- inimigo SPD 42;
- com `moonquill`, jogador passa a SPD efetivo 42.

No runtime atual:

```text
jogador primeiro sem buff: 0%
jogador primeiro com buff: 52,4%
delta: +52,4 p.p.
```

Isso demonstra que o +1 SPD pode ter efeito grande quando atravessa um breakpoint de ordem de turno.

## Ressalva de iniciativa

A regra documentada em `docs/PATCH_CANONICO_COMBATE_V2.2.md` define iniciativa como:

`SPD + d6`, maior resultado primeiro, com desempate favorável ao jogador.

O runtime Group atual ainda ordena principalmente por SPD e usa rolagem apenas no desempate de SPD. Portanto:

- o resultado de 52,4% descreve o runtime atual;
- ele não deve ser interpretado como estimativa da regra canônica pretendida;
- a divergência de fórmula de iniciativa deve permanecer separada da calibração de `moonquill`.

Essa divergência não invalida a conclusão funcional de que buffs de SPD agora são consumidos pela iniciativa.

## Classificação dos achados

### Fatos verificados

1. `moonquill` dispara apenas após debuff válido.
2. O modificador permanece `+1 SPD` por 1 turno.
3. PR #300 corrigiu o consumo de SPD efetivo na iniciativa Group.
4. PR #301 corrigiu a vida útil do buff até a próxima ação.
5. No cenário oficial 41 × 29, a métrica ofensiva de SPD já está saturada.
6. Em breakpoint 41 × 39, o buff cruza o limiar de vantagem de confronto.
7. Em breakpoint Group 41 × 42, o buff altera materialmente a ordem no runtime atual.
8. PRs experimentais #299 e #302 foram fechados sem merge.
9. Nenhum valor de passiva, PWR ou ENE foi alterado.

### Inferências

- O valor de `moonquill` parece altamente dependente de matchup/breakpoint, não de aplicação uniforme.
- O cenário oficial é inadequado para decidir força numérica da passiva.
- A iniciativa provavelmente é uma via mais relevante para a identidade da passiva do que dano direto, mas sua magnitude final depende da reconciliação da fórmula de iniciativa.

### Recomendações

- manter `+1 SPD / 1 turno` congelado;
- não buffar nem nerfar `moonquill` com base nesta rodada;
- registrar a divergência da fórmula de iniciativa separadamente;
- seguir para SP-06B / `shadowsting`;
- em futuro playtest humano, observar se o jogador percebe e entende a janela criada por SPD.

### Decisões dependentes do autor

Nenhuma decisão numérica é necessária para fechar o SP-06A técnico.

Uma decisão futura será necessária caso se pretenda reconciliar o runtime Group com a iniciativa canônica `SPD + d6`; isso pertence ao domínio de combate/iniciativa, não ao balanceamento isolado de `moonquill`.

## Resultado

**SP-06A técnico: CONCLUÍDO COM CAVEAT.**

A cadeia funcional foi demonstrada após correção de dois drifts. O cenário oficial não produz sensibilidade quantitativa por saturação de SPD; cenários de breakpoint confirmam que a passiva pode produzir efeito mecânico real.

Não há evidência suficiente para alterar o valor da passiva.

Próxima prioridade da bateria pré-playtest: **SP-06B — `shadowsting`**.
