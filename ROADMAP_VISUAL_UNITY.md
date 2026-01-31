# 🗺️ Roadmap Visual - Migração para Unity

## Linha do Tempo Completa (14 Semanas)

```
Semana 1-2: FUNDAÇÃO ⚙️
├─ Instalar Unity + Xcode
├─ Criar projeto e estrutura
├─ ScriptableObjects básicos
├─ GameManager
└─ ✅ Checkpoint: Build vazio funciona

Semana 3-4: COMBATE ⚔️
├─ BattleManager
├─ Sistema de dano (d20 + fórmula)
├─ CRIT 20
├─ UI de batalha básica
└─ ✅ Checkpoint: Combate 1v1 funciona

Semana 5-6: UI PRINCIPAL 🎨
├─ Tab system (7 tabs)
├─ Home, Session, Players
├─ Encounter, Therapy
├─ Report, Settings
└─ ✅ Checkpoint: Navegação funciona

Semana 7-8: PROGRESSÃO 📈
├─ Sistema XP e Level Up
├─ Sistema ENE
├─ Habilidades por classe
├─ Team management
└─ ✅ Checkpoint: Monstrinhos evoluem

Semana 9-10: TERAPIA 🎯
├─ TherapyManager
├─ Objectives UI
├─ Sistema de medalhas
├─ Reports terapêuticos
└─ ✅ Checkpoint: Sistema terapia completo

Semana 11-12: POLISH ✨
├─ Sprites e animações
├─ Sons e música
├─ Efeitos visuais
├─ Transições
└─ ✅ Checkpoint: Jogo bonito

Semana 13-14: DEPLOY 🚀
├─ Testes completos
├─ Bug fixes
├─ Build iOS final
├─ TestFlight (opcional)
└─ ✅ DONE: App pronto!
```

---

## Diagrama de Arquitetura

### Estrutura de Pastas Unity

```
MonstrinhmonUnity/
│
├── Assets/
│   │
│   ├── _Project/                    ← TODO SEU CÓDIGO AQUI
│   │   │
│   │   ├── Scripts/
│   │   │   ├── Core/
│   │   │   │   ├── GameEnums.cs          # Enums (classes, raridade)
│   │   │   │   ├── GameConstants.cs      # Constantes do jogo
│   │   │   │   ├── MonsterInstance.cs    # Classe de instância
│   │   │   │   ├── Player.cs             # Classe de jogador
│   │   │   │   └── Session.cs            # Classe de sessão
│   │   │   │
│   │   │   ├── Managers/
│   │   │   │   ├── GameManager.cs        # Singleton principal
│   │   │   │   ├── BattleManager.cs      # Gerencia combate
│   │   │   │   ├── SaveManager.cs        # Save/Load JSON
│   │   │   │   ├── TherapyManager.cs     # Sistema terapêutico
│   │   │   │   ├── AudioManager.cs       # Sons e música
│   │   │   │   └── UIManager.cs          # Gerencia UI
│   │   │   │
│   │   │   ├── Data/
│   │   │   │   ├── MonsterData.cs        # ScriptableObject
│   │   │   │   ├── ClassData.cs          # ScriptableObject
│   │   │   │   ├── ItemData.cs           # ScriptableObject
│   │   │   │   └── SkillData.cs          # ScriptableObject
│   │   │   │
│   │   │   ├── UI/
│   │   │   │   ├── TabController.cs      # Controla tabs
│   │   │   │   ├── BattleUI.cs           # UI de batalha
│   │   │   │   ├── HomeUI.cs             # Home tab
│   │   │   │   ├── PlayersUI.cs          # Players tab
│   │   │   │   └── TherapyUI.cs          # Therapy tab
│   │   │   │
│   │   │   ├── Battle/
│   │   │   │   ├── DamageCalculator.cs   # Cálculos de dano
│   │   │   │   ├── CaptureSystem.cs      # Sistema de captura
│   │   │   │   └── SkillSystem.cs        # Sistema de habilidades
│   │   │   │
│   │   │   └── Utils/
│   │   │       ├── GameEvents.cs         # Event system
│   │   │       └── Extensions.cs         # Helper methods
│   │   │
│   │   ├── Data/                          ← DADOS DO JOGO
│   │   │   ├── Monsters/
│   │   │   │   ├── Luma.asset            # ScriptableObject
│   │   │   │   ├── Trok.asset
│   │   │   │   └── ... (todos monstros)
│   │   │   │
│   │   │   ├── Classes/
│   │   │   │   ├── Guerreiro.asset
│   │   │   │   ├── Mago.asset
│   │   │   │   └── ... (todas classes)
│   │   │   │
│   │   │   └── Items/
│   │   │       ├── OrbeCaptura.asset
│   │   │       └── ... (todos itens)
│   │   │
│   │   ├── Prefabs/                       ← PREFABS REUTILIZÁVEIS
│   │   │   ├── UI/
│   │   │   │   ├── TabButton.prefab
│   │   │   │   ├── MonsterCard.prefab
│   │   │   │   └── DamageNumber.prefab
│   │   │   │
│   │   │   └── VFX/
│   │   │       ├── HitEffect.prefab
│   │   │       └── LevelUpEffect.prefab
│   │   │
│   │   ├── Scenes/                        ← CENAS DO JOGO
│   │   │   ├── Bootstrap.unity           # Cena inicial (carrega managers)
│   │   │   ├── MainMenu.unity            # Menu principal
│   │   │   └── Game.unity                # Jogo principal
│   │   │
│   │   └── Art/                           ← ASSETS VISUAIS/AUDIO
│   │       ├── Sprites/
│   │       │   ├── Monsters/
│   │       │   ├── UI/
│   │       │   └── Icons/
│   │       │
│   │       └── Audio/
│   │           ├── Music/
│   │           └── SFX/
│   │
│   └── TextMesh Pro/                      ← AUTO-GERADO
│
├── Packages/                              ← PACOTES UNITY
│   └── manifest.json
│
└── ProjectSettings/                       ← CONFIGURAÇÕES
```

---

## Fluxo de Dados

### Como os dados fluem no sistema

```
DADOS ESTÁTICOS (ScriptableObjects)
    ↓
MonsterData, ClassData, ItemData, SkillData
    ↓
    ├── Carregados no GameManager.Awake()
    ├── Armazenados em Lists públicas
    └── Acessíveis por qualquer script
    
DADOS RUNTIME (Instâncias)
    ↓
Player, MonsterInstance, Session
    ↓
    ├── Criados dinamicamente
    ├── Gerenciados pelo GameManager
    └── Salvos em JSON via SaveManager

EVENTOS (Event System)
    ↓
GameEvents (static class com C# events)
    ↓
    ├── OnMonsterCaptured
    ├── OnDamageDealt
    ├── OnLevelUp
    └── OnMedalAwarded
    ↓
UI escuta eventos e atualiza
```

---

## Sistemas e Dependências

```
GameManager (Hub Central)
    ├── Depende de: NADA (singleton raiz)
    └── Usado por: TODOS

BattleManager
    ├── Depende de: GameManager, UIManager
    └── Usado por: BattleUI, EncounterUI

SaveManager
    ├── Depende de: GameManager
    └── Usado por: GameManager (auto-save)

TherapyManager
    ├── Depende de: GameManager
    └── Usado por: TherapyUI

AudioManager
    ├── Depende de: NADA
    └── Usado por: Qualquer script (via Instance)

UIManager
    ├── Depende de: GameManager
    └── Usado por: Todas UIs
```

---

## Checklist de Migração por Sistema

### ✅ Sistema de Combate

```
HTML/JS                          Unity/C#
───────────────────────────────────────────────────────
playerAttack(d20Roll)      →    BattleManager.PlayerAttack(int d20Roll)
calculateDamage()          →    DamageCalculator.Calculate()
applyClassAdvantage()      →    ClassData.GetAdvantageMultiplier()
handleCrit20()             →    BattleManager.HandleCrit()
enemyCounterAttack()       →    BattleManager.EnemyTurn()
```

### ✅ Sistema de Captura

```
HTML/JS                          Unity/C#
───────────────────────────────────────────────────────
attemptCapture()           →    CaptureSystem.AttemptCapture()
getCaptureThreshold()      →    GameConstants.CAPTURE_THRESHOLD[]
consumeCaptureItem()       →    Player.inventory.Remove()
addToTeamOrBox()          →    Player.AddMonster()
```

### ✅ Sistema de Progressão

```
HTML/JS                          Unity/C#
───────────────────────────────────────────────────────
addXP(monster, xp)        →    ProgressionSystem.AddXP()
levelUp(monster)          →    MonsterInstance.LevelUp()
calculateXPNeeded()       →    ProgressionSystem.GetXPForLevel()
recalculateStats()        →    MonsterInstance.RecalculateStats()
```

### ✅ Sistema Terapêutico

```
HTML/JS                          Unity/C#
───────────────────────────────────────────────────────
addObjective()            →    TherapyManager.AddObjective()
checkObjective()          →    TherapyManager.ToggleObjective()
calculatePM()             →    TherapyManager.CalculatePM()
awardMedal()              →    TherapyManager.AwardMedal()
```

### ✅ Sistema de UI

```
HTML/JS                          Unity/C#
───────────────────────────────────────────────────────
switchTab(tabName)        →    UIManager.ShowTab(TabType type)
updateHealthBar()         →    BattleUI.UpdateHealth(float percent)
showBattleLog()           →    BattleUI.AddLog(string message)
renderPlayerList()        →    PlayersUI.RefreshList()
```

---

## Milestone Tracking

### Sprint 1: Fundação ⚙️
- [ ] Projeto Unity criado
- [ ] Estrutura de pastas
- [ ] GameEnums.cs
- [ ] GameConstants.cs
- [ ] MonsterData.cs (ScriptableObject)
- [ ] GameManager.cs (básico)
- **Goal**: Build vazio roda no iPad

### Sprint 2: Combate ⚔️
- [ ] BattleManager.cs
- [ ] DamageCalculator.cs
- [ ] Sistema d20
- [ ] Fórmula de dano
- [ ] CRIT 20
- [ ] BattleUI.cs (básica)
- **Goal**: Combate 1v1 funciona

### Sprint 3: UI Core 🎨
- [ ] TabController.cs
- [ ] HomeUI.cs
- [ ] PlayersUI.cs
- [ ] SessionUI.cs
- [ ] EncounterUI.cs
- [ ] Navegação entre tabs
- **Goal**: UI navegável

### Sprint 4: Captura & Inventário 🎯
- [ ] CaptureSystem.cs
- [ ] Inventory system
- [ ] ItemData.cs
- [ ] Team management
- [ ] Box storage
- **Goal**: Captura funciona

### Sprint 5: Progressão 📈
- [ ] ProgressionSystem.cs
- [ ] XP calculation
- [ ] Level up
- [ ] ENE system
- [ ] SkillSystem.cs
- **Goal**: Monstrinhos evoluem

### Sprint 6: Terapia 🎯
- [ ] TherapyManager.cs
- [ ] TherapyUI.cs
- [ ] Objectives
- [ ] Medal system
- [ ] Reports
- **Goal**: Sistema terapia completo

### Sprint 7: Polish ✨
- [ ] Sprites importados
- [ ] Animações básicas
- [ ] AudioManager.cs
- [ ] Sons e música
- [ ] VFX effects
- **Goal**: Jogo visualmente completo

### Sprint 8: Deploy 🚀
- [ ] Testes completos
- [ ] Bug fixing
- [ ] Performance optimization
- [ ] Build iOS
- [ ] TestFlight upload
- **Goal**: App publicado

---

## Medindo Progresso

### Semana 1-2: Fundação (10%)
```
[██░░░░░░░░] 10%
```

### Semana 3-4: Combate (30%)
```
[████████░░] 30%
```

### Semana 5-6: UI (50%)
```
[█████████░] 50%
```

### Semana 7-8: Progressão (65%)
```
[███████████░░] 65%
```

### Semana 9-10: Terapia (80%)
```
[████████████░] 80%
```

### Semana 11-12: Polish (90%)
```
[█████████████░] 90%
```

### Semana 13-14: Deploy (100%)
```
[██████████████] 100% ✅
```

---

## Comparação de Código

### Exemplo: Sistema de Combate

#### HTML/JS Original
```javascript
function playerAttack(d20Roll) {
    const atkBonus = getClassBonus(player, enemy);
    const totalAtk = d20Roll + player.atk + atkBonus;
    
    if (d20Roll === 20) {
        handleCrit();
        return;
    }
    
    if (totalAtk >= enemy.def) {
        const damage = calculateDamage(player, enemy);
        enemy.hp -= damage;
        log(`Causou ${damage} de dano!`);
    } else {
        log("Errou!");
    }
}
```

#### Unity/C# Migrado
```csharp
public BattleResult PlayerAttack(int d20Roll)
{
    BattleResult result = new BattleResult();
    
    int atkBonus = GetClassBonus(playerMonster, enemyMonster);
    int totalAtk = d20Roll + playerMonster.atk + atkBonus;
    
    if (d20Roll == 20)
    {
        result.isCrit = true;
        HandleCrit(ref result);
        return result;
    }
    
    result.hit = totalAtk >= enemyMonster.def;
    
    if (result.hit)
    {
        int damage = DamageCalculator.Calculate(playerMonster, enemyMonster);
        enemyMonster.TakeDamage(damage);
        result.damage = damage;
        result.message = $"Causou {damage} de dano!";
        
        GameEvents.OnDamageDealt?.Invoke(damage, enemyMonster);
    }
    else
    {
        result.message = "Errou!";
    }
    
    return result;
}
```

**Melhorias:**
- ✅ Tipos explícitos
- ✅ Retorna objeto estruturado
- ✅ Eventos desacoplados
- ✅ Separação de responsabilidades

---

## 🎯 Meta Final

**Resultado Esperado:**

```
Monstrinhomon Unity v1.0
├── ✅ App nativo iOS
├── ✅ Performance 60 FPS
├── ✅ Todos sistemas HTML migrados
├── ✅ UI responsiva e bonita
├── ✅ Sons e animações
├── ✅ Save/Load funcionando
└── ✅ Pronto para App Store
```

**Quando:** 14 semanas (3 meses)  
**Esforço:** 80-120 horas  
**Resultado:** Aplicativo profissional 🚀

---

**Última atualização**: 2026-01-31  
**Versão**: 1.0  
**Autor**: GitHub Copilot Agent
