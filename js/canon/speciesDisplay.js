/**
 * SPECIES DISPLAY — Fase 15
 *
 * Módulo puro de dados de exibição para identidades canônicas de espécie.
 *
 * O que este módulo FAZ:
 *  - Define rótulos amigáveis, arquétipos, nomes de passiva e de kit_swap
 *    para cada espécie canônica.
 *  - Expõe `getSpeciesDisplayInfo(mon)`: função pura que lê os campos
 *    canonSpeciesId / appliedKitSwaps / promotedKitSwaps da instância
 *    e retorna um objeto pronto para renderização na UI.
 *  - Fallback seguro: monstrinhos sem espécie canônica retornam hasSpecies=false
 *    sem quebrar a interface.
 *
 * O que este módulo NÃO faz:
 *  - Não calcula stats nem modifica instâncias.
 *  - Não acessa o DOM nem o localStorage.
 *  - Não importa outros módulos canônicos (zero dependências).
 *
 * ── ADICIONAR NOVA ESPÉCIE ────────────────────────────────────────────────────
 *
 *  1. Adicione uma entrada em SPECIES_DISPLAY com o canonSpeciesId como chave.
 *  2. Preencha label, archetype, passiveName, passiveDesc,
 *     kitSwapBaseName e kitSwapPromoName.
 *  3. Execute os testes: npx vitest run tests/speciesIdentityDisplay.test.js
 *
 * ── CAMPOS DO OBJETO RETORNADO ────────────────────────────────────────────────
 *
 *  hasSpecies     — boolean: true se o monstrinho tem espécie canônica mapeada
 *  speciesLabel   — string | null: nome amigável da espécie (ex: "Shieldhorn")
 *  archetype      — string | null: papel resumido (ex: "Guerreiro resistente")
 *  passiveName    — string | null: nome da passiva (ex: "Escudo Territorial")
 *  passiveDesc    — string | null: descrição curta da passiva
 *  hasKitSwap     — boolean: true se o kit_swap já foi aplicado ou promovido
 *  kitSwapName    — string | null: nome atual da habilidade especial (I ou II)
 *  isPromoted     — boolean: true se o kit_swap já foi promovido ao nível II
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Tabela de exibição por espécie canônica.
 *
 * Cada entrada contém informações de display amigável para o jogador/criança:
 *  - label:            nome da espécie (não técnico)
 *  - archetype:        papel resumido em linguagem de jogo
 *  - passiveName:      nome amigável da passiva (deve coincidir com _passiveLabel de wildActions)
 *  - passiveDesc:      descrição curta e clara do efeito da passiva
 *  - kitSwapBaseName:  nome da habilidade especial no nível I
 *  - kitSwapPromoName: nome da habilidade especial no nível II (promovida)
 */
const SPECIES_DISPLAY = {
    /** shieldhorn — Guerreiro, arquétipo tank_puro */
    shieldhorn: {
        label: 'Shieldhorn',
        archetype: 'Guerreiro resistente',
        passiveName: 'Escudo Territorial',
        passiveDesc: 'Reduz o primeiro golpe recebido em cada turno',
        kitSwapBaseName: 'Golpe Pesado I',
        kitSwapPromoName: 'Golpe Pesado II',
    },

    /** emberfang — Bárbaro, arquétipo burst_agressivo */
    emberfang: {
        label: 'Emberfang',
        archetype: 'Bárbaro explosivo',
        passiveName: 'Fúria Crescente',
        passiveDesc: 'Mais força ao usar habilidade ofensiva com HP alto',
        kitSwapBaseName: 'Explosão Bruta I',
        kitSwapPromoName: 'Explosão Bruta II',
    },

    /** moonquill — Mago, arquétipo controle_leve */
    moonquill: {
        label: 'Moonquill',
        archetype: 'Mago controlador',
        passiveName: 'Controle Arcano',
        passiveDesc: 'Ganha velocidade ao usar habilidade de controle',
        kitSwapBaseName: 'Véu Arcano I',
        kitSwapPromoName: 'Véu Arcano II',
    },

    /** floracura — Curandeiro, arquétipo cura_estavel */
    floracura: {
        label: 'Floracura',
        archetype: 'Curandeiro eficiente',
        passiveName: 'Cura Eficiente',
        passiveDesc: 'Bônus especial na primeira cura do combate',
        kitSwapBaseName: 'Cura Eficiente I',
        kitSwapPromoName: 'Cura Eficiente II',
    },

    /** swiftclaw — Caçador, arquétipo striker_veloz */
    swiftclaw: {
        label: 'Swiftclaw',
        archetype: 'Caçador veloz',
        passiveName: 'Primeiro Ataque',
        passiveDesc: 'Mais força no primeiro golpe do combate',
        kitSwapBaseName: 'Flecha Certeira I',
        kitSwapPromoName: 'Flecha Certeira II',
    },

    /** shadowsting — Ladino, arquétipo oportunista_furtivo */
    shadowsting: {
        label: 'Shadowsting',
        archetype: 'Ladino oportunista',
        passiveName: 'Golpe Furtivo',
        passiveDesc: 'Mais força ao atacar após preparar um debuff',
        kitSwapBaseName: 'Golpe Furtivo I',
        kitSwapPromoName: 'Golpe Furtivo II',
    },

    /** bellwave — Bardo, arquétipo cadencia_ritmica */
    bellwave: {
        label: 'Bellwave',
        archetype: 'Bardo rítmico',
        passiveName: 'Cadência Rítmica',
        passiveDesc: 'Carrega ritmo ao usar habilidades e ataca com bônus',
        kitSwapBaseName: 'Nota Discordante I',
        kitSwapPromoName: 'Nota Discordante II',
    },

    /** wildpace — Animalista, arquétipo equilíbrio_adaptativo */
    wildpace: {
        label: 'Wildpace',
        archetype: 'Animalista adaptável',
        passiveName: 'Instinto Selvagem',
        passiveDesc: 'Mais força ao atacar quando com HP baixo',
        kitSwapBaseName: 'Instinto Protetor I',
        kitSwapPromoName: 'Instinto Protetor II',
    },
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Retorna informações de display da identidade canônica de um monstrinho.
 *
 * Função pura: não modifica a instância nem acessa o DOM.
 * Fallback seguro: retorna hasSpecies=false para qualquer input inválido.
 *
 * @param {object|null|undefined} mon - Instância de monstrinho (campo canonSpeciesId,
 *   appliedKitSwaps e promotedKitSwaps são lidos se existirem).
 * @returns {{
 *   hasSpecies: boolean,
 *   speciesLabel: string|null,
 *   archetype: string|null,
 *   passiveName: string|null,
 *   passiveDesc: string|null,
 *   hasKitSwap: boolean,
 *   kitSwapName: string|null,
 *   isPromoted: boolean,
 * }}
 */
export function getSpeciesDisplayInfo(mon) {
    const speciesId = mon?.canonSpeciesId ?? null;
    const data = speciesId ? (SPECIES_DISPLAY[speciesId] ?? null) : null;

    if (!data) {
        return {
            hasSpecies: false,
            speciesLabel: null,
            archetype: null,
            passiveName: null,
            passiveDesc: null,
            hasKitSwap: false,
            kitSwapName: null,
            isPromoted: false,
        };
    }

    const hasAppliedKitSwap = Array.isArray(mon.appliedKitSwaps) && mon.appliedKitSwaps.length > 0;
    const isPromoted = Array.isArray(mon.promotedKitSwaps) && mon.promotedKitSwaps.length > 0;

    let kitSwapName = null;
    if (isPromoted) {
        kitSwapName = data.kitSwapPromoName;
    } else if (hasAppliedKitSwap) {
        kitSwapName = data.kitSwapBaseName;
    }

    return {
        hasSpecies: true,
        speciesLabel: data.label,
        archetype: data.archetype,
        passiveName: data.passiveName,
        passiveDesc: data.passiveDesc,
        hasKitSwap: hasAppliedKitSwap || isPromoted,
        kitSwapName,
        isPromoted,
    };
}

/**
 * Retorna o objeto SPECIES_DISPLAY completo.
 * Útil para testes e validações de integridade de dados.
 *
 * @returns {Record<string, object>}
 */
export function getSpeciesDisplayTable() {
    return SPECIES_DISPLAY;
}

/**
 * Retorna os IDs de espécie com display mapeado.
 *
 * @returns {string[]}
 */
export function getDisplayedSpeciesIds() {
    return Object.keys(SPECIES_DISPLAY);
}
