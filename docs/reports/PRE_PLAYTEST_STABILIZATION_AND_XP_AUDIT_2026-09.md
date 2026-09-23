# Estabilização pré-playtest e auditoria de XP — 2026-09

**Status:** ACTIVE — relatório técnico/evidencial; não aprova recalibração de XP.  
**Domain:** técnica / playtest  
**Authority:** GitHub para o comportamento observado no runtime; decisões de ritmo continuam dependentes do autor.  
**VerifiedAgainst:** `29aaa0ce89e5b99da45fe15cbb55109a79c3ad6c` + branch `fix/pre-playtest-stabilization-xp-audit`  
**Supersedes:** nenhum

## 1. Origem

Smoke test manual pré-playtest executado no GitHub Pages com três jogadores.

Achados relatados:

1. após o fluxo inicial e a escolha de pular/fazer tutorial, foi observada uma Home com jogador sem Monstrinhomon ativo;
2. o jogador já selecionado na navbar precisava ser escolhido novamente ao iniciar encontro individual em um spot;
3. mapa, deslocamento e batalhas funcionaram no percurso testado até o nível 6;
4. habilidades do Guerreiro pareceram funcionar no percurso observado;
5. o ritmo de XP pareceu alto já em nível baixo.

Este relatório separa correção funcional/UX de decisão de balanceamento.

## 2. Estabilizações desta branch

### 2.1 Starter / Monstrinhomon ativo

O fluxo de novo jogo cria jogadores inicialmente sem time e concede o starter depois, por `mmStarterHatchEgg()`.

Antes desta branch:

- `awardMonster()` adicionava o monstro ao time sem garantir imediatamente um `activeIndex` válido;
- `mmStarterHatchEgg()` avançava para a fase `hatched` mesmo se `awardMonster()` retornasse `null`;
- `mmFinishStarterFlow()` não fazia uma validação final de que todos os jogadores possuíam starter/time antes de abrir tutorial/Home.

Correções:

- ao adicionar um monstro ao time, `awardMonster()` inicializa/repara `activeIndex` quando necessário;
- hatch que falhar não pode avançar para `hatched`;
- o fim do onboarding valida todos os jogadores e volta ao ovo do jogador incompleto quando necessário;
- antes de sair do onboarding, cada jogador recebe um `activeIndex` vivo válido quando possível.

**Classificação:** BUG de integração/estado.  
**Limite:** o smoke test original prova o sintoma, mas não identifica sozinho qual das condições acima foi a causa concreta naquela execução.

### 2.2 Seleção duplicada de jogador

A navbar já mantém `GameState.ui.perspectivePlayerId` como perspectiva global.

Antes desta branch, `_wmUpdatePlayerDropdown()` reconstruía um segundo seletor no spot e só auto-selecionava quando havia exatamente um jogador. Com múltiplos jogadores, a escolha da navbar era ignorada.

Correção:

- a perspectiva global passa a ser a fonte de verdade para encontros individuais;
- o seletor interno `encounterPlayer` permanece oculto apenas para compatibilidade com `startEncounter()`;
- o spot mostra apenas o jogador atual e o botão **Iniciar**;
- a troca de jogador continua sendo feita pelo seletor global da navbar.

**Classificação:** UX.

## 3. Auditoria de XP

### 3.1 XP concedido por batalha

A fonte runtime observada é `js/progression/xpCore.js`:

```text
XP base = floor((15 + 2 × nível do inimigo) × multiplicador de raridade)
boss = XP base × 1,5
```

Multiplicadores de raridade atuais:

| Raridade | Multiplicador |
|---|---:|
| Comum | 1,00 |
| Incomum | 1,05 |
| Raro | 1,10 |
| Místico | 1,15 |
| Lendário | 1,25 |

`giveXP()` aplica depois o multiplicador de amizade.

O starter nasce com amizade 50. Em `js/progression/friendshipSystem.js`, amizade 50 corresponde a nível 3, que herda o bônus de **+5% de XP** do nível 2.

Portanto, um starter novo já recebe aproximadamente 5% a mais do que o valor base da recompensa.

### 3.2 XP necessário no runtime

O runtime atual calcula:

```text
xpNeeded = round(40 + 6 × nível + 0,6 × nível²)
```

Exemplos:

| Nível atual | Runtime `xpNeeded` |
|---:|---:|
| 1 | 47 |
| 5 | 85 |
| 6 | 98 |
| 10 | 160 |
| 15 | 265 |
| 30 | 760 |
| 50 | 1.840 |
| 75 | 3.865 |
| 99 | 6.515 |

### 3.3 Drift com `progression.config.json`

`progression.config.json` contém uma tabela `xpCurve`, porém a busca de consumidores na baseline examinada não encontrou loader/runtime/teste ativo utilizando essa tabela. A única ocorrência de `xpCurve` é o próprio arquivo.

Comparação:

| Nível | Runtime | `progression.config.json` | Diferença |
|---:|---:|---:|---:|
| 1 | 47 | 37 | -21,3% |
| 5 | 85 | 88 | +3,5% |
| 6 | 98 | 106 | +8,2% |
| 10 | 160 | 190 | +18,8% |
| 15 | 265 | 332 | +25,3% |
| 30 | 760 | 1.006 | +32,4% |
| 50 | 1.840 | 2.478 | +34,7% |
| 75 | 3.865 | 5.240 | +35,6% |
| 99 | 6.515 | 8.857 | +35,9% |

Do nível 1 ao 99:

```text
soma runtime atual:           230.670 XP
soma progression.config.json: 311.614 XP
diferença:                     80.944 XP (+35,1%)
```

A tabela passa a exigir mais XP do que o runtime a partir do nível 5 e a distância aumenta progressivamente.

**Classificação:** DRIFT técnico confirmado.  
**Não concluído:** qual curva é a pretendida. O arquivo de configuração, por não ser consumido, não ganha autoridade apenas por existir.

### 3.4 Drift visual corrigido nesta branch

`js/ui/playerPanelUI.js` calculava a barra como:

```text
xpNeeded visual = nível × 100
```

Isso podia mostrar, por exemplo, 600 XP necessários no nível 6 enquanto o runtime usava 98.

A branch altera o painel para exibir `monster.xpNeeded`, isto é, o valor que a instância/runtime realmente usa.

**Classificação:** BUG/DRIFT de UI, sem alteração de balanceamento.

### 3.5 Ritmo inicial observado pelos números

O starter começa no nível 5.

Na Campina Inicial, os inimigos normais variam aproximadamente entre níveis 1 e 4. Para raridade Comum:

| Nível inimigo | XP base | XP com +5% amizade inicial |
|---:|---:|---:|
| 1 | 17 | 18 |
| 2 | 19 | 20 |
| 3 | 21 | 22 |
| 4 | 23 | 24 |

No nível 5, o runtime pede 85 XP para subir.

Isso equivale aproximadamente a **4–5 vitórias comuns** nessa faixa, dependendo do nível dos inimigos e arredondamentos. No nível 6, com 98 XP necessários, permanecer na mesma faixa representa aproximadamente **5–6 vitórias**.

Esse cálculo é compatível com a percepção do smoke test de progressão relativamente rápida no começo, mas **não prova que o ritmo está errado**.

### 3.6 Duplicação de XP

O caminho atual de vitória Wild injeta `handleVictoryRewards` nas ações de combate. `Progression.Actions.handleVictoryRewards()` usa `enc.rewardsGranted` como guarda idempotente.

Existem helpers legados `distributeWildXP()` e `distributeGroupXP()` ainda presentes em `index.html`, mas a inspeção do caminho atual não encontrou chamada deles no fluxo Wild ativo.

**Resultado:** não foi encontrada evidência técnica, nesta auditoria, de XP sendo concedido duas vezes por vitória Wild.

## 4. Fatos, inferências e decisões

### Fatos verificados

- existem duas curvas distintas de XP necessário: fórmula runtime e tabela não consumida em `progression.config.json`;
- existe ainda uma terceira fórmula que era apenas visual em `playerPanelUI.js`; esta branch a remove;
- starter novo possui amizade 50 e recebe +5% de XP;
- a fórmula de recompensa aumenta com nível do inimigo e raridade;
- o fluxo atual possui guarda contra recompensa duplicada;
- a Campina Inicial gera encontros de níveis baixos enquanto o starter começa no nível 5.

### Inferências

- a combinação de starter no nível 5, requisito de 85 XP e bônus inicial de amizade pode fazer o começo parecer rápido;
- se a intenção de design estava representada na tabela `xpCurve`, a progressão runtime fica progressivamente mais rápida do que aquela proposta a partir do nível 5;
- o contraste tende a se tornar mais perceptível em níveis altos se a comparação for mantida.

### Decisões dependentes do autor

Nenhuma destas deve ser tomada silenciosamente nesta branch:

1. ritmo desejado de progressão (ex.: batalhas médias por nível);
2. se `progression.config.json` representa intenção ainda válida ou artefato histórico;
3. se o bônus de amizade deve acelerar XP desde o valor inicial 50;
4. se XP deve depender apenas do inimigo ou também da diferença de nível jogador/inimigo;
5. eventual nova curva canônica;
6. eventual rebalanceamento da recompensa de batalha.

## 5. Critério para retomar o playtest das passivas

Esta branch não altera passivas, fórmula de combate, PWR, crítico, ENE ou boss.

Antes do primeiro registro formal SP-01:

1. integrar as correções funcionais/UX após revisão humana;
2. confirmar CI verde;
3. refazer smoke test curto: novo jogo com múltiplos jogadores → starters → pular tutorial → Home → mapa → spot → batalha;
4. congelar nova SHA publicada como baseline do playtest;
5. só então iniciar a coleta formal de `shieldhorn`.

A decisão de balanceamento de XP pode permanecer separada se o ritmo não inviabilizar a sessão de passivas.
