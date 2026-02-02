# Monstrinhomon — Agent Instructions

## Visão geral
Este repositório contém o jogo Monstrinhomon (RPG infantil estilo "monstros capturáveis" + turnos).
O jogo NÃO usa elementos (fogo/água/etc). O sistema é baseado em CLASSES.

## Regras oficiais do sistema (não mudar sem atualizar docs + dados)

### Classes
- Monstrinhos têm CLASSE (ex.: Guerreiro, Mago, Curandeiro, Bárbaro, Ladino, Bardo, Caçador).
- Jogadores também têm CLASSE.

### Captura vs batalha (regra-chave)
- **CAPTURA**: qualquer jogador pode capturar Monstrinhos de QUALQUER classe.
- **BATALHA**: o jogador só pode USAR em combate Monstrinhos da MESMA classe do jogador.
  - Objetivo: incentivar trocas entre jogadores.
- **Exceção**: somente "Mestre/Debug" pode liberar cross-class em batalha.

### Dano (aprovado)
- **Acerto**: d20 + ATK >= DEF
- **Dano**: max(1, ATK + PODER - DEF)

### Captura (SEM dado)
- Captura é **determinística** (sem rolagem).
- Critério base: HP% do alvo + raridade + bônus do item de captura.
- Regra: captura bem-sucedida se HP% <= Threshold_final
- **Threshold_final** = min(0.95, (Base_threshold_por_raridade + Item_bonus + Status_bonus) * capture_multiplier)
- Status_bonus inicialmente = 0 (se existir status depois, criar tabela explícita).

### Vantagens de Classe
O sistema possui um ciclo de vantagens entre as classes:
- Guerreiro > Ladino
- Ladino > Mago
- Mago > Bárbaro
- Bárbaro > Caçador
- Caçador > Bardo
- Bardo > Curandeiro
- Curandeiro > Guerreiro

Quando um Monstrinho ataca outro com vantagem de classe:
- +2 bônus de ataque
- +10% multiplicador de dano

Quando ataca em desvantagem:
- -2 penalidade de ataque
- -10% multiplicador de dano

## Dados do jogo

### Localização e formato
- Dados ficam em `/data` (CSV/JSON).
- IDs são **imutáveis e únicos** (ex.: MON_001, ITM_001, SKL_001).
- **Nunca renomear IDs**. Se mudar algo, criar novo ID e manter o antigo para compatibilidade.

### Estrutura de dados

#### Monstrinhos (catalog)
- `id`: identificador único (ex: m_luma, m_trok)
- `name`: nome do Monstrinho
- `class`: classe (Mago, Guerreiro, Curandeiro, Bárbaro, Ladino, Bardo, Caçador)
- `rarity`: raridade (Comum, Incomum, Raro, Místico, Lendário)
- `baseHp`: HP base no nível 1

#### Classes de Jogador (playerClasses)
- `id`: identificador único (ex: pc_mago, pc_guerreiro)
- `name`: nome da classe
- `allowed`: array de classes de Monstrinhos que podem ser usadas em batalha

#### Itens (ITEMS)
- `name`: nome do item
- `type`: tipo (captura, cura, tatico)
- `bonus`: bônus de captura (se aplicável)
- `heal`: percentual de cura (se aplicável)
- `fleeBonus`: bônus de fuga (se aplicável)
- `shield`: redução de dano (se aplicável)
- `reroll`: permite re-rolagem (se aplicável)

## Padrões de código

### Linguagem e estilo
- Preferir **JS simples** (sem frameworks) e código legível.
- Comentários e mensagens em **PT-BR**.
- Evitar dependências pesadas; preferir arquivos pequenos.
- Usar nomes de variáveis descritivos em inglês ou português consistente.

### Estrutura do código
- Funções devem ter uma responsabilidade clara.
- Evitar duplicação de código.
- Manter funções pequenas e focadas.
- Adicionar comentários quando a lógica for complexa.

### Ao implementar algo novo
Sempre atualizar também:
1. A validação de dados (IDs, campos obrigatórios)
2. A tela/fluxo de teste (primeira quest + primeiro combate)
3. Documentação relevante (se houver)

## Como validar mudanças

### Fluxo mínimo obrigatório
Não quebrar o fluxo mínimo:
1. Iniciar jogo
2. Primeira quest
3. Primeiro combate
4. Recompensa + tentativa de captura

### Testes
- Garantir que o jogo abre em navegador (`index.html`) sem erros de console.
- Testar criação de nova sessão.
- Testar criação de jogadores.
- Testar combate básico.
- Testar sistema de captura (determinístico).

### Console do navegador
- Sempre verificar console para erros JavaScript.
- Não deixar warnings não resolvidos.

## Segurança / limites

### Segredos e credenciais
- **Nunca inserir chaves/segredos no repo**.
- Não commitar tokens, API keys ou senhas.
- Usar variáveis de ambiente quando necessário.

### Ações destrutivas
- **Não executar ações destrutivas** (deletar pastas/dados) sem confirmar no PR.
- Sempre fazer backup antes de mudanças significativas.
- Usar git para rastrear mudanças.

## Sistema de Terapia

O jogo possui um sistema de terapia para uso terapêutico com crianças:

### Objetivos Terapêuticos
- Cada objetivo tem um peso (w) que determina pontos de medalha (pm).
- Tipos: BINARY (0 ou 1) ou contínuo.
- Exemplos: "Esperou a vez", "Gentileza", "Controle de impulso", "Elogiou colega".

### Sistema de Medalhas
- Bronze: 5 pontos
- Prata: 12 pontos
- Ouro: 25 pontos

### Recompensas
- Medalhas concedem moeda "pós-vida" (afterlife).
- Bronze: 1 moeda, Prata: 3 moedas, Ouro: 7 moedas.
- XP adicional para Monstrinhos ativos.

## Multiplicadores e Constantes

### Raridade
```javascript
RARITY_PWR = {
  Comum: 1.00,
  Incomum: 1.08,
  Raro: 1.18,
  Místico: 1.32,
  Lendário: 1.50
}

RARITY_XP = {
  Comum: 1.00,
  Incomum: 1.05,
  Raro: 1.10,
  Místico: 1.15,
  Lendário: 1.25
}
```

### Captura Base (%)
```javascript
CAPTURE_BASE = {
  Comum: 60,
  Incomum: 45,
  Raro: 30,
  Místico: 18,
  Lendário: 10
}
```

### Fuga Base (%)
```javascript
FLEE_BASE = {
  Comum: 10,
  Incomum: 12,
  Raro: 15,
  Místico: 18,
  Lendário: 25
}
```

## Progressão e Níveis

### XP para próximo nível
Fórmula: `Math.round(40 + 6*L + 0.6*(L*L))`

Onde L é o nível atual.

### Level Up
- HP máximo aumenta: `hpMax * 1.04 + 2`
- HP atual aumenta proporcionalmente
- Limite máximo: nível 100

### Multiplicador de Nível
```javascript
levelMult(attL, defL, expo) {
  const ratio = attL / defL;
  return clamp(Math.pow(ratio, expo), 0.05, 1.80);
}
```

## Configurações

### Constantes do sistema
- `levelExpo`: 1.5 (exponente para cálculo de nível)
- `enemyHealThreshold`: 0.30 (30% HP para inimigo considerar curar)
- `enemyHealChance`: 0.60 (60% chance de curar quando abaixo do threshold)
- `bossHealChance`: 0.85 (85% para bosses)

### DC de Fuga
- Normal: 12
- Intimidating: 16
- Elite: 18

### XP de Batalha Base
- `battleXpBase`: 15

## Convenções Git

### Commits
- Mensagens em português.
- Commits atômicos e descritivos.
- Usar prefixos: ✨ (nova feature), 🐛 (bugfix), 📝 (docs), ♻️ (refactor), ✅ (testes)

### Pull Requests
- Descrever mudanças claramente.
- Incluir capturas de tela se houver mudanças visuais.
- Referenciar issues relacionadas.

## Arquitetura

### Storage
- Usa `localStorage` para persistência.
- Chave: `mm_mvp_v1`
- Estrutura: JSON com deep merge para compatibilidade

### Estado Global
```javascript
state = {
  therapist: boolean,
  ui: { tab, selectedPlayer, encounterMode, battleKind },
  config: { ... },
  data: {
    sessions: [],
    activeSessionId: string,
    players: [],
    playerClasses: [],
    catalog: [],
    instances: [],
    therapyObjectives: []
  }
}
```

### Funções Principais
- `load()`: carrega estado do localStorage
- `save()`: salva estado no localStorage
- `render()`: atualiza UI baseado no estado
- `createInstance()`: cria instância de Monstrinho
- `addXP()`: adiciona XP e processa level up
- `computeDamage()`: calcula dano de ataque
- `captureChance()`: calcula chance de captura
- `monsterFleeChance()`: calcula chance de fuga

## Debugging

### Modo Debug
- Terapeuta pode habilitar "Modo Terapeuta" no header.
- Permite funcionalidades especiais para testes.

### Console Helpers
- `state`: acessa estado global
- `save()`: força salvamento
- `render()`: força re-render

## Melhores Práticas

1. **Sempre testar no navegador** após mudanças
2. **Verificar localStorage** para entender estado
3. **Usar console.log** para debug, remover antes do commit
4. **Manter compatibilidade** com dados salvos
5. **Documentar regras novas** neste arquivo
6. **Não quebrar fluxo existente** sem discussão prévia
7. **Preferir simplicidade** sobre complexidade
8. **Código legível** > código "inteligente"
9. **Testar edge cases** (nível 1, nível 100, HP 0, etc)
10. **Validar inputs** do usuário

## Glossário

- **MI**: Monster Instance (instância de Monstrinho)
- **PM**: Pontos de Medalha
- **HP**: Health Points
- **XP**: Experience Points
- **DC**: Difficulty Class
- **ATK**: Attack
- **DEF**: Defense
- **d20**: Dado de 20 faces (físico, criança rola)

## Referências Rápidas

### IDs Padrão
- Sessão: `sess_*`
- Jogador: `player_*`
- Instância de Monstrinho: `mi_*`
- Encontro: `enc_*`

### Classes Disponíveis
1. Mago
2. Curandeiro
3. Guerreiro
4. Bárbaro
5. Ladino
6. Bardo
7. Caçador

### Raridades
1. Comum
2. Incomum
3. Raro
4. Místico
5. Lendário

---

**Última atualização**: 2026-01-25
**Versão**: 1.0.0
