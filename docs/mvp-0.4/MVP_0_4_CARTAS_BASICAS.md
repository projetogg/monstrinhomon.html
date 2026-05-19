# MVP 0.4 — Cartas Básicas e Interface de Decisão

## 1) Objetivo do MVP 0.4

Adicionar uma camada inicial de cartas ao Wild Loop, com UX simples e segura, mantendo intacto o fluxo protegido do MVP 0.3:

`novo jogo → classe/starter → wild battle → ataque/captura → recompensa → save → continue`

## 2) Escopo IN (obrigatório)

1. Interface inicial de cartas no contexto de batalha wild.
2. Exibição de **mão simples** de cartas (sem deckbuilder).
3. Uma carta básica por classe.
4. Carta executa ação existente (preferencial) ou action mínima equivalente segura.
5. Exibir custo de ENE de forma visível.
6. Bloquear uso quando ENE insuficiente, com explicação clara para criança.
7. Manter ataque básico/fallback funcional.
8. Preservar Wild Loop sem regressão.
9. Adicionar testes automatizados mínimos de cartas básicas.
10. Não quebrar save, captura, starter, classe, XP, continue.

## 3) Escopo OUT (proibido neste MVP)

- Deckbuilding completo.
- Cartas raras/míticas com efeitos compostos.
- Sistema de compra/crafting de cartas.
- Boss cards, PvP, group battle cards.
- Rebalanceamento amplo de dano/XP.
- Mudanças estruturais em persistência/salvamento.

## 4) Modelo canônico de carta (proposto)

O exemplo abaixo usa o mesmo padrão de IDs da matriz de cartas básicas por classe: `CARD_<CLASSE_PTBR>_<NOME_CURTO>`.

```json
{
  "id": "CARD_GUERREIRO_GOLPE_FIRME",
  "name": "Golpe Firme",
  "class": "Guerreiro",
  "cost": 1,
  "type": "attack",
  "target": "enemy",
  "childText": "Ataque um inimigo com um golpe seguro.",
  "technicalEffect": "Executa ataque básico com pequeno modificador ou usa ação base existente.",
  "runtimeAction": "basic_attack",
  "mvp": true
}
```

## 5) Cartas básicas por classe (propostas)

> Observação: proposta documental, **não implementar nesta tarefa**.

| Classe | id | Nome | ENE | Tipo | Efeito esperado | Texto infantil | Efeito técnico aproximado | Action alvo | Risco de balanceamento | Teste necessário |
|---|---|---|---:|---|---|---|---|---|---|---|
| Guerreiro | `CARD_GUERREIRO_GOLPE_FIRME` | Golpe Firme | 1 | attack | Causa dano confiável | “Um golpe forte e seguro!” | Dispara ataque básico; sem crítico extra no MVP | `basic_attack` | Baixo | carta consome ENE e aplica dano >0 |
| Mago | `CARD_MAGO_FAISCA_ARCANA` | Faísca Arcana | 1 | attack | Dano mágico simples | “Uma faísca brilhante no inimigo!” | Ataque básico com texto/label mágico | `basic_attack` | Baixo | execução e log coerente com classe |
| Curandeiro | `CARD_CURANDEIRO_TOQUE_CALMO` | Toque Calmo | 1 | heal | Cura pequena no ativo | “Um toque que acalma e recupera.” | Reuso de ação de cura já existente ou cura mínima segura | `basic_heal` (ou equivalente) | Médio (sobrevida) | não ultrapassar HP máx; ENE decrementa |
| Bárbaro | `CARD_BARBARO_ARRANQUE_BRUTO` | Arranque Bruto | 2 | attack | Ataque mais pesado | “Ataque com toda a coragem!” | Ataque básico com pequeno bônus de dano controlado | `basic_attack_plus` (mínima) | Médio | validação de teto de dano e custo 2 |
| Ladino | `CARD_LADINO_PASSO_RAPIDO` | Passo Rápido | 1 | utility | Ganha vantagem leve no próximo ataque | “Movimento rápido e esperto!” | Marca buff curto (+atk situacional) ou reroll seguro | `quick_step` (mínima) | Médio | buff aplica 1 turno e expira |
| Bardo | `CARD_BARDO_CANCAO_FOCO` | Canção do Foco | 1 | support | Incentivo ao time/ativo | “Uma canção para jogar melhor!” | Pequeno buff de precisão/ataque sem empilhar infinito | `focus_song` (mínima) | Médio | bloqueio de stack abusivo |
| Caçador | `CARD_CACADOR_MIRA_CUIDADOSA` | Mira Cuidadosa | 1 | attack | Ataque preciso | “Respira fundo e acerta o alvo!” | Ataque básico com bônus de acerto moderado | `aimed_attack` (mínima) | Baixo/Médio | melhora taxa de acerto sem quebrar DEF |
| Animalista | `CARD_ANIMALISTA_LACO_AMIGO` | Laço Amigo | 1 | capture_support | Facilita tentativa de captura | “Conecte-se com o monstrinho!” | Bônus temporário controlado no threshold de captura | `capture_boost` (mínima) | Médio/Alto | não permitir captura sem orb; bônus limitado |

## 6) Diretrizes técnicas para implementação futura

1. **Priorizar reuso** de ações já existentes (`basic_attack`, cura existente, etc.).
2. Se nova action mínima for necessária, manter isolada, testável e sem efeito colateral global.
3. Evitar alteração de fórmula oficial de dano/captura.
4. Mensagens infantis claras em PT-BR para erro de ENE insuficiente.
5. UI deve sempre preservar fallback de ataque básico.

## 7) Arquivos provavelmente impactados no próximo PR (previsão)

- UI de combate/ações (camada de exibição e clique de carta).
- Estado transitório de batalha para mão/custo/ENE da jogada.
- Registro de ações/log de batalha para feedback da carta.
- Testes de integração do Wild Loop + testes unitários da camada de cartas.
- Documentação de regras do MVP 0.4.

> Nesta entrega documental, nenhuma alteração nesses módulos foi realizada.

## 8) Riscos e mitigação

- **Risco de regressão no Wild Loop** → Mitigar com suíte mínima dedicada + smoke.
- **Risco de quebra de save** → Não persistir estrutura complexa de deck no MVP 0.4.
- **Risco de power creep** → Custos baixos e efeitos modestos; sem stacking livre.
- **Risco de UX confusa infantil** → Texto curto, ícone de ENE e motivo explícito de bloqueio.
- **Risco de escopo expandir** → Travar fora de escopo em PR checklist.

## 9) Critérios de aceite de escopo (documental)

- [x] 8 classes listadas com 1 carta básica cada.
- [x] Campos mínimos de carta definidos.
- [x] Diretriz de ENE insuficiente explicitada.
- [x] Wild Loop protegido como restrição central.
- [x] Fora de escopo explícito para evitar overbuild.