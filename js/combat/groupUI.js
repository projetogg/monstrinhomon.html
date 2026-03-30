/**
 * GROUP COMBAT UI - Renderização e Feedback Visual
 *
 * Layout unificado com o combate selvagem (.battle-arena dark theme).
 * Estrutura de zonas:
 *   [top-bar]  → título + rodada + turno atual
 *   [combatants]  → jogadores (esq) | inimigos (dir)
 *   [actions-row]  → botões quando turno do jogador / espera quando inimigo
 *   [log-compact]  → últimas ações
 */

import * as GroupCore from './groupCore.js';
import * as TargetSelection from '../ui/targetSelection.js';

/** IDs dos itens de cura consumíveis suportados em batalha. Manter alinhado com data/items.json. */
const HEAL_ITEM_IDS = ['IT_HEAL_01', 'IT_HEAL_02', 'IT_HEAL_03'];

/**
 * Renderiza UI completa do encounter de grupo / boss no layout .battle-arena.
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
    const isBoss = encounter.type === 'boss';
    const shouldShowModal = encounter.finished && !encounter._modalShown;

    // ── TOP BAR ──────────────────────────────────────────────────────────────
    const encounterTitle = isBoss
        ? `👹 Boss: ${(encounter.enemies || []).map(e => e.name || e.nome).join(', ')}`
        : '⚔️ Batalha em Grupo';

    const lastRollHtml = encounter.lastRoll ? (() => {
        const lr = encounter.lastRoll;
        const bc = lr.type === 'crit' ? 'crit' : lr.type === 'fail' ? 'fail' : '';
        const em = lr.type === 'crit' ? '🌟' : lr.type === 'fail' ? '💥' : '🎲';
        return `<span class="battle-roll-badge ${bc}">${em} ${lr.name}: ${lr.roll}${lr.type === 'crit' ? ' CRIT!' : lr.type === 'fail' ? ' FALHA!' : ''}</span>`;
    })() : '';

    let turnBadgeHtml = '';
    if (!encounter.finished) {
        if (actor) {
            // Rodada atual: usa campo explícito se disponível, senão estima pela posição
            const round = encounter.turn?.round
                || Math.ceil(((encounter.turnIndex || 0) + 1) / Math.max(1, (encounter.turnOrder || []).length));
            if (actor.side === 'player') {
                const currentPlayer = state.players.find(x => x.id === actor.id);
                const playerName = currentPlayer ? (currentPlayer.name || currentPlayer.nome) : 'Jogador';
                turnBadgeHtml = `<span class="group-turn-badge group-turn-player">🟢 VEZ DE ${playerName.toUpperCase()} · Rodada ${round}</span>`;
            } else {
                turnBadgeHtml = `<span class="group-turn-badge group-turn-enemy">🔴 VEZ DOS INIMIGOS · Rodada ${round}</span>`;
            }
        }
    } else {
        turnBadgeHtml = '<span class="group-turn-badge group-turn-ended">🏁 Batalha encerrada</span>';
    }

    // ── JOGADORES (coluna esquerda) ──────────────────────────────────────────
    let playersHtml = '';
    for (const pid of (encounter.participants || [])) {
        const p = state.players.find(x => x.id === pid);
        if (!p) continue;
        const mon = p.team?.[p.activeIndex ?? 0];
        if (!mon) continue;

        helpers.ensureXpFields(mon);
        const hp = Number(mon.hp) || 0;
        const hpMax = Number(mon.hpMax) || 1;
        const hpPct = Math.max(0, Math.min(100, (hp / hpMax) * 100));
        const isKO = hp <= 0;
        const isCurrent = actor && actor.side === 'player' && actor.id === pid;

        let unitClass = 'group-unit';
        if (isKO) unitClass += ' group-unit--ko';
        else if (isCurrent) unitClass += ' group-unit--active';
        else if (!isPlayerTurn) unitClass += ' group-unit--dim';

        // Item equipado
        let itemHtml = '';
        if (mon.heldItemId) {
            const itemDef = helpers.getItemDef ? helpers.getItemDef(mon.heldItemId) : null;
            if (itemDef) {
                const bonuses = [];
                if (itemDef.stats?.atk > 0) bonuses.push(`+${itemDef.stats.atk} ATK`);
                if (itemDef.stats?.def > 0) bonuses.push(`+${itemDef.stats.def} DEF`);
                let label = itemDef.name + (bonuses.length ? ` (${bonuses.join(', ')})` : '');
                itemHtml = `<div class="group-unit-item">⚔️ ${label}</div>`;
            }
        }

        playersHtml += `
        <div id="grpP_${pid}" class="${unitClass}">
            <div class="group-unit-name">${mon.emoji || ''} ${mon.name || mon.nome} <small>Nv ${mon.level}</small>
                ${isKO ? '<span class="group-unit-ko-badge">💀 KO</span>' : ''}
                ${isCurrent ? '<span class="group-unit-active-badge">▶ Ativa</span>' : ''}
            </div>
            <div class="group-unit-owner">${p.name || p.nome} (${p.class})</div>
            <div class="battle-bar-row">
                <div class="battle-bar-label"><span>❤️ HP</span><span>${hp}/${hpMax}</span></div>
                <div class="battle-bar"><div class="battle-bar-fill hp" style="width:${hpPct}%"></div></div>
            </div>
            ${itemHtml}
        </div>`;
    }

    // ── INIMIGOS (coluna direita) ────────────────────────────────────────────
    let enemiesHtml = '';
    for (let i = 0; i < (encounter.enemies || []).length; i++) {
        const e = encounter.enemies[i];
        if (!e) continue;

        const hp = Number(e.hp) || 0;
        const hpMax = Number(e.hpMax) || 1;
        const hpPct = Math.max(0, Math.min(100, (hp / hpMax) * 100));
        const isDead = hp <= 0;
        const isCurrent = actor && actor.side === 'enemy' && actor.id === i;

        let unitClass = 'group-unit group-unit--enemy';
        if (isDead) unitClass += ' group-unit--ko';
        else if (isCurrent) unitClass += ' group-unit--active-enemy';
        else if (isPlayerTurn && !isDead) unitClass += ' group-unit--target';
        else unitClass += ' group-unit--dim';

        const clickHandler = isPlayerTurn && !isDead ? ` onclick="handleEnemyClick(${i})"` : '';

        enemiesHtml += `
        <div id="grpE_${i}" class="${unitClass}"${clickHandler}>
            <div class="group-unit-name">${e.emoji || ''} ${e.name || e.nome} <small>Nv ${e.level}</small>
                ${isDead ? '<span class="group-unit-ko-badge">💀 KO</span>' : ''}
                ${isCurrent ? '<span class="group-unit-active-badge">▶ Atacando</span>' : ''}
            </div>
            <div class="group-unit-stats">ATK ${e.atk} · DEF ${e.def} · SPD ${e.spd}</div>
            <div class="battle-bar-row">
                <div class="battle-bar-label"><span>❤️ HP</span><span>${hp}/${hpMax}</span></div>
                <div class="battle-bar"><div class="battle-bar-fill hp" style="width:${hpPct}%"></div></div>
            </div>
        </div>`;
    }

    // ── BARRA DE AÇÕES ───────────────────────────────────────────────────────
    const actionsHtml = renderActionBar(encounter, actor, isPlayerTurn, state, helpers);

    // ── LOG COMPACTO ─────────────────────────────────────────────────────────
    const logEntries = (encounter.log || []).slice(-6).map(msg => `<div>${msg}</div>`).join('');

    // ── MONTAR HTML FINAL ────────────────────────────────────────────────────
    const html = `
    <div class="battle-arena">
        ${helpers.renderTutorialBanner(encounter)}

        <div class="battle-top-bar">
            <span class="battle-encounter-title">${encounterTitle}</span>
            ${lastRollHtml}
            ${turnBadgeHtml}
        </div>

        <div class="battle-combatants group-battle-combatants">
            <div class="battle-combatant-box battle-player-side group-combatant-col">
                <div class="battle-combatant-role">👥 Jogadores</div>
                ${playersHtml || '<div style="opacity:0.5;font-size:13px">Sem participantes</div>'}
            </div>
            <div class="battle-combatant-box battle-enemy-side group-combatant-col">
                <div class="battle-combatant-role">👹 ${isBoss ? 'Boss' : 'Inimigos'}</div>
                ${enemiesHtml || '<div style="opacity:0.5;font-size:13px">Sem inimigos</div>'}
            </div>
        </div>

        ${actionsHtml}

        <div class="battle-log-compact" id="groupCombatLog">
            ${logEntries}
        </div>
    </div>`;

    panel.innerHTML = html;

    // Exibir toasts para eventos importantes (level up, evolução)
    helpers.maybeToastFromLog(encounter);

    // Feature 4.4: Tocar sons para level up e evolução
    helpers.maybeSfxFromLog(encounter);

    // Mostrar modal de fim de batalha se necessário
    if (shouldShowModal) {
        encounter._modalShown = true;
        if (typeof helpers.showBattleEndModal === 'function') {
            helpers.showBattleEndModal(encounter, state);
        }
    }
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
 * Renderiza a barra de ações integrada ao .battle-arena.
 *
 * ESTADO A (batalha encerrada): linha vazia
 * ESTADO B (vez dos inimigos): indicador de espera
 * ESTADO C (vez do jogador): botões de ação reais
 *
 * Ordem dos botões: Atacar → Habilidades → Item → Fugir → Passar
 *
 * @param {object} encounter - Encounter atual
 * @param {object|null} actor - Ator atual (getCurrentActor)
 * @param {boolean} isPlayerTurn - Se é turno de algum jogador
 * @param {object} state - GameState
 * @param {object} helpers - Helper functions
 * @returns {string} HTML da barra de ações
 */
function renderActionBar(encounter, actor, isPlayerTurn, state, helpers) {
    // Batalha encerrada: sem barra de ações
    if (encounter.finished) return '';

    // ESTADO B: Vez dos inimigos — mostrar indicador de espera compacto
    if (!isPlayerTurn || !actor || actor.side !== 'player') {
        return `
        <div class="battle-actions-row group-actions-waiting">
            <span style="opacity:0.7;font-size:14px">⏳ Vez dos inimigos… d20 automático em andamento</span>
        </div>`;
    }

    // ESTADO C: Vez do jogador — botões de ação
    const player = state.players.find(p => p.id === actor.id);
    const mon = player?.team?.[player?.activeIndex ?? 0];

    if (!player || !mon) {
        return `
        <div class="battle-actions-row">
            <span class="battle-sec-title" style="color:#ff7675">❌ Jogador/monstrinho não encontrado</span>
        </div>`;
    }

    const hp = Number(mon.hp) || 0;
    const hpMax = Number(mon.hpMax) || 1;
    const isAlive = hp > 0;

    // Skills disponíveis
    const skillIds = helpers.getSkillsArray(mon);
    let skillButtonsHtml = '';
    if (isAlive && skillIds && skillIds.length > 0) {
        for (let idx = 0; idx < skillIds.length; idx++) {
            const skill = helpers.getSkillById(skillIds[idx]);
            if (skill && helpers.canUseSkillNow(skill, mon)) {
                const label = helpers.formatSkillButtonLabel
                    ? helpers.formatSkillButtonLabel(skill, mon)
                    : (skill.name || skill.nome);
                // Nota: o caso idx=0 usa literal "enterSkillMode(0)" para que o
                // teste de auditoria de fonte (uiAudit.test.js) encontre a string exata.
                const onclickAttr = idx === 0
                    ? `onclick="enterSkillMode(0)"`
                    : `onclick="enterSkillMode(${idx})"`;
                skillButtonsHtml += `<button class="btn btn-info" ${onclickAttr} title="${skill.desc || skill.descricao || ''}">✨ ${label}</button>`;
            }
        }
    }

    // Item de cura disponível
    const availableHealItems = HEAL_ITEM_IDS.filter(id => (player.inventory?.[id] || 0) > 0);
    const canHeal = availableHealItems.length > 0 && hp > 0 && hp < hpMax;
    let itemButtonHtml = '';
    if (canHeal) {
        const firstId = availableHealItems[0];
        const def = helpers.getItemDef ? helpers.getItemDef(firstId) : null;
        const qty = player.inventory?.[firstId] || 0;
        itemButtonHtml = `<button class="btn btn-success" onclick="groupUseItem('${firstId}')" title="${def?.name ?? firstId} (${qty}x)">${def?.emoji || '🧪'} ${def?.name || 'Item'}</button>`;
    }

    return `
    <div class="battle-actions-row group-actions-bar">
        <span class="group-actions-label">⚔️ ${player.name || player.nome}:</span>
        <div class="battle-main-actions">
            ${isAlive ? `<button class="btn btn-danger" onclick="enterAttackMode()">⚔️ Atacar</button>` : ''}
            ${skillButtonsHtml}
            ${itemButtonHtml}
            ${isAlive ? `<button class="btn btn-warning" onclick="groupFlee()">🏃 Fugir</button>` : ''}
            <button class="btn btn-secondary" onclick="groupPassTurn()">⏭️ Passar</button>
        </div>
    </div>`;
}
