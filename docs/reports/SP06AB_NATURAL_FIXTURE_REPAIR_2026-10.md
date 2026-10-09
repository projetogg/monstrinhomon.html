# Reparação técnica de configuração — SP-06A / SP-06B (2026-10-09)

**Status:** ACTIVE — evidência e recomendações de configuração, sem nova regra.  
**Domain:** técnica / playtest / configuração de cenários.  
**Authority:** GitHub — síntese baseada em catálogo e experimentos; não suplanta decisões humanas.  
**VerifiedAgainst:** `main` `56156741bc3536732cd40f90adb336cbf4471db3`; catálogo `data/monsters.json`, ponte `js/canon/speciesBridge.js`, protocolo v2.2; experimento PR #318 (fechado sem merge).  
**Supersedes:** nenhum; relatórios SP-06A e SP-06B preservados como evidência histórica.  
**Classificação:** `TECHNICAL_CONTROLLED`, **não** playtest humano.

## Resultado objetivo

- **Drift de progressão confirmado** nos dois casos. Vitalion `MON_031B` evolui no nível 25 para Vitalegion `MON_031C`, mas o protocolo antigo propunha Vitalion no nível 30.
- **Não se deve simplesmente substituir Vitalion por Vitalegion em ambas as linhas.** A forma é legítima, mas a nova simulação simplificada indicou confrontos extremamente difíceis.
- **SP-06A — `moonquill`:** recomenda-se, para uma **proposta de coleta observacional** mais acessível, Aquasolion `MON_032B` nível 30. O resultado é previsível/saturado e serve para observar escolha, gatilho e feedback do debuff, **não** para inferir importância do +1 SPD para a vitória ou iniciativa. Vitalegion nível 30, SPD de mesma grandeza, fica reservado como **candidato a bancada técnica controlada** de iniciativa, não como batalha longa para crianças.
- **SP-06B — `shadowsting`:** recomenda-se **Auravelo `MON_028C` nível 30** como candidato ao desafio observacional, validando anteriormente a tolerabilidade. Há evidência quantitativa independente anterior em 20.000 pares e nova comparação de 1.200 pares. Aquasolion nível 30 é alternativa mais simples para observar o setup, mas tão fácil no harness que não informa vitória/TTK.
- **Essas escolhas são recomendações operacionais, não uma decisão final do autor.** Antes de sessão com crianças, verificar a build publicada, opções de encontro realmente selecionáveis, tempo e dificuldade, com aprovação humana da configuração. Nenhuma troca de oponente deve acontecer no meio da coleta natural.

## Evidência derivada do catálogo

| Template | Papel / evolução | Estágio natural no nível 30? | Classe | Mapeamento de espécie |
|---|---|---|---|---|
| Vitalion `MON_031B` | evolui no Nv25 → Vitalegion | **Não** | Curandeiro | sem espécie mapeada |
| Vitalegion `MON_031C` | terceira forma de Vitalex | **Sim** | Curandeiro | sem espécie mapeada |
| Aquasolion `MON_032B` | evolui no Nv14 de Aquasol; sem nova evolução catalogada | **Sim** | Curandeiro | sem espécie mapeada |
| Auravelo `MON_028C` | terceira forma de Nutrilo, após evolução no Nv25 | **Sim** | Curandeiro | **`floracura` mapeada** |

**Atenção:** Auravelo difere também na presença de espécie canônica mapeada. O harness comparativo modela apenas a passiva do jogador; ele não demonstra paridade com a IA adversária e todos os gatilhos de `floracura`. Como esta passiva é ativada por item de cura, verificar o comportamento efetivo do adversário/itens da build antes da coleta. A configuração não é um controle “sem outra passiva” equivalente ao Vitalion histórico.

## Benchmark exploratório — PR #318

Bancada de teste do simulador `speciesPassiveQuantitativeHarness.js` com dados de `data/monsters.json`, escalonamento de templates no nível 30, perfil `mixed`, **1.200 pares por candidato**, 14 configurações totais, seeds determinadas; teste com CI aprovada. Esse harness usa ações técnicas alternadas, não modela escolha espontânea, IA, cura adversária integral, kit swap integral, economia de ENE nem iniciativa Group. Os números **não** estimam dificuldade observada em crianças.

| Foco | Oponente Nv30 | Progressão natural | SPD jogador × inimigo | Vitória-base (harness) | Ganho médio de dano (passiva) |
|---|---|---|---|---:|---:|
| SP-06A | Vitalion (histórico) | **Não** | 41 × 29 | 100% | 0 |
| SP-06A | Vitalegion | Sim | 41 × 41 | **0,08%** | +0,08 |
| SP-06A | Auravelo | Sim | 41 × 36 | 4,58% | +0,15 |
| SP-06A | Aquasolion | Sim | 41 × 25 | **100%** | 0 |
| SP-06A | Abissalquimon | Sim | 41 × 36 | 0% | 0 |
| SP-06A | Sombrifur | Sim | 41 × 73 | 0% | 0 |
| SP-06A | Rainhassommon | Sim | 41 × 69 | 87,25% | 0 |
| SP-06B | Vitalion (histórico) | **Não** | 73 × 29 | 100% | +3,86 |
| SP-06B | Vitalegion | Sim | 73 × 41 | 2,25% | +3,35 |
| SP-06B | Auravelo | Sim | 73 × 36 | **27,00%** | +4,13 |
| SP-06B | Aquasolion | Sim | 73 × 25 | 100% | +4,21 |
| SP-06B | Abissalquimon | Sim | 73 × 36 | 0,58% | +2,15 |
| SP-06B | Sombrifur | Sim | 73 × 73 | 0% | +1,16 |
| SP-06B | Rainhassommon | Sim | 73 × 69 | 91,67% | +8,57 |

No SP-06A, **delta de dano zero com `moonquill` não significa passiva inerte**: o modelo não avalia a alteração canônica da iniciativa Group pela SPD, mas apenas bônus de SPD em partes do confronto ofensivo. Quando o adversário tem SPD 41, `moonquill` pode atravessar o empate para 42 em um contexto técnico; porém o confronto completo demonstrou dificuldade extrema nesse template.

No SP-06B, o [relatório técnico anterior](SP06B_TECHNICAL_SHADOWSTING_2026-10.md) já havia registrado **29,67%** de vitória-base contra Auravelo em **20.000 pares**, delta de dano **+4,1638** sem mudança de vitória. A nova bancada (27% em 1.200 pares) é coerente quanto à ordem de grandeza, mas não deve ser combinada em uma única taxa, pois condições, seeds e número de execuções diferem.

**Proveniência:** [PR experimental #318](https://github.com/projetogg/monstrinhomon.html/pull/318), fechado **sem merge**, e [run CI](https://github.com/projetogg/monstrinhomon.html/actions/runs/37982484139). O experimento foi executado na branch separada; somente esta documentação e eventuais testes de consistência são candidatos ao merge do reparo.

## Plano de configuração proposto para o playtest mediado

### SP-06A — observação natural vs. confirmação técnica

1. **Observação natural proposta:** Dracoflamemon `MON_015` Nv30 vs. Aquasolion `MON_032B` Nv30; manter o debuff como opção livre, acompanhar criação/consumo do `+1 SPD` e feedback, com HP inicial cheio e nenhuma indução. **Não usar resultado de vitória para validar poder da passiva.**
2. **Apenas técnica/controle, fora do bloco natural infantil:** Dracoflamemon Nv30 vs. Vitalegion `MON_031C` Nv30, SPD calculada 41 × 41; executar teste de breakpoint da ordem de turno com isolamento de variáveis, sem exigir vitória da criança. A iniciativa Group permanece em divergência com a forma canônica `SPD + d6` (`DIV-INIT-01`); qualquer resultado pertence ao comportamento runtime verificado, não à regra pretendida.
3. **Decisão humana pendente:** aprovar se a prioridade é *compreensão/feedback* em confronto acessível ou *sensibilidade competitiva* a SPD, que deve seguir bancada técnica em separado. Não misturar objetivos na mesma interpretação.

### SP-06B — setup de carga vs. desafio

1. **Observação principal candidata:** Umbraquimonom `MON_022C` Nv30 vs. Auravelo `MON_028C` Nv30, **somente após QA** demonstrar batalha aceitável para as crianças previstas, adversário realmente selecionável e ausência de interferência não mensurada de IA/item de cura.
2. **Alternativa de menor exigência:** Umbraquimonom Nv30 vs. Aquasolion `MON_032B` Nv30, para observar compreensão do setup debuff → básico mesmo que a vitória seja muito provável e a métrica de balanceamento fique saturada.
3. **Decisão humana pendente:** escolher a dificuldade do encontro natural e a finalidade observacional. Não extrapolar vitória-base do harness para tolerabilidade emocional ou adequação terapêutica.

## Limites e portão de liberação

- O protocolo reparado deve declarar estes adversários como **candidatos, não configurações humanas homologadas**.
- Confirmar evolução natural, classe, `canonSpeciesId`, quatro slots, kit swap, habilidade de debuff, ENE necessária e modo `Wild`/`Group`; evitar testes “forçados” editando saves/atributos.
- Confirmar que o adversário é selecionável na build; se não, registrar impedimento, não improvisar adversário sem atualizar a baseline.
- Executar QA visual e funcional, avaliar ritmo, compreensão e tolerabilidade do cenário proposto antes de solicitar decisão ao autor.
- Manter a decisão `DEC-PLAYTEST-PRE-01`: **playtest humano adiado até a build estar apresentável**, sem substituição por simulação.
- Nenhuma alteração de `data/monsters.json`, espécies, skills, PWR, ENE, iniciativa, crítico ou balanceamento foi autorizada.

## Próxima ação

A correção documental de progressão não é liberação clínica ou de produto. Próximo portão: **QA das configurações reais de SP-06A/B e decisão do autor sobre oponente/dificuldade**, antes de registrar cenário final como autorizado para playtest. As investigações separadas de ENE/iniciativa continuam no roadmap.
