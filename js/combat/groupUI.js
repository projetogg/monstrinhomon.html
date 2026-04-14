/** Rótulos das passivas de combate por classe (C2 — telemetria de classe no card). */
const CLASS_PASSIVE_LABELS = {
    'Guerreiro':  { icon: '🛡️', label: '-15% dano recebido' },
    'Bárbaro':    { icon: '🪓', label: '-10% dano recebido' },
    'Curandeiro': { icon: '🌿', label: '-10% dano recebido' },
    'Ladino':     { icon: '🗡️', label: '+10% dano causado' },
    'Mago':       { icon: '🔮', label: '+10% dano skill (ENE>50%)' },
    'Bardo':      { icon: '🎵', label: '+1 ACC por aliado vivo' },
    'Caçador':    { icon: '🏹', label: '+2 ATK vs alvo fraco' },
    'Animalista': { icon: '🐾', label: '1º ataque sempre acerta' },
};

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
import { executePlayerAttackGroup, executePlayerSkillGroup } from './groupActions.js';
import { categorizeBattleTeam, canManualSwap } from './battleSwap.js';

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
        const ene = Number(mon.ene) || 0;
        const eneMax = Number(mon.eneMax) || 10;
        const enePct = Math.max(0, Math.min(100, (ene / eneMax) * 100));
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

        // Indicador de time — quantos elegíveis/bloqueados na reserva (Fase 20)
        const masterMode = state.config?.masterMode || false;
        const cats = categorizeBattleTeam(p, { masterMode });
        const eligibleCount = cats.eligible.length;
        const blockedClassCount = cats.blocked_class.length;
        let teamHintHtml = '';
        if (eligibleCount > 0 || blockedClassCount > 0) {
            const parts = [];
            if (eligibleCount > 0) parts.push(`${eligibleCount} pronto${eligibleCount > 1 ? 's' : ''}`);
            if (blockedClassCount > 0) parts.push(`${blockedClassCount} fora da classe`);
            teamHintHtml = `<div class="group-unit-eligibility">🔄 Reserva: ${parts.join(' · ')}</div>`;
        }

        // C2: Passiva de classe do monstrinho em combate
        const classPassive = CLASS_PASSIVE_LABELS[mon.class];
        const classPassiveHtml = classPassive
            ? `<div class="group-unit-class-passive">${classPassive.icon} ${classPassive.label}</div>`
            : '';

        // Badges de buff/debuff ativos
        let buffBadgesHtml = '';
        if (Array.isArray(mon.buffs) && mon.buffs.length > 0) {
            for (const buff of mon.buffs) {
                const t = (buff.type || '').toLowerCase();
                const dur = buff.duration > 0 ? `, ${buff.duration}r` : '';
                if (t === 'atk') buffBadgesHtml += `<span class="buff-badge buff-atk">🔺ATK(+${buff.power}${dur})</span>`;
                else if (t === 'def') buffBadgesHtml += `<span class="buff-badge buff-def">🛡️DEF(+${buff.power}${dur})</span>`;
                else if (t === 'spd' && buff.power < 0) buffBadgesHtml += `<span class="buff-badge buff-debuff">🐢AGI(${buff.power}${dur})</span>`;
            }
        }
        // TAUNT badge: usa mon.id para comparação consistente
        if (encounter.tauntActiveId != null && encounter.tauntActiveId === mon.id) {
            buffBadgesHtml += `<span class="buff-badge buff-taunt">🎯TAUNT</span>`;
        }
        const buffBadgesContainerHtml = buffBadgesHtml
            ? `<div class="buff-badges">${buffBadgesHtml}</div>`
            : '';

        // Indicador de posição
        const pos = encounter.positions?.[pid];
        const posLabel = pos === 'front' ? '🗡️Frente' : pos === 'mid' ? '⚔️Meio' : pos === 'back' ? '🛡️Trás' : '';
        const posHtml = posLabel ? `<span class="position-badge">${posLabel}</span>` : '';

        playersHtml += `
        <div id="grpP_${pid}" class="${unitClass}">
            <div class="group-unit-name">${mon.emoji || ''} ${mon.name || mon.nome} <small>Nv ${mon.level}</small>
                ${isKO ? '<span class="group-unit-ko-badge">💀 KO</span>' : ''}
                ${isCurrent ? '<span class="group-unit-active-badge">▶ Em batalha</span>' : ''}
            </div>
            <div class="group-unit-owner">${p.name || p.nome} (${p.class})</div>
            <div class="battle-bar-row">
                <div class="battle-bar-label"><span>❤️ HP</span><span>${hp}/${hpMax}</span></div>
                <div class="battle-bar"><div class="battle-bar-fill hp" style="width:${hpPct}%"></div></div>
            </div>
            <div class="battle-bar-row">
                <div class="battle-bar-label"><span>⚡ ENE</span><span>${ene}/${eneMax}</span></div>
                <div class="battle-bar"><div class="battle-bar-fill ene" style="width:${enePct}%"></div></div>
            </div>
            ${classPassiveHtml}
            ${buffBadgesContainerHtml}
            ${posHtml}
            ${teamHintHtml}
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
        const ene = Number(e.ene) || 0;
        const eneMax = Number(e.eneMax) || 10;
        const enePct = Math.max(0, Math.min(100, (ene / eneMax) * 100));
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
            ${(() => {
                let enemyBuffsHtml = '';
                if (Array.isArray(e.buffs) && e.buffs.length > 0) {
                    for (const buff of e.buffs) {
                        const t = (buff.type || '').toLowerCase();
                        const dur = buff.duration > 0 ? `, ${buff.duration}r` : '';
                        if (t === 'atk') enemyBuffsHtml += `<span class="buff-badge buff-atk">🔺ATK(+${buff.power}${dur})</span>`;
                        else if (t === 'def') enemyBuffsHtml += `<span class="buff-badge buff-def">🛡️DEF(+${buff.power}${dur})</span>`;
                        else if (t === 'spd' && buff.power < 0) enemyBuffsHtml += `<span class="buff-badge buff-debuff">🐢AGI(${buff.power}${dur})</span>`;
                    }
                }
                if (encounter.markedEnemyIndex === i) enemyBuffsHtml += `<span class="buff-badge buff-mark">🎯MARCADO</span>`;
                return enemyBuffsHtml ? `<div class="buff-badges">${enemyBuffsHtml}</div>` : '';
            })()}
            <div class="battle-bar-row">
                <div class="battle-bar-label"><span>❤️ HP</span><span>${hp}/${hpMax}</span></div>
                <div class="battle-bar"><div class="battle-bar-fill hp" style="width:${hpPct}%"></div></div>
            </div>
            <div class="battle-bar-row">
                <div class="battle-bar-label"><span>⚡ ENE</span><span>${ene}/${eneMax}</span></div>
                <div class="battle-bar"><div class="battle-bar-fill ene" style="width:${enePct}%"></div></div>
            </div>
        </div>`;
    }

    // ── BARRA DE AÇÕES ───────────────────────────────────────────────────────
    const actionsHtml = renderActionBar(encounter, actor, isPlayerTurn, state, helpers);

    // ── LOG COMPACTO ─────────────────────────────────────────────────────────
    // H1: Prefixos de mensagens "técnicas" que são filtradas no modo simplificado
    const SIMPLIFIED_LOG_SKIP = ['🎲', '⚡', '✨ Passiva', '🛡️ Passiva', '🔮', '🗡️', '🎵'];
    const allLog = encounter.log || [];
    const simplifiedLog = state.config?.simplifiedLog;
    const filteredLog = simplifiedLog
        ? allLog.filter(msg => !SIMPLIFIED_LOG_SKIP.some(prefix => msg.startsWith(prefix)))
        : allLog;
    const logEntries = filteredLog.slice(-6).map(msg => `<div>${msg}</div>`).join('');

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
 * ESTADO C (seleção de alvo): instrução de clique em inimigo + cancelar
 * ESTADO D (vez do jogador): botões de ação reais
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

    // ESTADO C: Modo seleção de alvo — instrução clara + botão cancelar
    if (helpers.isInTargetMode && helpers.isInTargetMode()) {
        const actionType = helpers.getTargetActionType ? helpers.getTargetActionType() : 'attack';
        const actionLabel = actionType === 'skill'
            ? '✨ Clique em um inimigo para usar a habilidade'
            : '⚔️ Clique em um inimigo para atacar';
        return `
        <div class="battle-actions-row group-actions-bar">
            <span class="group-actions-label">🎯 Selecionando alvo:</span>
            <div class="battle-main-actions">
                <span style="font-size:14px;opacity:0.9">${actionLabel}</span>
                <button class="btn btn-secondary" onclick="cancelTargetSelection()">✖ Cancelar</button>
            </div>
        </div>`;
    }

    // ESTADO D: Vez do jogador — botões de ação
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

    // Monstrinho desmaiado durante o turno: bloquear ações e sinalizar substituição pendente
    if (!isAlive) {
        return `
        <div class="battle-actions-row group-actions-bar">
            <span class="group-actions-label">💀 ${player.name || player.nome}:</span>
            <div class="battle-main-actions">
                <span style="opacity:0.8;font-size:14px;color:#ff7675">💀 Monstrinho desmaiado — aguardando escolha de substituto…</span>
            </div>
        </div>`;
    }

    // Skills disponíveis — usa resolveMonsterSkills (único ponto de entrada canônico).
    // retorna skills normalizadas (formato operacional único); mostra habilitadas e desabilitadas.
    let skillButtonsHtml = '';
    if (isAlive && helpers.resolveMonsterSkills) {
        const resolvedSkills = helpers.resolveMonsterSkills(mon);
        for (let idx = 0; idx < resolvedSkills.length; idx++) {
            const skill = resolvedSkills[idx];
            if (!skill) continue;
            const canUse = helpers.canUseSkillNow(skill, mon);
            const label = helpers.formatSkillButtonLabel
                ? helpers.formatSkillButtonLabel(skill, mon)
                : (skill.name || 'Habilidade');
            // Nota: o caso idx=0 usa literal "enterSkillMode(0)" para que o
            // teste de auditoria de fonte (uiAudit.test.js) encontre a string exata.
            const onclickAttr = idx === 0
                ? `onclick="enterSkillMode(0)"`
                : `onclick="enterSkillMode(${idx})"`;
            const cost = Number(skill.cost ?? skill.energy_cost ?? 0) || 0;
            const tooltip = canUse
                ? (skill.desc || '')
                : `ENE insuficiente (${Number(mon.ene) || 0}/${cost})`;
            skillButtonsHtml += `<button class="btn btn-info" ${onclickAttr} ${!canUse ? 'disabled' : ''} title="${tooltip}">✨ ${label}</button>`;
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

    // Fuga: desabilitada em batalhas boss
    const isBoss = encounter.type === 'boss';
    const fleeAllowed = !isBoss && (encounter.rules?.allowFlee !== false);
    const fleeButtonHtml = isAlive && fleeAllowed
        ? `<button class="btn btn-warning" onclick="groupFlee()">🏃 Fugir</button>`
        : '';

    // Troca manual: disponível quando o ativo está vivo e há substituto elegível (Fase 20)
    const masterMode = state.config?.masterMode || false;
    const swapCheck = canManualSwap(player, { masterMode });
    const swapButtonHtml = isAlive && swapCheck.allowed
        ? `<button class="btn btn-secondary" onclick="groupManualSwap()" title="Trocar monstrinho ativo (usa o turno)">🔄 Trocar</button>`
        : '';

    return `
    <div class="battle-actions-row group-actions-bar">
        <span class="group-actions-label">⚔️ ${player.name || player.nome}:</span>
        <div class="battle-main-actions">
            <button class="btn btn-danger" onclick="enterAttackMode()">⚔️ Atacar</button>
            ${skillButtonsHtml}
            ${itemButtonHtml}
            ${swapButtonHtml}
            ${fleeButtonHtml}
            <button class="btn btn-secondary" onclick="groupPassTurn()">⏭️ Passar</button>
        </div>
    </div>`;
}

// ── Controle de Modo Alvo (Target Selection) ────────────────────────────────

/**
 * Entra em modo de seleção de alvo para ataque físico.
 *
 * Valida que é turno do jogador, ativa TargetSelection, re-renderiza
 * e aplica destaques visuais nos cards de inimigo.
 *
 * @param {object} enc  - Encounter atual (GameState.currentEncounter)
 * @param {object} deps - Dependências injetadas (createGroupCombatDeps)
 * @returns {{ ok: boolean, reason?: string }}
 */
export function enterAttackMode(enc, deps) {
    if (!enc || enc.finished) return { ok: false, reason: 'no_encounter' };

    const actor = deps.core.getCurrentActor(enc);
    if (!actor || actor.side !== 'player') return { ok: false, reason: 'not_player_turn' };

    TargetSelection.enterTargetMode('attack');
    deps.ui?.render?.();
    applyTargetSelectionVisuals(enc);
    return { ok: true };
}

/**
 * Entra em modo de seleção de alvo para skill, ou executa diretamente
 * se a skill tem alvo 'Self' / 'Aliado' (sem necessidade de selecionar inimigo).
 *
 * Suporta dois sistemas de skill:
 *  - Sistema canônico: IDs em mon.skills → lookup via getSkillById
 *  - Sistema legado SKILL_DEFS: getMonsterSkills por índice (fallback)
 *
 * @param {number} skillIndex - Índice da skill no array de skills do monstro ativo
 * @param {object} enc        - Encounter atual
 * @param {object} deps       - Dependências injetadas (requer helpers.getSkillsArray + getSkillById)
 * @returns {{ ok: boolean, reason?: string, direct?: boolean }}
 */
export function enterSkillMode(skillIndex, enc, deps) {
    if (!enc || enc.finished) return { ok: false, reason: 'no_encounter' };

    const actor = deps.core.getCurrentActor(enc);
    if (!actor || actor.side !== 'player') return { ok: false, reason: 'not_player_turn' };

    const player = deps.helpers.getPlayerById(actor.id);
    const mon = deps.helpers.getActiveMonsterOfPlayer(player);
    if (!mon) return { ok: false, reason: 'no_monster' };

    // Usa resolveMonsterSkills como único ponto de entrada canônico (sistema SKILL_DEFS)
    const resolvedSkills = deps.helpers.resolveMonsterSkills
        ? deps.helpers.resolveMonsterSkills(mon)
        : (deps.helpers.getMonsterSkills ? deps.helpers.getMonsterSkills(mon) : []);

    const skill = resolvedSkills[skillIndex];
    if (!skill) return { ok: false, reason: 'no_skill' };

    // Skill já está em formato operacional normalizado: target é 'enemy'/'self'/'ally'
    const isOffensive = skill.target === 'enemy' || skill.target === 'area';

    if (!isOffensive) {
        // Skills defensivas (HEAL/BUFF, alvo self/ally): executar diretamente, sem target selection
        executePlayerSkillGroup(skill, null, deps);
        return { ok: true, direct: true };
    }

    // Skills ofensivas: entrar em modo de seleção de alvo com skill object normalizado
    TargetSelection.enterTargetMode('skill', `skill_${skillIndex}`, skill);
    deps.ui?.render?.();
    applyTargetSelectionVisuals(enc);
    return { ok: true };
}

/**
 * Aplica destaques visuais nos cards de inimigo durante seleção de alvo.
 * Inimigos vivos ficam com borda azul/clicável; mortos ficam opacos.
 *
 * Deve ser chamada após renderizar o encounter (DOM dos cards já existe).
 *
 * @param {object} enc - Encounter atual (para iterar enc.enemies)
 */
export function applyTargetSelectionVisuals(enc) {
    if (typeof document === 'undefined') return; // ambiente sem DOM (testes Node)
    if (!enc || !enc.enemies) return;

    enc.enemies.forEach((enemy, idx) => {
        const card = document.getElementById(`grpE_${idx}`);
        if (!card) return;

        const isDead = (enemy.hp || 0) <= 0;

        if (isDead) {
            card.style.opacity = '0.4';
            card.style.cursor = 'default';
            card.style.border = '1px solid #ddd';
        } else {
            card.style.opacity = '1';
            card.style.cursor = 'pointer';
            card.style.border = '3px solid #2196F3';
            card.style.boxShadow = '0 0 15px rgba(33, 150, 243, 0.5)';
        }
    });
}

/**
 * Processa clique em um card de inimigo durante seleção de alvo.
 *
 * - Se não estiver em modo alvo: ignora
 * - Verifica que é turno do jogador e inimigo está vivo
 * - Executa ataque ou skill conforme actionType
 * - Sai do modo alvo e re-renderiza
 *
 * @param {number} enemyIndex - Índice do inimigo clicado (enc.enemies[enemyIndex])
 * @param {object} enc        - Encounter atual
 * @param {object} deps       - Dependências injetadas
 * @returns {{ ok: boolean, reason?: string } | undefined}
 */
export function handleEnemyClick(enemyIndex, enc, deps) {
    if (!TargetSelection.isInTargetMode()) return;

    if (!enc || enc.finished) return;

    const actor = deps.core.getCurrentActor(enc);
    if (!actor || actor.side !== 'player') return { ok: false, reason: 'not_player_turn' };

    const enemy = enc.enemies[enemyIndex];
    if (!enemy || (enemy.hp || 0) <= 0) return { ok: false, reason: 'enemy_dead' };

    const actionType = TargetSelection.getActionType();

    if (actionType === 'attack') {
        executePlayerAttackGroup(deps, enemyIndex);
    } else if (actionType === 'skill') {
        // Priorizar objeto de skill direto (sistema legado SKILL_DEFS) se disponível
        const skillObject = TargetSelection.getSelectedSkillObject();
        const skillId = skillObject || TargetSelection.getSelectedSkillId();
        executePlayerSkillGroup(skillId, enemyIndex, deps);
    }

    TargetSelection.exitTargetMode();
    deps.ui?.render?.();

    return { ok: true };
}

/**
 * Cancela o modo de seleção de alvo e re-renderiza.
 *
 * @param {object} deps - Dependências injetadas (requer deps.ui.render)
 */
export function cancelTargetMode(deps) {
    TargetSelection.exitTargetMode();
    deps.ui?.render?.();
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE TROCA — funções extraídas do index.html (B1)
// As funções buildSwapCard, buildKoSwapModalHTML, buildManualSwapModalHTML são
// puras (sem side-effects): recebem todos os dados via parâmetros explícitos.
// mountSwapModal é a única que acessa o DOM.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constrói o HTML de um card de monstrinho no modal de troca.
 * Função pura: não acessa DOM nem state global.
 *
 * @param {object} monster   - Instância de monstrinho
 * @param {number} index     - Índice na equipe
 * @param {object} player    - Jogador com { class, activeIndex }
 * @param {string} encId     - ID do encounter
 * @param {'ko'|'manual'} context - Contexto da troca
 * @param {boolean} masterMode
 * @param {object} BattleSwap - Módulo de swap (passado como dep)
 * @returns {string} HTML do card
 */
export function buildSwapCard({ monster, index, player, encId, context, masterMode, BattleSwap }) {
    const status = BattleSwap.getSwapStatus(monster, index, player, { masterMode });
    const hpPct = Math.max(0, Math.min(100, ((monster.hp || 0) / (monster.hpMax || 1)) * 100));
    const name = monster.emoji ? `${monster.emoji} ${monster.name || monster.nome}` : (monster.name || monster.nome);
    const isEligible = status.category === 'eligible';
    const clickAttr = isEligible
        ? `onclick="selectReplacementMonster('${player.id}', ${index}, '${encId}', '${context}')" role="button" tabindex="0"`
        : '';
    const cardClass = `swap-card swap-card--${status.category}`;
    return `
    <div class="${cardClass}" ${clickAttr} title="${status.title}">
        <div class="swap-card__name">${name} <small>Nv ${monster.level || 1}</small></div>
        <div class="swap-card__meta">HP ${monster.hp || 0}/${monster.hpMax || 0} (${Math.floor(hpPct)}%) · Classe: ${monster.class || '—'}</div>
        <span class="swap-card__reason">${status.label}</span>
    </div>`;
}

/**
 * Constrói o HTML do modal de troca por KO.
 * Função pura: retorna string HTML, não monta no DOM.
 */
export function buildKoSwapModalHTML(player, enc, masterMode, BattleSwap) {
    const cats = BattleSwap.categorizeBattleTeam(player, { masterMode });

    // Sem substituto elegível
    if (cats.eligible.length === 0) {
        let html = '<div class="modal-overlay-fixed" id="switchMonsterModal">';
        html += '<div class="modal-content-card">';
        html += `<h3>💀 ${player.name || player.nome}: Sem Substitutos</h3>`;
        html += `<div class="swap-modal-no-option">`;
        html += `<strong>Nenhum monstrinho elegível disponível.</strong><br>`;
        html += `<span>Regra: em batalha, só podem entrar monstrinhos da classe <strong>${player.class || '?'}</strong>.</span><br>`;
        html += `<span>Troque monstrinhos com outros jogadores para completar seu time!</span>`;
        html += `</div>`;
        if (cats.blocked_class.length > 0) {
            html += `<div class="swap-modal-section-title">Fora da classe (${player.class || '?'})</div>`;
            cats.blocked_class.forEach(({ monster, index }) => {
                html += buildSwapCard({ monster, index, player, encId: enc.id, context: 'ko', masterMode, BattleSwap });
            });
        }
        if (cats.blocked_ko.length > 0) {
            html += `<div class="swap-modal-section-title">Derrotados</div>`;
            cats.blocked_ko.forEach(({ monster, index }) => {
                html += buildSwapCard({ monster, index, player, encId: enc.id, context: 'ko', masterMode, BattleSwap });
            });
        }
        html += `<div style="margin-top:12px;text-align:center">`;
        html += `<button class="btn btn-secondary" onclick="document.getElementById('switchMonsterModal')?.remove(); window.GroupUI.closeWithNoSwap('${player.id}', '${enc.id}')">✖ Continuar sem substituto</button>`;
        html += `</div>`;
        html += '</div></div>';
        return html;
    }

    let html = '<div class="modal-overlay-fixed" id="switchMonsterModal">';
    html += '<div class="modal-content-card">';
    html += `<h3>💀 ${player.name || player.nome}: Escolha um Substituto</h3>`;
    html += `<p style="font-size:13px;opacity:0.8">Seu monstrinho foi derrotado. Escolha quem entra em campo:</p>`;
    html += `<div class="swap-modal-section-title">Podem entrar (${cats.eligible.length})</div>`;
    cats.eligible.forEach(({ monster, index }) => {
        html += buildSwapCard({ monster, index, player, encId: enc.id, context: 'ko', masterMode, BattleSwap });
    });
    if (cats.blocked_class.length > 0) {
        html += `<div class="swap-modal-section-title">Fora da classe — não podem entrar (${cats.blocked_class.length})</div>`;
        cats.blocked_class.forEach(({ monster, index }) => {
            html += buildSwapCard({ monster, index, player, encId: enc.id, context: 'ko', masterMode, BattleSwap });
        });
    }
    if (cats.blocked_ko.length > 0) {
        html += `<div class="swap-modal-section-title">Derrotados (${cats.blocked_ko.length})</div>`;
        cats.blocked_ko.forEach(({ monster, index }) => {
            html += buildSwapCard({ monster, index, player, encId: enc.id, context: 'ko', masterMode, BattleSwap });
        });
    }
    html += '</div></div>';
    return html;
}

/**
 * Constrói o HTML do modal de troca manual (ação voluntária do jogador).
 * Função pura: retorna string HTML.
 */
export function buildManualSwapModalHTML(player, enc, masterMode, BattleSwap) {
    const cats = BattleSwap.categorizeBattleTeam(player, { masterMode });

    let html = '<div class="modal-overlay-fixed" id="switchMonsterModal">';
    html += '<div class="modal-content-card">';
    html += `<h3>🔄 ${player.name || player.nome}: Trocar Monstrinho</h3>`;
    html += `<p style="font-size:13px;opacity:0.8">A troca usa o turno. Escolha quem entra em campo:</p>`;

    if (cats.active.length > 0) {
        html += `<div class="swap-modal-section-title">Em campo agora</div>`;
        cats.active.forEach(({ monster, index }) => {
            html += buildSwapCard({ monster, index, player, encId: enc.id, context: 'manual', masterMode, BattleSwap });
        });
    }
    if (cats.eligible.length > 0) {
        html += `<div class="swap-modal-section-title">Podem entrar (${cats.eligible.length})</div>`;
        cats.eligible.forEach(({ monster, index }) => {
            html += buildSwapCard({ monster, index, player, encId: enc.id, context: 'manual', masterMode, BattleSwap });
        });
    }
    if (cats.blocked_class.length > 0) {
        html += `<div class="swap-modal-section-title">Fora da classe — não podem entrar (${cats.blocked_class.length})</div>`;
        cats.blocked_class.forEach(({ monster, index }) => {
            html += buildSwapCard({ monster, index, player, encId: enc.id, context: 'manual', masterMode, BattleSwap });
        });
    }
    if (cats.blocked_ko.length > 0) {
        html += `<div class="swap-modal-section-title">Derrotados (${cats.blocked_ko.length})</div>`;
        cats.blocked_ko.forEach(({ monster, index }) => {
            html += buildSwapCard({ monster, index, player, encId: enc.id, context: 'manual', masterMode, BattleSwap });
        });
    }
    html += `<div style="margin-top:12px;text-align:center">`;
    html += `<button class="btn btn-secondary" onclick="document.getElementById('switchMonsterModal')?.remove()">✖ Cancelar</button>`;
    html += `</div>`;
    html += '</div></div>';
    return html;
}

/**
 * Monta e exibe um modal de troca no DOM.
 * @param {string} htmlContent - HTML do modal
 */
export function mountSwapModal(htmlContent) {
    const existing = document.getElementById('switchMonsterModal');
    if (existing) existing.remove();
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = htmlContent;
    // Adiciona animação de entrada ao primeiro filho (o card do modal)
    const firstChild = modalDiv.firstElementChild;
    if (firstChild) firstChild.classList.add('swap-modal-animated');
    document.body.appendChild(modalDiv);
}
