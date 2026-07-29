# Comparação quantitativa da baseline pós-paridade — Combate v2.2

## Status

Comparação reproduzível entre a baseline anterior às correções das passivas de espécie e a baseline posterior à conclusão da sequência de paridade.

Este relatório não altera runtime, fórmulas, valores, dados ou balanceamento.

## Artefatos comparados

### Antes das correções

- PR: `#264`;
- workflow: `Combat v2.2 Baseline`;
- run: `#15`;
- run ID: `30287695764`;
- head SHA: `e019262f1325d0c416beb76b89000473b4480822`;
- artifact ID: `8661485325`;
- artifact: `combat-v2-2-baseline-e019262f1325d0c416beb76b89000473b4480822`;
- digest ZIP: `sha256:b1416c0a89420f1f4e739a6c8aca73526b874c765fecb127e51bdd4a5bf09024`.

### Depois das correções e da revalidação

- PR: `#275`;
- workflow: `Combat v2.2 Baseline`;
- run: `#23`;
- run ID: `30414217954`;
- head SHA: `70670dd4f355515af695698a2d48582fc90b45fd`;
- artifact ID: `8709540034`;
- artifact: `combat-v2-2-baseline-70670dd4f355515af695698a2d48582fc90b45fd`;
- digest ZIP: `sha256:9244e3f53860ebc1cc96115a93067225d12277f871a4ce0303c8e79a37f16fd2`.

## Comparabilidade

As duas baselines utilizam:

- schema `1`;
- seed `monstrinhomon-combat-v2.2-baseline-v1`;
- `1000` execuções por cenário;
- `90` cenários;
- os mesmos IDs de cenário;
- as mesmas fontes de fórmula, monstros, skills e matchups.

Total comparado:

```text
90 cenários × 1000 execuções = 90.000 combates por baseline
```

Nenhum cenário foi adicionado ou removido.

## Método

A comparação foi executada com:

```text
scripts/compare-combat-baselines-v2-2.mjs
```

O comparador:

1. indexa cenários por `id`;
2. separa `baselineSha` e `generatedAt` como metadados;
3. compara recursivamente todos os demais campos;
4. agrega métricas globais;
5. registra cenários adicionados, removidos ou alterados;
6. verifica a cobertura declarada da baseline.

## Resultado principal

```text
Cenários comparados: 90
Cenários sem alteração: 90
Cenários quantitativamente alterados: 0
Diferenças comparáveis de topo: 0
Diferenças totais no JSON: 2
```

As únicas diferenças no JSON são:

- `baselineSha`;
- `generatedAt`.

O Markdown gerado difere apenas na linha do SHA.

Todos os objetos `results`, incluindo todos os campos de `summary`, são idênticos.

## Métricas agregadas

| Métrica | Antes | Depois | Delta |
|---|---:|---:|---:|
| Cenários | 90 | 90 | 0 |
| Execuções totais | 90.000 | 90.000 | 0 |
| Vitória média por cenário | 68,0867% | 68,0867% | 0,0000 p.p. |
| TTK médio entre cenários | 3,754722 | 3,754722 | 0 |
| Dano médio por ação danosa | 16,244343 | 16,244343 | 0 |
| HP final médio do jogador | 21,491989 | 21,491989 | 0 |
| Ataques totais | 614.572 | 614.572 | 0 |
| Ataques básicos | 487.919 | 487.919 | 0 |
| Skills | 126.653 | 126.653 | 0 |
| Uso ponderado de skills | 20,6083% | 20,6083% | 0,0000 p.p. |
| Natural 1 ponderado | 5,0167% | 5,0167% | 0,0000 p.p. |
| Natural 20 ponderado | 5,0450% | 5,0450% | 0,0000 p.p. |

## Categorias de RC

| Categoria | Contagem antes | Contagem depois | Proporção | Delta |
|---|---:|---:|---:|---:|
| `falha_total` | 56.505 | 56.505 | 9,1942% | 0 |
| `contato_neutralizado` | 64.733 | 64.733 | 10,5330% | 0 |
| `acerto_reduzido` | 113.030 | 113.030 | 18,3917% | 0 |
| `acerto_normal` | 154.886 | 154.886 | 25,2023% | 0 |
| `acerto_forte` | 225.418 | 225.418 | 36,6789% | 0 |

## Interpretação

### A baseline de fórmula permaneceu estável

A sequência dos PRs #266, #273 e #274 não alterou:

- a fórmula compartilhada;
- dados de monstros;
- catálogo de skills usado pelo harness;
- matchups;
- crescimento explícito do simulador;
- passivas de classe do harness.

A reprodução exata dos 90 cenários é evidência de que o núcleo quantitativo atualmente modelado permaneceu estável.

### A comparação não mede o impacto das passivas de espécie

O resultado `delta = 0` não significa que as passivas de espécie não alteram o jogo.

O harness atual:

- não atribui `canonSpeciesId` aos combatentes;
- não chama `fireCombatEvent()` ou `resolvePassiveModifier()`;
- não modela estados como `swiftclawFirstStrikeDone`, `shadowstingDebuffCharged` ou `bellwaveRhythmCharged`;
- não modela `floracura`, `moonquill` ou `shieldhorn` como passivas de espécie;
- aplica somente `DEFAULT_CLASS_PASSIVES`.

O campo:

```text
passivesEnabled: true
```

controla as passivas de classe do harness. Ele não representa suporte às passivas de espécie.

O próprio artefato declara:

> Sem passivas de espécie, cura, itens, alvo de IA ou equivalência completa Wild/Group.

### O digest diferente não representa resultado diferente

Os ZIPs possuem digests diferentes porque contêm:

- SHA diferente;
- horário de geração diferente.

O conteúdo quantitativo dos cenários é idêntico.

## Decisões que esta evidência não autoriza

Esta comparação não autoriza:

- reduzir ou aumentar valores de passivas;
- concluir que `atkBonus = 1` é fraco ou forte;
- recalibrar `shieldhorn`;
- alterar PWR;
- alterar crítico;
- alterar ENE;
- escolher classes para buff ou nerf;
- declarar o balanceamento v2.2 concluído.

## Lacunas remanescentes

A baseline quantitativa ainda não mede:

- frequência de ativação por espécie;
- dano incremental causado por `atkBonus`;
- mitigação incremental de `shieldhorn`;
- cura adicional de `floracura`;
- duração e efeito de `moonquill`;
- produção e consumo das cargas de `shadowsting` e `bellwave`;
- interação das passivas com nível, classe, perfil basic/mixed e duração do combate;
- inimigos com passivas;
- bosses;
- múltiplos alvos;
- playtest humano.

A lacuna `EG-01`, relativa a skills que erram no Wild, permanece separada.

## Próximo portão técnico

O próximo PR deve ser exclusivamente:

```text
test(combat): adicionar matriz quantitativa de passivas de espécie
```

Esse PR deve:

1. preservar a baseline atual como referência de fórmula e passivas de classe;
2. criar uma matriz dedicada às oito passivas de espécie;
3. utilizar seeds fixas e pares com e sem passiva;
4. medir frequência de ativação;
5. medir delta de dano, mitigação, cura e estados;
6. separar Wild e Group quando o contrato não for diretamente comparável;
7. produzir artefato próprio;
8. não alterar valores ou balanceamento.

Somente após essa matriz e pelo menos um playtest mediado será apropriado discutir recalibração.

## Classificação final

**B. Nenhum delta no harness atual; passivas de espécie permanecem fora da cobertura.**
