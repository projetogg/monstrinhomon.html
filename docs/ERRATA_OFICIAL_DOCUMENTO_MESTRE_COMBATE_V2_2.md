# ERRATA OFICIAL DO DOCUMENTO MESTRE — COMBATE v2.2

**Projeto:** Monstrinhomon  
**Data:** 2026-04-07  
**Status:** Errata oficial vinculante  
**Escopo:** combate, atributos, habilidades, boss, posicionamento e autoridade documental  

---

## 1. Cláusula de autoridade

A partir desta errata, a autoridade documental do projeto fica congelada da seguinte forma:

1. **Documento Mestre + esta Errata Oficial v2.2**
2. Documentos auxiliares em `docs/`
3. `GAME_RULES.md` em trechos não contraditórios
4. Código atual do runtime
5. Análises auxiliares e diagnósticos

### Regra operacional

- Nenhum documento auxiliar pode sobrescrever o Documento Mestre sem revisão explícita do autor.
- Onde houver conflito entre `docs/*`, `GAME_RULES.md`, runtime e esta errata, **vence o Documento Mestre + Errata v2.2**.
- Esta errata existe para eliminar ambiguidades internas e impedir drift entre documento e implementação.

---

## 2. Escopo desta errata

Esta errata **não** altera:
- captura
- economia
- terapia
- PartyDex
- Box
- Loja

Ela congela apenas a camada de combate necessária para implementação segura das batalhas solo e em grupo.

---

## 3. Regras oficialmente vigentes do combate

### 3.1 Fórmula oficial de confronto

A fórmula vigente de confronto passa a ser:

```text
RC = (d20A + ATK_atacante + BônusAção + ModNível + ModClasse + BuffOfensivo)
   − (d20D + ceil(DEF_defensor/2) + ModPosição + BuffDefensivo)
```

### 3.2 Fórmula oficial de dano

```text
DanoBase = PWR_ação + ATK_atacante + ModNívelDano − floor(DEF_defensor/2)
DanoFinal = max(minDano, floor(DanoBase × mult_faixa))
```

### 3.3 Faixas oficiais de RC

| RC | Resultado | Multiplicador |
|---|---|---|
| ≤ −8 | Falha Total | ×0 |
| −7 a −3 | Contato Neutralizado | ×0 |
| −2 a +3 | Acerto Reduzido | ×0,60 |
| +4 a +10 | Acerto Normal | ×1,00 |
| ≥ +11 | Acerto Forte | ×1,25 |

### 3.4 Regras especiais de nível

Permanecem vigentes:
- **Superioridade real:** atacante 10+ níveis acima pode converter Contato Neutralizado em Acerto Reduzido
- **Dano ilusório:** atacante 10+ níveis abaixo causa dano 1 em faixas baixas aplicáveis

---

## 4. Crítico oficial do combate

O crítico mecânico canônico fica congelado assim:

- **Nat 20 do atacante:** +4 RC e +20% no dano final
- **Nat 1 do atacante:** −6 RC
- **Nat 20 do defensor:** −5 RC defensivo
- **Nat 1 do defensor:** +4 RC para o atacante

### Importante

- **Nat 20 não é acerto automático.**
- O sistema antigo de bônus aleatórios de crítico (item/moeda/poder×2) deixa de ser parte da fórmula mecânica.
- Caso seja mantido no futuro, ele deve existir apenas como **brinde crítico opcional de UX**, separado do cálculo de combate.

---

## 5. Atributo oficial de velocidade

### Decisão provisória congelada

- **`spd` continua sendo o campo técnico vigente no código e nos dados.**
- **AGI** continua sendo o nome canônico de design/documentação.
- Até decisão futura explícita, **não criar `agi` em paralelo no runtime**.

### Regra interpretativa

Sempre que o Documento Mestre mencionar **AGI**, o runtime deve interpretar como **`spd`**.

---

## 6. Sistema oficial de posicionamento em grupo

O combate em grupo continua oficialmente baseado em **3 linhas por lado**:

- **Frente**
- **Meio**
- **Trás**

### Regras congeladas

- máximo de **2 combatentes por linha**
- bônus defensivo por linha:
  - Frente: +0
  - Meio: +1
  - Trás: +2
- o bônus só vale se houver cobertura válida da linha à frente
- se uma linha ficar vazia, a de trás avança automaticamente sem custo de turno
- posicionamento só existe em combate de grupo
- em combate solo/wild, alcance e posição não se aplicam como grade

---

## 7. Alcance oficial por classe

| Classe | Alcance base | Regra oficial |
|---|---|---|
| Guerreiro | Curto | atinge apenas Frente inimiga |
| Bárbaro | Curto | atinge apenas Frente inimiga |
| Mago | Longo | atinge Frente, Meio e Trás |
| Curandeiro | Médio | ofensivo em Frente/Meio; cura qualquer linha aliada |
| Bardo | Longo | atinge qualquer linha; buffs em qualquer aliado |
| Ladino | Médio | atinge Frente e Meio |
| Caçador | Longo | atinge qualquer linha |
| Animalista | Curto | atinge apenas Frente inimiga |

### Modificador por posição do atacante

- Frente: sem alteração
- Meio: +1 linha de alcance
- Trás: −1 linha de alcance

---

## 8. Boss mínimo canônico

Boss mínimo oficial continua sendo:

- HP ×2,5
- ATK ×1,5
- DEF ×1,5
- imune a STUN
- imune a ROOT
- **não** imune a debuff de SPD
- fuga proibida para o jogador
- captura proibida, salvo exceções de história explicitamente definidas
- **Fase 2 em HP ≤ 50% com +20% ATK adicional**

### Observação

Fases mínimas de boss já são canônicas. O que continua em aberto são habilidades exclusivas e comportamento individualizado de cada boss.

---

## 9. KO, swap e fuga em grupo

Continuam oficialmente vigentes:

### KO
- Monstrinho com HP 0 fica `fainted`
- sai do turno
- abre fluxo de substituição sem custo de turno
- se não houver substituto elegível, o jogador é eliminado da batalha de grupo

### Swap estratégico
- consome o turno
- substituto entra na mesma posição
- substituto entra com ENE cheia
- buffs/debuffs do anterior não são transferidos

### Fuga individual
- usa o turno do combatente ativo
- usa fórmula baseada em `spd`
- sucesso remove apenas aquele combatente da batalha
- a batalha continua para os demais
- em boss, fuga é proibida

---

## 10. Passivas de espécie

As passivas de espécie continuam válidas como regra do sistema e devem valer em:
- combate solo
- combate em grupo

### Regra operacional

A aplicação em grupo depende do gatilho correspondente existir naquele pipeline.  
Ou seja: a passiva vale nos dois modos **desde que o evento necessário exista naquele contexto**.

---

## 11. Estados provisórios congelados até decisão do autor

As regras abaixo ficam congeladas como **pendências oficiais**. Nenhuma IA ou colaborador deve tratá-las como resolvidas sem decisão explícita do autor.

### 11.1 Decisão bloqueante A — PWR e catálogo

Pergunta oficial:
- o catálogo de monstros será recalibrado para os atributos canônicos v2.1?
- ou o catálogo atual será mantido e os PWRs ajustados para ele?

### Estado congelado

Até essa decisão:
- não migrar automaticamente os PWRs dos docs para o runtime
- não usar exemplos numéricos do Documento Mestre como referência de TTK do runtime atual
- toda auditoria quantitativa deve declarar explicitamente se usa:
  - catálogo atual
  - ou catálogo recalibrado

### 11.2 Decisão bloqueante B — Passivas de classe v1

Pergunta oficial:
- as passivas de classe v1 continuam como regra oficial?
- ou serão revogadas?

Passivas afetadas:
- Guerreiro: −15% dano recebido
- Bárbaro: −10% dano recebido
- Curandeiro: −10% dano recebido
- Ladino: +10% dano causado
- Ladino: −1 DEF no primeiro golpe básico do combate

### Estado congelado

Até decisão explícita:
- elas permanecem como estado legado ativo no código
- não criar novas passivas de classe
- não somar novas camadas de identidade de classe sem resolver isso

### 11.3 Decisão não-bloqueante C — `spd` vs `agi`

Estado congelado:
- manter `spd` como campo técnico
- AGI como nome de design
- sem migração obrigatória agora

### 11.4 Decisão não-bloqueante D — brinde crítico de UX

Estado congelado:
- bônus aleatório de nat 20 não entra na fórmula mecânica
- pode voltar no futuro apenas como brinde visual/narrativo opcional

---

## 12. Regra sobre documentos legados

### `GAME_RULES.md`

O corpo antigo de `GAME_RULES.md` contendo regras v1 de combate deve ser tratado como **legado**, não como autoridade de implementação, quando conflitar com o Documento Mestre + Errata v2.2.

### Regra final de leitura

- Documento Mestre + Errata v2.2 = vigente
- `docs/*` = auxiliar, subordinado
- `GAME_RULES.md` = histórico/legado, salvo trechos explicitamente preservados

---

## 13. Próxima ação oficial recomendada

Antes de qualquer nova fase grande de implementação, o projeto deve responder explicitamente apenas duas perguntas:

1. **Decisão A — catálogo/PWR**
2. **Decisão B — passivas de classe v1**

Com essas duas respostas, o combate fica destravado para implementação técnica sem ambiguidade sistêmica relevante.

---

## 14. Cláusula final

A partir desta data, nenhuma IA, colaborador ou agente técnico deve:
- sobrescrever o Documento Mestre usando documentos auxiliares
- tratar hipótese como regra oficial
- implementar redesign de combate fora do que foi congelado aqui
- misturar fórmula v1 e v2 no mesmo pipeline

Esta errata existe para garantir que o combate do Monstrinhomon avance com **governança, consistência e autoridade documental única**.
