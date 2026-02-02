/**
 * GROUP COMBAT UI - Renderização e Feedback Visual
 * 
 * PR5C: Implementação real extraída de index.html
 * 
 * Funções que manipulam DOM, animações e áudio
 * Recebem dependências por parâmetro (dependency injection)
 */

import * as GroupCore from './groupCore.js';

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
    
    // Last d20 roll badge
    if (encounter.lastRoll) {
        const lr = encounter.lastRoll;
        const badgeClass = lr.type === 'crit' ? 'crit' : lr.type === 'fail' ? 'fail' : '';
        const emoji = lr.type === 'crit' ? '🌟' : lr.type === 'fail' ? '💥' : '🎲';
        html += `<div class="d20-badge ${badgeClass}">${emoji} ${lr.name}: ${lr.roll} ${lr.type === 'crit' ? '(CRIT!)' : lr.type === 'fail' ? '(FALHA!)' : ''}</div>`;
    }
    
    // Indicador de turno atual
    if (actor) {
        const sideColor = actor.side === 'player' ? '#4CAF50' : '#f44336';
        html += `<div class="battle-result" style="background: ${sideColor};">`;
        html += `<strong>⏺️ Turno: ${actor.name}</strong> (${actor.side === 'player' ? 'Jogador' : 'Inimigo'})`;
        html += `</div>`;
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
        
        const border = isCurrent ? '3px solid #4CAF50' : '1px solid #ddd';
        html += `<div id="grpP_${pid}" class="group-participant-box" style="border: ${border};">`;
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
    
    // Inimigos
    html += '<div class="my-15">';
    html += '<h4>👹 Inimigos:</h4>';
    for (let i = 0; i < (encounter.enemies || []).length; i++) {
        const e = encounter.enemies[i];
        if (!e) continue;
        
        const hp = Number(e.hp) || 0;
        const hpMax = Number(e.hpMax) || 1;
        const hpPercent = Math.floor((hp / hpMax) * 100);
        const isCurrent = actor && actor.side === 'enemy' && actor.id === i;
        
        const border = isCurrent ? '3px solid #f44336' : '1px solid #ddd';
        html += `<div id="grpE_${i}" class="enemy-participant-box" style="border: ${border};">`;
        html += `<strong>${e.name || e.nome}</strong> - Nv ${e.level}`;
        html += `<br>HP: ${hp}/${hpMax} (${hpPercent}%)`;
        html += `<br>SPD: ${e.spd} | ATK: ${e.atk} | DEF: ${e.def}`;
        html += `</div>`;
    }
    html += '</div>';
    
    // Ações (apenas para turno do jogador)
    if (isPlayerTurn && !encounter.finished) {
        html += '<div class="my-15 p-15 bg-light-gray border-radius-5">';
        html += '<h4>Ações:</h4>';
        html += '<div class="d-flex flex-gap-10 flex-wrap mt-10">';
        html += '<button class="btn btn-danger" onclick="groupAttack()">⚔️ Atacar</button>';
        html += '<button class="btn btn-primary" onclick="groupPassTurn()">⏭️ Passar</button>';
        html += '</div>';
        
        // Items section for current player
        if (actor && actor.side === 'player') {
            const player = state.players.find(p => p.id === actor.id);
            const mon = player?.team?.[0];
            if (mon && player) {
                const healItems = player.inventory?.['IT_HEAL_01'] || 0;
                const hp = Number(mon.hp) || 0;
                const hpMax = Number(mon.hpMax) || 1;
                const canUseItem = healItems > 0 && hp > 0 && hp < hpMax;
                
                html += '<div class="heal-box mt-15">';
                html += '<strong class="font-size-16 text-bold">💚 Usar Item de Cura</strong>';
                html += '<div class="mt-10">';
                html += `<div><strong>Petisco de Cura disponível:</strong> ${healItems}x</div>`;
                html += `<div><strong>HP atual:</strong> ${hp}/${hpMax}</div>`;
                
                if (!canUseItem && healItems === 0) {
                    html += '<div class="color-error mt-5">❌ Sem itens de cura disponíveis</div>';
                } else if (!canUseItem && hp <= 0) {
                    html += '<div class="color-error mt-5">❌ Monstrinho desmaiado, não pode usar item</div>';
                } else if (!canUseItem && hp >= hpMax) {
                    html += '<div class="color-warning mt-5">⚠️ HP já está cheio</div>';
                }
                
                html += '</div>';
                const buttonClass = `btn btn-primary mt-10 w-100${!canUseItem ? ' opacity-50' : ''}`;
                const buttonDisabled = !canUseItem ? 'disabled' : '';
                html += `<button class="${buttonClass}" onclick="groupUseItem('IT_HEAL_01')" ${buttonDisabled}>`;
                html += '💚 Usar Petisco de Cura';
                html += '</button>';
                html += '</div>';
            }
        }
        
        // Feature 3.7: Skills buttons for current player
        if (actor && actor.side === 'player') {
            const player = state.players.find(p => p.id === actor.id);
            const mon = player?.team?.[0];
            if (mon) {
                const skillIds = helpers.getSkillsArray(mon);
                if (skillIds && skillIds.length > 0) {
                    html += '<div class="skills-box">';
                    html += '<strong class="skills-title">✨ Habilidades</strong>';
                    html += '<div class="d-flex flex-gap-10 flex-wrap mt-10">';
                    
                    skillIds.forEach((skillId, idx) => {
                        const skill = helpers.getSkillById(skillId);
                        if (!skill) return;
                        
                        const label = helpers.formatSkillButtonLabel(skill, mon);
                        const canUse = helpers.canUseSkillNow(skill, mon) && mon.hp > 0;
                        const tooltip = canUse ? (skill.desc || skill.descricao || '') : 'Sem ENE';
                        
                        html += `
                        <button class="btn btn-info" 
                                onclick="groupUseSkill(${idx})" 
                                ${!canUse ? 'disabled class="opacity-50"' : ''}
                                title="${tooltip}">
                            ${label}
                        </button>
                        `;
                    });
                    
                    html += '</div>';
                    html += '</div>';
                }
            }
        }
        
        html += '</div>';
    }
    
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
