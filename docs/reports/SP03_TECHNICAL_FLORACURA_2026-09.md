# SP-03 técnico — Floracura e oportunidade real de item

**Status:** ACTIVE  
**Domain:** técnica / playtest / análise quantitativa  
**Authority:** GitHub  
**VerifiedAgainst:** runtime `03a67aa1fb54698feea1f9959988dcd536c50ac8`; análise executada no PR #295; feedback corrigido no PR #296 / `194be88b4257a8e50cf4ef456534a6722ea38fd9`  
**Supersedes:** nenhum

## Objetivo

Medir `floracura` no cenário SP-03 a partir de HP cheio e com o `Petisco de Cura` real, separando:

1. oportunidade de cura;
2. política técnica de uso do item;
3. espaço restante para o bônus após a cura-base;
4. bônus efetivamente aplicado;
5. impacto em sobrevivência, duração e vitória.

Este relatório é `TECHNICAL_CONTROLLED`. Ele não representa escolha, percepção ou estratégia de uma criança.

## Cenário oficial

- jogador: Nutrilo `MON_028`, Curandeiro, Nv10;
- adversário: Furtilhon `MON_030`, Ladino, Nv10;
- matchup de classe: neutro;
- HP inicial: 100%;
- item: `IT_HEAL_01` — 30% do HP máximo, mínimo 30 HP;
- offset canônico de `floracura` aplicado nas variantes com e sem passiva;
- HP máximo do Nutrilo no experimento: 54;
- passiva: primeira cura por item pode acrescentar até +3 HP;
- item consome a ação do turno e o inimigo age depois, como no runtime;
- um item disponível por combate;
- comparação pareada com seeds idênticas.

A competição com `Cura I` e a economia completa de ENE não foram modeladas, para não misturar o SP-03 com a investigação independente de ENE.

## Correção metodológica em relação à matriz antiga

A matriz quantitativa anterior de espécies:

- iniciava `floracura` em 10% de HP;
- usava cura-base simplificada;
- aplicava a cura antes da ação ofensiva do mesmo turno.

Ela confirma que o modificador de cura funciona, mas não mede oportunidade natural nem o custo real da ação de item.

O PR #295 foi criado apenas como bancada experimental e encerrado sem merge.

## Resultado principal — política técnica de uso em <=50% HP

20.000 pares, Nutrilo Nv10 × Furtilhon Nv10.

| Métrica | Sem passiva | Com `floracura` | Delta |
|---|---:|---:|---:|
| Vitória | 7,125% | 8,455% | **+1,33 p.p.** |
| Turnos médios | — | — | +0,168 |
| HP final médio | — | — | +0,202 |

Oportunidade e cura:

- houve dano/oportunidade de cura em 100% dos combates;
- item foi usado em 99,835%;
- turno médio do item: 3,18;
- HP médio antes do item: 13,69 / 54;
- cura-base média por uso: 29,90;
- havia algum espaço para bônus em 87,375% dos combates;
- havia espaço para os +3 completos em 86,61%;
- entre os usos do item, bônus positivo ocorreu em 87,52%;
- bônus completo de +3 ocorreu em 86,75%;
- bônus zero ocorreu em 12,48%;
- bônus médio por uso: +2,611 HP;
- cura total média por uso: 32,509 HP.

## Sensibilidade ao momento do item

5.000 pares por política. Os limiares são políticas técnicas, não comportamento infantil.

| Usar Petisco quando HP <= | Uso do item | Bônus zero entre usos | Bônus médio/uso | Δ vitória |
|---:|---:|---:|---:|---:|
| 70% | 100,0% | **92,22%** | +0,229 | +0,06 p.p. |
| 50% | 99,8% | 12,61% | +2,610 | +1,46 p.p. |
| 40% | 98,26% | 0% | **+3,000** | +1,46 p.p. |
| 30% | 89,9% | 0% | **+3,000** | +1,30 p.p. |

Com HP máximo 54 e cura-base mínima de 30:

- para existir qualquer espaço após a cura-base, o Nutrilo precisa estar com no máximo 23 HP (~42,6%);
- para caberem os +3 completos, precisa estar com no máximo 21 HP (~38,9%).

Portanto, usar o item cedo pode consumir a primeira ativação de `floracura` sem benefício numérico.

Esperar demais também tem custo: na política <=30%, o item deixou de ser usado em cerca de 10% dos combates porque a oportunidade não chegou antes do desfecho.

## Sensibilidade à dificuldade

Com política técnica <=40% e 5.000 pares por cenário:

| Furtilhon | Vitória sem | Vitória com | Δ vitória |
|---|---:|---:|---:|
| Nv8 | 27,26% | 31,02% | **+3,76 p.p.** |
| Nv9 | 13,02% | 15,96% | **+2,94 p.p.** |
| Nv10 | 6,94% | 8,36% | **+1,42 p.p.** |

O cenário oficial Nv10 é estruturalmente difícil para Nutrilo no modelo controlado. Isso reduz a capacidade do bônus de +3 de alterar o resultado final.

Mesmo em cenários menos extremos, o efeito continua contextual: pode converter uma pequena fração de derrotas em vitórias, mas não funciona como sustentação dominante.

## Drift de feedback encontrado

O runtime já aplicava corretamente:

`cura-base + bônus efetivamente aplicável de floracura`

ao HP final.

Entretanto, antes do PR #296:

- Wild retornava `actualHeal` apenas com a cura-base;
- o callback visual do Wild recebia apenas a cura-base;
- o resumo principal do item no Group mostrava apenas a cura-base;
- uma linha separada de log mostrava o bônus da passiva.

Exemplo verificado no PR #295:

- HP antes: 20;
- cura-base: +30;
- `floracura`: +3;
- HP final: 53;
- retorno/feedback visual antigo: +30;
- log da passiva: +3.

## Correção do feedback

PR #296, mergeado em `194be88b4257a8e50cf4ef456534a6722ea38fd9`:

- Wild agora inclui o bônus efetivamente aplicado em `actualHeal`;
- o feedback visual Wild recebe a cura total;
- Group inclui o bônus no total de HP reportado;
- a linha separada da passiva permanece para explicar a origem do bônus.

Nenhum valor, gatilho ou HP final foi alterado.

Validações do PR #296:

- Vitest: sucesso;
- Wild Loop unitário: sucesso;
- validação de dados: sucesso;
- validação de assets: sucesso;
- Combat v2.2 Baseline: sucesso;
- matriz quantitativa de espécies: sucesso;
- Wild Loop E2E / Playwright: sucesso.

## Fatos verificados

1. `floracura` funciona no primeiro item de cura e respeita o teto de HP.
2. O bônus pode ser totalmente desperdiçado quando o item é usado cedo.
3. O Petisco real é grande em relação ao HP do Nutrilo Nv10, tornando o timing relevante.
4. Em torno de <=40% de HP, o +3 completo cabe de forma consistente no cenário analisado.
5. Esperar até HP muito baixo reduz a chance de o item chegar a ser usado.
6. O efeito em vitória é pequeno a moderado e depende fortemente do cenário.
7. O feedback Wild/Group subnotificava a cura total; esse drift foi corrigido no PR #296.

## Inferências

1. A identidade de `floracura` é mais de eficiência contextual do que de sustain constante.
2. O bônus incentiva implicitamente uma cura em janela mais eficiente, mas o jogo ainda precisa de playtest humano para saber se essa relação é compreensível ou sequer percebida.
3. O valor da passiva não deve ser avaliado sem considerar o tamanho do item de cura em relação ao HP máximo.
4. O cenário oficial Nv10 é adequado para garantir oportunidade de cura, mas é severo para medir equilíbrio de resultado.
5. A competição real entre item e `Cura I` deve permanecer fora desta etapa até a economia de ENE ser investigada ou um protocolo próprio separar essa variável.

## Classificação

- `SP03-TECH-01` — **TECHNICAL_CONTROLLED**: oportunidade, uso técnico e benefício mensurados.
- `SP03-TECH-02` — **BALANCE**: efeito contextual, dependente do timing e da dificuldade.
- `SP03-TECH-03` — **UX/DRIFT**: feedback de cura total omitia o bônus; corrigido no PR #296.
- `SP03-TECH-04` — **EVIDENCE_GAP**: escolha espontânea, compreensão, percepção, diversão e frustração permanecem não testadas.
- `SP03-TECH-05` — **BALANCE**: nenhuma alteração de +3 HP é justificada pela evidência atual.

## Decisão permitida

Manter `floracura` congelada:

`primeiro item de cura do combate → até +3 HP, limitado pelo HP máximo`.

## Próximo passo

Seguir para a bateria das passivas condicionadas por setup, começando pela próxima prioridade definida no roadmap, sem misturar recalibração numérica no mesmo passo.

Nenhum PWR, ENE, valor de item ou valor de passiva é alterado por este relatório.
