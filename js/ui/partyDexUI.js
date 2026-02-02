/**
 * PR16B - PartyDex UI Module
 * 
 * Read-only UI for the shared PartyDex system.
 * Shows progress and renders monster cards with 3 visual states:
 * - Unknown (not seen): ❓ + "???"
 * - Seen: Silhouette + "???"
 * - Captured: Full card with name, class, rarity
 * 
 * RULES:
 * - Read-only (no state mutations)
 * - Pure functions for calculations
 * - Defensive programming
 */

/**
 * Calculate PartyDex progress information
 * @param {Object} state - GameState object
 * @returns {Object} Progress data
 */
export function getDexProgress(state) {
    if (!state || !state.partyDex) {
        return {
            capturedCount: 0,
            nextMilestone: 10,
            remaining: 10,
            nextReward: 100,
            partyMoney: 0,
            lastAwarded: 0,
            progressPct: 0
        };
    }
    
    // Count captured monsters
    let capturedCount = 0;
    const entries = state.partyDex.entries || {};
    for (const templateId in entries) {
        if (entries[templateId]?.captured === true) {
            capturedCount++;
        }
    }
    
    // Calculate next milestone
    // Rule: 0->10, 1..9->10, 10->20, 19->20, 20->30, etc.
    let nextMilestone;
    if (capturedCount === 0) {
        nextMilestone = 10;
    } else {
        nextMilestone = (Math.floor(capturedCount / 10) + 1) * 10;
    }
    
    // Calculate remaining
    const remaining = nextMilestone - capturedCount;
    
    // Calculate next reward
    const nextReward = (nextMilestone / 10) * 100;
    
    // Get party money
    const partyMoney = state.partyMoney ?? 0;
    
    // Get last awarded milestone
    const lastAwarded = state.partyDex?.meta?.lastMilestoneAwarded ?? 0;
    
    // Calculate progress percentage within current 10-monster bracket
    // 0->0%, 1->10%, 9->90%, 10->0% (resets for next bracket)
    const progressWithinBracket = capturedCount % 10;
    const progressPct = (progressWithinBracket / 10) * 100;
    
    return {
        capturedCount,
        nextMilestone,
        remaining,
        nextReward,
        partyMoney,
        lastAwarded,
        progressPct
    };
}

/**
 * Get the status of a monster in the PartyDex
 * @param {Object} state - GameState object
 * @param {string} templateId - Monster template ID
 * @returns {string} 'captured' | 'seen' | 'unknown'
 */
export function getDexEntryStatus(state, templateId) {
    if (!state || !state.partyDex || !state.partyDex.entries) {
        return 'unknown';
    }
    
    const entry = state.partyDex.entries[templateId];
    
    if (!entry) {
        return 'unknown';
    }
    
    // Rule: captured > seen > unknown
    if (entry.captured === true) {
        return 'captured';
    }
    
    if (entry.seen === true && entry.captured === false) {
        return 'seen';
    }
    
    return 'unknown';
}

/**
 * Sort monster templates by status and ID
 * Order: captured first, then seen, then unknown
 * Tie-break: sort by template.id ascending (stable)
 * @param {Array} templates - Array of monster templates
 * @param {Object} state - GameState object
 * @returns {Array} Sorted templates (new array)
 */
export function sortDexTemplates(templates, state) {
    if (!Array.isArray(templates)) {
        return [];
    }
    
    // Create a copy to avoid mutating input
    const sorted = [...templates];
    
    // Status priority: captured=0, seen=1, unknown=2
    const statusPriority = {
        'captured': 0,
        'seen': 1,
        'unknown': 2
    };
    
    sorted.sort((a, b) => {
        const statusA = getDexEntryStatus(state, a.id);
        const statusB = getDexEntryStatus(state, b.id);
        
        const priorityA = statusPriority[statusA] ?? 2;
        const priorityB = statusPriority[statusB] ?? 2;
        
        // Primary sort: by status priority
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        // Secondary sort: by ID (ascending)
        return (a.id || '').localeCompare(b.id || '');
    });
    
    return sorted;
}

/**
 * Render the PartyDex UI
 * @param {HTMLElement} container - Container element
 * @param {Object} deps - Dependencies
 * @param {Object} deps.state - GameState object
 * @param {Function} deps.getMonsterTemplates - Function that returns array of templates
 */
export function renderPartyDex(container, deps) {
    if (!container) {
        console.warn('[PartyDexUI] No container provided');
        return;
    }
    
    if (!deps || !deps.state) {
        console.warn('[PartyDexUI] No state provided');
        container.innerHTML = '<p class="error">Estado não disponível</p>';
        return;
    }
    
    if (!deps.getMonsterTemplates || typeof deps.getMonsterTemplates !== 'function') {
        console.warn('[PartyDexUI] No getMonsterTemplates function provided');
        container.innerHTML = '<p class="error">Função de templates não disponível</p>';
        return;
    }
    
    try {
        // Get progress
        const progress = getDexProgress(deps.state);
        
        // Get all templates
        let templates = deps.getMonsterTemplates();
        
        if (!Array.isArray(templates)) {
            console.warn('[PartyDexUI] getMonsterTemplates did not return an array');
            templates = [];
        }
        
        // Sort templates
        const sortedTemplates = sortDexTemplates(templates, deps.state);
        
        // Render header
        const headerHTML = `
            <div class="dex-header">
                <h2>📘 Monstrodex do Grupo</h2>
                
                <div class="dex-stats">
                    <div class="dex-stat">
                        <span class="dex-stat-label">Capturados:</span>
                        <span class="dex-stat-value">${progress.capturedCount}</span>
                    </div>
                    <div class="dex-stat">
                        <span class="dex-stat-label">Próximo Marco:</span>
                        <span class="dex-stat-value">${progress.nextMilestone}</span>
                    </div>
                    <div class="dex-stat">
                        <span class="dex-stat-label">Faltam:</span>
                        <span class="dex-stat-value">${progress.remaining}</span>
                    </div>
                    <div class="dex-stat">
                        <span class="dex-stat-label">Próxima Recompensa:</span>
                        <span class="dex-stat-value">+${progress.nextReward} moedas</span>
                    </div>
                    <div class="dex-stat">
                        <span class="dex-stat-label">Dinheiro do Grupo:</span>
                        <span class="dex-stat-value">${progress.partyMoney} 💰</span>
                    </div>
                </div>
                
                <div class="dex-progress">
                    <div class="dex-progressbar">
                        <div class="dex-progressfill" style="width: ${progress.progressPct}%"></div>
                    </div>
                    <p class="dex-progress-text">
                        Progresso para o próximo marco: ${Math.floor(progress.progressPct)}%
                    </p>
                </div>
            </div>
        `;
        
        // Render cards
        const cardsHTML = sortedTemplates.map(template => {
            const status = getDexEntryStatus(deps.state, template.id);
            return renderMonsterCard(template, status);
        }).join('');
        
        // Combine and set innerHTML
        container.innerHTML = `
            ${headerHTML}
            <div class="dex-grid">
                ${cardsHTML}
            </div>
        `;
        
    } catch (error) {
        console.error('[PartyDexUI] Render error:', error);
        container.innerHTML = '<p class="error">Erro ao renderizar Monstrodex</p>';
    }
}

/**
 * Render a single monster card based on status
 * @param {Object} template - Monster template
 * @param {string} status - 'captured' | 'seen' | 'unknown'
 * @returns {string} HTML string
 */
function renderMonsterCard(template, status) {
    const safeId = (template.id || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    
    if (status === 'unknown') {
        // Unknown: ❓ + "???"
        return `
            <div class="dex-card dex-unknown" data-status="unknown" data-id="${safeId}">
                <div class="dex-qmark">❓</div>
                <div class="dex-name">???</div>
            </div>
        `;
    }
    
    if (status === 'seen') {
        // Seen: Silhouette + "???"
        return `
            <div class="dex-card dex-seen" data-status="seen" data-id="${safeId}">
                <div class="dex-art">
                    <div class="dex-silhouette">${template.emoji || '👾'}</div>
                </div>
                <div class="dex-name">???</div>
            </div>
        `;
    }
    
    // Captured: Full card
    const rarityClass = (template.rarity || 'Comum').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return `
        <div class="dex-card dex-captured" data-status="captured" data-id="${safeId}">
            <div class="dex-art">
                <div class="dex-emoji">${template.emoji || '👾'}</div>
            </div>
            <div class="dex-info">
                <div class="dex-name">${template.name || 'Desconhecido'}</div>
                <div class="dex-badges">
                    <span class="dex-badge-rarity dex-rarity-${rarityClass}">${template.rarity || 'Comum'}</span>
                    <span class="dex-badge-class">${template.class || 'Neutro'}</span>
                </div>
                <div class="dex-stats-mini">
                    <span class="dex-stat-mini">HP: ${template.baseHp || '?'}</span>
                    <span class="dex-stat-mini">ATK: ${template.baseAtk || '?'}</span>
                    <span class="dex-stat-mini">DEF: ${template.baseDef || '?'}</span>
                </div>
            </div>
        </div>
    `;
}

// Make available globally for index.html
if (typeof window !== 'undefined') {
    window.PartyDexUI = {
        getDexProgress,
        getDexEntryStatus,
        sortDexTemplates,
        renderPartyDex
    };
}
