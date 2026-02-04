/**
 * GROUP COMBAT UI - Renderização e Feedback Visual
 * 
 * PR5C: Implementação real extraída de index.html
 * CAMADA 3: Painel de Ações Contextual + Seleção de Alvo
 * 
 * Funções que manipulam DOM, animações e áudio
 * Recebem dependências por parâmetro (dependency injection)
 */

import * as GroupCore from './groupCore.js';
import * as TargetSelection from '../ui/targetSelection.js';

/**
 * PR5C: Renderiza UI completa do encounter de grupo
 * 
 * Extraído de: index.html renderGroupEncounter() (linhas 5088-5275)
 * 
 * @param {HTMLElement} panel - Elemento DOM onde renderizar
 * @param {object} encounter - Dados do encounter
 * @param {object} deps - Dependências injetadas
 */
export function renderGroupEncounterPanel(panel, encounter, deps) {
    const { state, core, helpers } = deps;
    
    if (!encounter) return;
    
    const actor = core.getCurrentActor(encounter);
    const isPlayerTurn = actor && actor.side === 'player';
    
    let html = '<div class="encounter-panel">';
    html += helpers.renderTutorialBanner(encounter);
    html += '<h3>⚔️ Batalha em Grupo</h3>';
    
    // CAMADA 2: Banner de Turno FIXO E DESTACADO
    // Banner sempre visível, nunca desaparece
    if (actor && !encounter.finished) {
        const isPlayerPhase = actor.side === 'player';
        const bannerColor = isPlayerPhase ? '#4CAF50' : '#f44336';
        const bannerText = isPlayerPhase ? '🟢 VEZ DOS JOGADORES' : '🔴 VEZ DOS INIMIGOS';
        const roundText = `Rodada ${encounter.turn?.round || 1}`;
        
        html += `<div class="turn-banner" style="background: ${bannerColor}; color: white; padding: 15px; margin: 15px 0; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">`;
        html += `${bannerText} <span style="opacity: 0.9; font-size: 14px; margin-left: 10px;">${roundText}</span>`;
        html += `</div>`;
    }
    
    // Last d20 roll badge
    if (encounter.lastRoll) {
        const lr = encounter.lastRoll;
        const badgeClass = lr.type === 'crit' ? 'crit' : lr.type === 'fail' ? 'fail' : '';
        const emoji = lr.type === 'crit' ? '🌟' : lr.type === 'fail' ? '💥' : '🎲';
        html += `<div class="d20-badge ${badgeClass}">${emoji} ${lr.name}: ${lr.roll} ${lr.type === 'crit' ? '(CRIT!)' : lr.type === 'fail' ? '(FALHA!)' : ''}</div>`;
    }
    
    // Participantes (jogadores)
    html += '<div class="my-15">';
    html += '<h4>👥 Participantes:</h4>';
    for (const pid of (encounter.participants || [])) {
        const p = state.players.find(x => x.id === pid);
        if (!p) continue;
        
        const mon = p.team?.[0];
        if (!mon) continue;
        
        // Garantir campos de XP
        helpers.ensureXpFields(mon);
        
        const hp = Number(mon.hp) || 0;
        const hpMax = Number(mon.hpMax) || 1;
        const hpPercent = Math.floor((hp / hpMax) * 100);
        
        const xp = Math.max(0, Number(mon.xp) || 0);
        const xpNeeded = Math.max(1, Number(mon.xpNeeded) || helpers.calcXpNeeded(mon.level));
        const xpPct = Math.max(0, Math.min(100, Math.floor((xp / xpNeeded) * 100)));
        
        const isCurrent = actor && actor.side === 'player' && actor.id === pid;
        
        // CAMADA 2: Destaque Visual Forte + Apagado quando não é a vez
        let cardStyle = '';
        if (isCurrent) {
            // É o turno deste jogador: DESTAQUE FORTE
            cardStyle = 'border: 4px solid #4CAF50; box-shadow: 0 0 20px rgba(76, 175, 80, 0.5); opacity: 1; transform: scale(1.02);';
        } else if (isPlayerTurn) {
            // É turno dos jogadores, mas não é este: levemente apagado
            cardStyle = 'border: 1px solid #ddd; opacity: 0.7;';
        } else {
            // É turno dos inimigos: todos jogadores apagados
            cardStyle = 'border: 1px solid #ddd; opacity: 0.5;';
        }
        
        html += `<div id="grpP_${pid}" class="group-participant-box" style="${cardStyle} transition: all 0.3s ease; padding: 12px; border-radius: 8px; margin: 8px 0; background: white;">`;
        html += `<strong>${p.name || p.nome}</strong> (${p.class})`;
        html += `<br>${mon.name || mon.nome} - Nv ${mon.level}`;
        html += `<br>HP: ${hp}/${hpMax} (${hpPercent}%)`;
        
        // PR12B: Show equipped item (inline text format)
        if (mon.heldItemId && window.Data && window.Data.getItemById) {
            const itemDef = window.Data.getItemById(mon.heldItemId);
            if (itemDef) {
                const bonuses = [];
                if (itemDef.stats?.atk > 0) bonuses.push(`+${itemDef.stats.atk} ATK`);
                if (itemDef.stats?.def > 0) bonuses.push(`+${itemDef.stats.def} DEF`);
                
                let itemLabel = itemDef.name;
                if (bonuses.length > 0) {
                    itemLabel += ` (${bonuses.join(', ')})`;
                }
                
                // Mostrar chance de quebra se break.enabled
                if (itemDef.break?.enabled) {
                    const chancePercent = Math.round(itemDef.break.chance * 100);
                    itemLabel += ` | Quebra: ${chancePercent}%`;
                }
                
                html += `<br><small>⚔️ ${itemLabel}</small>`;
            }
        } else if (!mon.heldItemId) {
            html += `<br><small>⚔️ Sem item</small>`;
        }
        
        html += `<div class="progress-bar mt-6">`;
        html += `<div class="progress-fill xp" style="width:${xpPct}%"></div>`;
        html += `</div>`;
        html += `<div class="small mt-5">XP: ${xp}/${xpNeeded} (${xpPct}%)</div>`;
        html += `</div>`;
    }
    html += '</div>';
    
    // Inimigos (CAMADA 3: Suporte para seleção de alvo)
    html += '<div class="my-15">';
    html += '<h4>👹 Inimigos:</h4>';
    for (let i = 0; i < (encounter.enemies || []).length; i++) {
        const e = encounter.enemies[i];
        if (!e) continue;
        
        const hp = Number(e.hp) || 0;
        const hpMax = Number(e.hpMax) || 1;
        const hpPercent = Math.floor((hp / hpMax) * 100);
        const isCurrent = actor && actor.side === 'enemy' && actor.id === i;
        const isDead = hp <= 0;
        
        // CAMADA 2: Destaque Visual Forte + Apagado quando não é a vez
        let cardStyle = '';
        let cursorStyle = 'cursor: default;';
        let clickHandler = '';
        
        if (isCurrent) {
            // É o turno deste inimigo: DESTAQUE FORTE
            cardStyle = 'border: 4px solid #f44336; box-shadow: 0 0 20px rgba(244, 67, 54, 0.5); opacity: 1; transform: scale(1.02);';
        } else if (!isPlayerTurn) {
            // É turno dos inimigos, mas não é este: levemente apagado
            cardStyle = 'border: 1px solid #ddd; opacity: 0.7;';
        } else {
            // É turno dos jogadores: todos inimigos apagados
            cardStyle = 'border: 1px solid #ddd; opacity: 0.5;';
        }
        
        // CAMADA 3: Visual e interação para modo de seleção de alvo
        if (isDead) {
            // Morto: opacidade 0.4, nunca clicável
            cardStyle += ' opacity: 0.4;';
        } else if (isPlayerTurn && !isDead) {
            // Vivo durante turno do jogador: potencialmente clicável
            // O visual dinâmico será aplicado via JS quando entrar em target mode
            cursorStyle = 'cursor: pointer;';
            clickHandler = ` onclick="handleEnemyClick(${i})"`;
            cardStyle += ' transition: all 0.3s ease;';
        }
        
        html += `<div id="grpE_${i}" class="enemy-participant-box" style="${cardStyle} ${cursorStyle} padding: 12px; border-radius: 8px; margin: 8px 0; background: white;"${clickHandler}>`;
        html += `<strong>${e.name || e.nome}</strong> - Nv ${e.level}`;
        html += `<br>HP: ${hp}/${hpMax} (${hpPercent}%)`;
        html += `<br>SPD: ${e.spd} | ATK: ${e.atk} | DEF: ${e.def}`;
        html += `</div>`;
    }
    html += '</div>';
    
    // CAMADA 3: Painel de Ações Contextual
    html += renderActionPanel(encounter, actor, isPlayerTurn, state, helpers);
    
    // Mensagem de fim com recompensas
    if (encounter.finished) {
        const resultColor = encounter.result === 'victory' ? '#4CAF50' : '#f44336';
        html += `<div class="battle-result" style="background: ${resultColor};">`;
        html += `<h3>${encounter.result === 'victory' ? '🏁 VITÓRIA!' : '💀 DERROTA'}</h3>`;
        
        // Recompensas na vitória
        if (encounter.result === 'victory') {
            html += '<div class="mt-10 p-10 border-radius-5 bg-white-20">';
            html += '<strong>💰 Recompensas:</strong><br>';
            
            // Dinheiro dividido
            const totalCoins = Math.floor(Math.random() * 31) + 30; // 30-60
            const coinsPerPlayer = Math.floor(totalCoins / encounter.participants.length);
            
            for (const pid of encounter.participants) {
                const p = state.players.find(pl => pl.id === pid);
                if (p) {
                    p.coins = (p.coins || 0) + coinsPerPlayer;
                    html += `${p.name}: +${coinsPerPlayer} moedas<br>`;
                }
            }
            
            html += '<br><em>ℹ️ XP será implementado na Feature 3.3</em>';
            html += '</div>';
            helpers.saveToLocalStorage();
        }
        
        html += `</div>`;
        html += '<button class="btn btn-secondary" onclick="GameState.currentEncounter = null; saveToLocalStorage(); renderEncounter();">Fechar</button>';
    }
    
    // Log de combate
    html += '<div class="mt-20">';
    html += '<h4>📜 Log de Combate:</h4>';
    html += '<div class="bg-gray p-10 border-radius-5 max-h-300 overflow-auto">';
    const logs = encounter.log || [];
    for (let i = Math.max(0, logs.length - 20); i < logs.length; i++) {
        html += `<div>${logs[i]}</div>`;
    }
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    panel.innerHTML = html;
    
    // Exibir toasts para eventos importantes (level up, evolução)
    helpers.maybeToastFromLog(encounter);
    
    // Feature 4.4: Tocar sons para level up e evolução
    helpers.maybeSfxFromLog(encounter);
}

/**
 * PR5C: Exibe feedback visual de dano em combate de grupo
 * 
 * @param {string} target - ID do elemento DOM (ex: 'grpE_0', 'grpP_player1')
 * @param {number} damage - Quantidade de dano
 * @param {boolean} isCrit - Se foi crítico
 */
export function showDamageFeedback(target, damage, isCrit) {
    setTimeout(() => {
        if (typeof window.showFloatingText === 'function') {
            window.showFloatingText(target, `-${damage}`, isCrit ? 'crit' : 'damage');
        }
        if (typeof window.flashTarget === 'function') {
            window.flashTarget(target, isCrit ? 'crit' : 'hit');
        }
    }, 50);
}

/**
 * PR5C: Exibe feedback visual de erro (miss) em combate de grupo
 * 
 * @param {string} target - ID do elemento DOM
 */
export function showMissFeedback(target) {
    setTimeout(() => {
        if (typeof window.flashTarget === 'function') {
            window.flashTarget(target, 'fail');
        }
    }, 50);
}

/**
 * PR5C: Toca feedback de áudio para ataque em grupo
 * 
 * @param {number} d20Roll - Resultado do d20
 * @param {boolean} hit - Se acertou
 * @param {boolean} isCrit - Se foi crítico
 * @param {object} audio - Objeto Audio { playSfx }
 */
export function playAttackFeedback(d20Roll, hit, isCrit, audio) {
    if (isCrit) {
        audio.playSfx("crit");
    } else if (!hit) {
        audio.playSfx("miss");
    } else {
        audio.playSfx("hit");
    }
}

/**
 * PR5C: Renderiza encounter (wrapper para escolher tipo)
 * 
 * @param {object} deps - Dependências injetadas
 */
export function render(deps) {
    const { state } = deps;
    const panel = document.getElementById('encounterPanel');
    if (!panel) return;
    
    const encounter = state.currentEncounter;
    
    if (!encounter || !encounter.active) {
        if (typeof window.hideEl === 'function') {
            window.hideEl(panel);
        }
        return;
    }
    
    if (typeof window.showEl === 'function') {
        window.showEl(panel);
    }
    
    if (encounter.type === 'group_trainer' || encounter.type === 'boss') {
        renderGroupEncounterPanel(panel, encounter, deps);
    }
}

/**
 * CAMADA 3: Renderiza painel de ações contextual
 * 
 * ESTADO A (Não é sua vez): Mostra "Aguarde sua vez", zero botões
 * ESTADO B (É sua vez): Mostra botões dinamicamente baseado em validações
 * 
 * Ordem fixa dos botões: Atacar → Habilidade → Item → Fugir → Passar
 * Regra: Nunca renderizar botão disabled. Se não pode usar, não existe.
 * 
 * @param {object} encounter - Encounter atual
 * @param {object|null} actor - Ator atual (getCurrentActor result)
 * @param {boolean} isPlayerTurn - Se é turno de algum jogador
 * @param {object} state - GameState
 * @param {object} helpers - Helper functions
 * @returns {string} HTML do painel de ações
 */
function renderActionPanel(encounter, actor, isPlayerTurn, state, helpers) {
    // Se batalha terminou, não mostrar painel
    if (encounter.finished) {
        return '';
    }
    
    let html = '';
    
    // ESTADO A: NÃO É SUA VEZ
    if (!isPlayerTurn || !actor || actor.side !== 'player') {
        html += '<div class="action-panel my-15 p-15 bg-light-gray border-radius-5" style="text-align: center;">';
        html += '<h4 style="color: #666; font-size: 18px;">⏳ Aguarde sua vez</h4>';
        html += '</div>';
        return html;
    }
    
    // ESTADO B: É SUA VEZ - Montar painel dinamicamente
    html += '<div class="action-panel my-15 p-15 bg-light-gray border-radius-5">';
    html += '<h4>⚔️ Suas Ações:</h4>';
    
    // Coletar dados do jogador atual
    const player = state.players.find(p => p.id === actor.id);
    const mon = player?.team?.[0];
    
    if (!player || !mon) {
        html += '<div class="color-error">❌ Erro: Jogador ou monstrinho não encontrado</div>';
        html += '</div>';
        return html;
    }
    
    const hp = Number(mon.hp) || 0;
    const hpMax = Number(mon.hpMax) || 1;
    const isAlive = hp > 0;
    
    // Container de botões
    html += '<div class="d-flex flex-gap-10 flex-wrap mt-10">';
    
    // 1. BOTÃO ATACAR (sempre visível se monstrinho vivo)
    if (isAlive) {
        html += '<button class="btn btn-large btn-danger" onclick="enterAttackMode()" style="min-width: 120px;">';
        html += '⚔️ Atacar';
        html += '</button>';
    }
    
    // 2. BOTÃO HABILIDADE (se tiver skill disponível)
    const skillIds = helpers.getSkillsArray(mon);
    let hasUsableSkill = false;
    
    if (isAlive && skillIds && skillIds.length > 0) {
        for (let idx = 0; idx < skillIds.length; idx++) {
            const skillId = skillIds[idx];
            const skill = helpers.getSkillById(skillId);
            if (skill && helpers.canUseSkillNow(skill, mon)) {
                if (!hasUsableSkill) {
                    // Primeiro skill: renderizar botão dropdown ou botão direto
                    hasUsableSkill = true;
                    html += '<button class="btn btn-large btn-info" onclick="enterSkillMode(0)" style="min-width: 120px;">';
                    html += '✨ Habilidade';
                    html += '</button>';
                }
            }
        }
    }
    
    // 3. BOTÃO ITEM (se tiver item defensivo = cura disponível)
    const healItems = player.inventory?.['IT_HEAL_01'] || 0;
    const canUseItem = healItems > 0 && hp > 0 && hp < hpMax;
    
    if (canUseItem) {
        html += '<button class="btn btn-large btn-success" onclick="groupUseItem(\'IT_HEAL_01\')" style="min-width: 120px;">';
        html += '🧪 Item';
        html += '</button>';
    }
    
    // 4. BOTÃO FUGIR (sempre visível se vivo)
    if (isAlive) {
        html += '<button class="btn btn-large btn-warning" onclick="groupFlee()" style="min-width: 120px;">';
        html += '🏃 Fugir';
        html += '</button>';
    }
    
    // 5. BOTÃO PASSAR (sempre visível)
    html += '<button class="btn btn-large btn-secondary" onclick="groupPassTurn()" style="min-width: 120px;">';
    html += '⏭️ Passar';
    html += '</button>';
    
    html += '</div>'; // Fecha container de botões
    
    // Informação adicional (itens e skills detalhados)
    if (isAlive) {
        html += '<div class="mt-15" style="font-size: 14px; color: #666;">';
        
        // Mostrar itens disponíveis
        if (healItems > 0) {
            html += `<div>💚 Petisco de Cura: ${healItems}x disponível</div>`;
        }
        
        // Mostrar skills disponíveis
        if (skillIds && skillIds.length > 0) {
            const usableSkills = [];
            skillIds.forEach((skillId) => {
                const skill = helpers.getSkillById(skillId);
                if (skill && helpers.canUseSkillNow(skill, mon)) {
                    usableSkills.push(skill.name || skill.nome);
                }
            });
            
            if (usableSkills.length > 0) {
                html += `<div>✨ Habilidades: ${usableSkills.join(', ')}</div>`;
            }
        }
        
        html += '</div>';
    }
    
    html += '</div>'; // Fecha action-panel
    
    return html;
}
