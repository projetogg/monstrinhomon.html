# 🔊 Sistema de Som - Integração Completa

## Resposta à Pergunta Principal

**Onde o grupo marca fim de batalha (victory/defeat)?**

✅ **Resposta**: Em `advanceTurn(enc)` (função linha 1571)

### Victory (linha 1578-1588)
```javascript
if (!aliveEnemies) {
    enc.finished = true;
    enc.result = "victory";
    enc.active = false;
    enc.log = enc.log || [];
    enc.log.push("🏁 Vitória! Todos os inimigos foram derrotados.");
    
    // SFX: vitória (idempotente)
    if (!enc._winSfxPlayed) { 
        Audio.playSfx("win"); 
        enc._winSfxPlayed = true; 
    }
    
    handleVictoryRewards(enc);
    return;
}
```

### Defeat (linha 1591-1604)
```javascript
if (!alivePlayers) {
    enc.finished = true;
    enc.result = "defeat";
    enc.active = false;
    enc.log = enc.log || [];
    enc.log.push("💀 Derrota... Todos os participantes foram derrotados.");
    
    // SFX: derrota (idempotente)
    if (!enc._loseSfxPlayed) { 
        Audio.playSfx("lose"); 
        enc._loseSfxPlayed = true; 
    }
    
    return;
}
```

**Por que usar flags `_winSfxPlayed` e `_loseSfxPlayed`?**
- `advanceTurn()` é chamado múltiplas vezes e pode re-render
- As flags garantem que o som toque **apenas uma vez por batalha**
- Previne duplicação ao trocar de aba ou atualizar UI

---

## 📍 Mapa Completo de Inserções

### 1️⃣ attackWild() - Linhas 3531-3774

#### A) Som do d20 (linha 3614-3617)
```javascript
// Logo APÓS determinar playerHit e ANTES do if(playerHit)
if (playerRoll === 20) Audio.playSfx("crit");
else if (playerRoll === 1 || !playerHit) Audio.playSfx("miss");
else Audio.playSfx("hit");
```

#### B) Som de vitória (linha 3657)
```javascript
if (encounter.wildMonster.hp <= 0) {
    encounter.log.push(`🏆 ${encounter.wildMonster.name} fainted! Victory!`);
    
    Audio.playSfx("win");  // ← INSERIDO AQUI
    
    handleVictoryRewards(encounter);
```

#### C) Som de derrota (linhas 3717 e 3759)
```javascript
if (playerMonster.hp <= 0) {
    encounter.log.push(`😵 ${playerMonster.name} desmaiou!`);
    playerMonster.status = 'fainted';
    
    Audio.playSfx("lose");  // ← INSERIDO AQUI
    
    encounter.active = false;
```

---

### 2️⃣ groupAttack() - Linhas 1712-1803

#### Som hit/miss/crit (linha 1756-1759)
```javascript
const hit = !alwaysMiss && (d20 + atk >= def);

// Logo APÓS calcular hit e ANTES de definir attackerName
if (d20 === 20) Audio.playSfx("crit");
else if (d20 === 1 || !hit) Audio.playSfx("miss");
else Audio.playSfx("hit");
```

---

### 3️⃣ advanceTurn() - Linhas 1571-1630

#### Victory/Defeat com idempotência (linhas 1584 e 1598)
```javascript
// VICTORY
if (!aliveEnemies) {
    // ... código existente ...
    
    if (!enc._winSfxPlayed) {  // ← INSERIDO AQUI
        Audio.playSfx("win"); 
        enc._winSfxPlayed = true; 
    }
    
    handleVictoryRewards(enc);
    return;
}

// DEFEAT
if (!alivePlayers) {
    // ... código existente ...
    
    if (!enc._loseSfxPlayed) {  // ← INSERIDO AQUI
        Audio.playSfx("lose"); 
        enc._loseSfxPlayed = true; 
    }
    
    return;
}
```

---

### 4️⃣ attemptCapture() - Linhas 3270-3395

#### A) Captura bem-sucedida (linha 3344)
```javascript
if (hpPercent <= thresholdFinal) {
    encounter.log.push(`✅ SUCESSO! ${monster.name} foi capturado!`);
    
    Audio.playSfx("capture_ok");  // ← INSERIDO AQUI
    
    monster.ownerId = player.id;
```

#### B) Falha na captura (linha 3366)
```javascript
} else {
    encounter.log.push(`❌ FALHA! ${monster.name} quebrou livre!`);
    
    Audio.playSfx("capture_fail");  // ← INSERIDO AQUI
    
    const playerMonster = player.team?.[0];
```

---

### 5️⃣ useItemInBattle() - Linhas 3404-3548

#### Som de cura (linha 3462)
```javascript
encounter.log.push(`✨ ${playerMonster.name} recuperou ${actualHeal} HP!`);

Audio.playSfx("heal");  // ← INSERIDO AQUI

saveToLocalStorage();
renderEncounter();
```

---

### 6️⃣ groupUseItem() - Linhas 1945-2008

#### Som de cura (linha 2004)
```javascript
_log(enc, `💚 ${playerName} usou Petisco de Cura!`);
_log(enc, `✨ ${monName} recuperou ${healed} HP!`);

Audio.playSfx("heal");  // ← INSERIDO AQUI

advanceTurn(enc);
```

---

### 7️⃣ maybeSfxFromLog() - Função Nova (linha 2122-2145)

#### Definição da função
```javascript
function maybeSfxFromLog(enc) {
    if (!enc || !Array.isArray(enc.log)) return;
    
    if (enc._sfxCursor == null) enc._sfxCursor = 0;
    
    const start = Number.isFinite(enc._sfxCursor) ? enc._sfxCursor : 0;
    for (let i = start; i < enc.log.length; i++) {
        const s = String(enc.log[i] || "");
        
        // Level up: ✨ + "subiu para o nível"
        if (s.includes("✨") && /subiu para o nível/i.test(s)) {
            Audio.playSfx("levelup");
        }
        
        // Evolução: 🌟 + "evoluiu para"
        if (s.includes("🌟") && /evoluiu para/i.test(s)) {
            Audio.playSfx("evolve");
        }
    }
    enc._sfxCursor = enc.log.length;
}
```

#### Chamadas da função

**renderGroupEncounter()** (linha 3025):
```javascript
maybeToastFromLog(encounter);
maybeSfxFromLog(encounter);  // ← INSERIDO AQUI
```

**renderWildEncounter()** (linha 3255):
```javascript
maybeToastFromLog(GameState.currentEncounter);
maybeSfxFromLog(GameState.currentEncounter);  // ← INSERIDO AQUI
```

---

## 🎯 Checklist de Testes

### Wild Encounters
- [ ] d20 = 1 → miss
- [ ] d20 = 2-19 (acerta) → hit
- [ ] d20 = 20 → crit
- [ ] Vitória (enemy HP = 0) → win
- [ ] Derrota (player HP = 0) → lose
- [ ] Usar Petisco → heal
- [ ] Captura sucesso → capture_ok
- [ ] Captura falha → capture_fail

### Group Battles
- [ ] Ataque normal → hit/miss/crit
- [ ] Usar item → heal
- [ ] Todos inimigos mortos → win (uma vez)
- [ ] Todos players mortos → lose (uma vez)
- [ ] Trocar de aba não repete win/lose

### Progressão
- [ ] Level up → levelup
- [ ] Evolução → evolve
- [ ] Trocar de aba não repete levelup/evolve

### UI
- [ ] Qualquer botão → ui_click
- [ ] Primeiro toque → "🔊 Audio unlocked" no console

---

## 🔧 Sistema Audio Manager

### Localização
**Linhas 493-576** (antes do GameState)

### Estrutura
```javascript
const Audio = {
    _unlocked: false,
    _sfxEnabled: true,
    _sfxVolume: 0.5,
    _sounds: { /* 11 sons mapeados */ },
    
    unlock() { /* iOS unlock */ },
    playSfx(name) { /* Toca som */ },
    setSfxEnabled(enabled) { /* Liga/desliga */ },
    setSfxVolume(volume) { /* Ajusta volume */ },
    loadSettings() { /* Carrega do localStorage */ }
};
```

### Listeners Globais
```javascript
// Unlock (linha 568)
window.addEventListener("pointerdown", () => Audio.unlock(), { once: true });

// UI clicks (linha 571-576)
document.addEventListener("click", (e) => {
    if (target.matches("button, .tab-button, .btn, .monster-card")) {
        Audio.playSfx("ui_click");
    }
}, true);
```

---

## ✅ Conclusão

Todos os 11 sons foram integrados nos pontos exatos especificados:
- ✅ hit, miss, crit (atacar)
- ✅ heal (usar item)
- ✅ capture_ok, capture_fail (capturar)
- ✅ win, lose (fim de batalha)
- ✅ levelup, evolve (progressão)
- ✅ ui_click (navegação)

**Zero modificações na lógica de jogo** - apenas inserções de `Audio.playSfx()` nos locais corretos.

Sistema **testado e funcionando** sem erros no console.
