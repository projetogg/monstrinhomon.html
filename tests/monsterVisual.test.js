/**
 * MONSTER VISUAL TESTS (PR1)
 *
 * Testes para js/ui/monsterVisual.js
 * Cobertura: getMonsterVisualData, getMonsterVisualHTML
 */

import { describe, it, expect } from 'vitest';
import { getMonsterVisualData, getMonsterVisualHTML } from '../js/ui/monsterVisual.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const monsterComImagem = {
    id: 'MON_001',
    name: 'Ferrozimon',
    emoji: '⚔️',
    image: 'assets/monsters/MON_001.png',
};

const monsterSemImagem = {
    id: 'MON_002',
    name: 'Cavalheiromon',
    emoji: '🗡️',
};

const monsterSemEmojiNemImagem = {
    id: 'MON_003',
    name: 'Kinguespinhomon',
};

// ─── getMonsterVisualData ────────────────────────────────────────────────────

describe('getMonsterVisualData - com image', () => {
    it('deve retornar type "image" quando monster.image existe', () => {
        const result = getMonsterVisualData(monsterComImagem);
        expect(result.type).toBe('image');
    });

    it('deve retornar o src correto', () => {
        const result = getMonsterVisualData(monsterComImagem);
        expect(result.src).toBe('assets/monsters/MON_001.png');
    });

    it('deve retornar o nome correto', () => {
        const result = getMonsterVisualData(monsterComImagem);
        expect(result.name).toBe('Ferrozimon');
    });

    it('deve manter o emoji disponível mesmo com image', () => {
        const result = getMonsterVisualData(monsterComImagem);
        expect(result.emoji).toBe('⚔️');
    });
});

describe('getMonsterVisualData - sem image (fallback emoji)', () => {
    it('deve retornar type "emoji" quando monster.image não existe', () => {
        const result = getMonsterVisualData(monsterSemImagem);
        expect(result.type).toBe('emoji');
    });

    it('deve retornar src null', () => {
        const result = getMonsterVisualData(monsterSemImagem);
        expect(result.src).toBeNull();
    });

    it('deve retornar o emoji correto', () => {
        const result = getMonsterVisualData(monsterSemImagem);
        expect(result.emoji).toBe('🗡️');
    });

    it('deve retornar o nome correto', () => {
        const result = getMonsterVisualData(monsterSemImagem);
        expect(result.name).toBe('Cavalheiromon');
    });
});

describe('getMonsterVisualData - casos extremos', () => {
    it('deve retornar fallback seguro para null', () => {
        const result = getMonsterVisualData(null);
        expect(result.type).toBe('emoji');
        expect(result.emoji).toBe('❓');
        expect(result.name).toBe('Desconhecido');
    });

    it('deve retornar fallback seguro para undefined', () => {
        const result = getMonsterVisualData(undefined);
        expect(result.type).toBe('emoji');
        expect(result.emoji).toBe('❓');
    });

    it('deve retornar emoji "❓" se monster não tem emoji', () => {
        const result = getMonsterVisualData(monsterSemEmojiNemImagem);
        expect(result.emoji).toBe('❓');
    });

    it('deve ignorar image vazia ("")', () => {
        const monster = { id: 'MON_X', name: 'Teste', emoji: '🔥', image: '' };
        const result = getMonsterVisualData(monster);
        expect(result.type).toBe('emoji');
    });

    it('deve ignorar image com apenas espaços', () => {
        const monster = { id: 'MON_X', name: 'Teste', emoji: '🔥', image: '   ' };
        const result = getMonsterVisualData(monster);
        expect(result.type).toBe('emoji');
    });

    it('não deve mutar o objeto de entrada', () => {
        const original = { ...monsterComImagem };
        getMonsterVisualData(monsterComImagem);
        expect(monsterComImagem).toEqual(original);
    });
});

// ─── getMonsterVisualHTML ────────────────────────────────────────────────────

describe('getMonsterVisualHTML - render com image', () => {
    it('deve gerar tag <img> quando monster.image existe', () => {
        const html = getMonsterVisualHTML(monsterComImagem);
        expect(html).toContain('<img');
    });

    it('deve incluir o src correto', () => {
        const html = getMonsterVisualHTML(monsterComImagem);
        expect(html).toContain('src="assets/monsters/MON_001.png"');
    });

    it('deve incluir alt com o nome do monstrinho', () => {
        const html = getMonsterVisualHTML(monsterComImagem);
        expect(html).toContain('alt="Ferrozimon"');
    });

    it('deve incluir classe base monster-visual', () => {
        const html = getMonsterVisualHTML(monsterComImagem);
        expect(html).toContain('monster-visual');
    });
});

describe('getMonsterVisualHTML - render sem image (fallback emoji)', () => {
    it('deve gerar tag <span> quando monster.image não existe', () => {
        const html = getMonsterVisualHTML(monsterSemImagem);
        expect(html).toContain('<span');
    });

    it('deve incluir o emoji no conteúdo', () => {
        const html = getMonsterVisualHTML(monsterSemImagem);
        expect(html).toContain('🗡️');
    });

    it('deve incluir aria-label com o nome do monstrinho', () => {
        const html = getMonsterVisualHTML(monsterSemImagem);
        expect(html).toContain('aria-label="Cavalheiromon"');
    });

    it('deve incluir classe monster-emoji', () => {
        const html = getMonsterVisualHTML(monsterSemImagem);
        expect(html).toContain('monster-emoji');
    });
});

describe('getMonsterVisualHTML - classes de tamanho', () => {
    it('deve aplicar monster-visual--md por padrão', () => {
        const html = getMonsterVisualHTML(monsterSemImagem);
        expect(html).toContain('monster-visual--md');
    });

    it('deve aplicar monster-visual--sm quando size="sm"', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { size: 'sm' });
        expect(html).toContain('monster-visual--sm');
    });

    it('deve aplicar monster-visual--lg quando size="lg"', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { size: 'lg' });
        expect(html).toContain('monster-visual--lg');
    });

    it('deve usar md como fallback para size inválido', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { size: 'xxl' });
        expect(html).toContain('monster-visual--md');
    });

    it('deve aplicar tamanho correto em render de imagem', () => {
        const html = getMonsterVisualHTML(monsterComImagem, { size: 'lg' });
        expect(html).toContain('monster-visual--lg');
    });
});

describe('getMonsterVisualHTML - modo silhouette', () => {
    it('deve incluir classe monster-silhouette quando silhouette=true', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { silhouette: true });
        expect(html).toContain('monster-silhouette');
    });

    it('não deve incluir monster-silhouette por padrão', () => {
        const html = getMonsterVisualHTML(monsterSemImagem);
        expect(html).not.toContain('monster-silhouette');
    });

    it('deve aplicar silhouette em imagem também', () => {
        const html = getMonsterVisualHTML(monsterComImagem, { silhouette: true });
        expect(html).toContain('monster-silhouette');
        expect(html).toContain('<img');
    });
});

describe('getMonsterVisualHTML - extraClass', () => {
    it('deve incluir extraClass quando fornecida', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { extraClass: 'minha-classe' });
        expect(html).toContain('minha-classe');
    });

    it('deve ignorar extraClass vazia', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { extraClass: '' });
        expect(html).toContain('monster-visual');
    });
});

describe('getMonsterVisualHTML - alt text correto', () => {
    it('alt deve ser o nome correto do monstrinho (img)', () => {
        const html = getMonsterVisualHTML(monsterComImagem);
        expect(html).toContain('alt="Ferrozimon"');
        expect(html).not.toContain('alt=""');
    });

    it('aria-label deve ser o nome correto (span)', () => {
        const html = getMonsterVisualHTML(monsterSemImagem);
        expect(html).toContain('aria-label="Cavalheiromon"');
    });

    it('deve escapar caracteres especiais no alt', () => {
        const monsterEspecial = { name: 'Teste<>"', emoji: '🔥' };
        const html = getMonsterVisualHTML(monsterEspecial);
        expect(html).not.toContain('<">');
        expect(html).toContain('&lt;');
        expect(html).toContain('&gt;');
        expect(html).toContain('&quot;');
    });
});

describe('getMonsterVisualHTML - sem mutação', () => {
    it('não deve mutar o objeto monster', () => {
        const original = { ...monsterComImagem };
        getMonsterVisualHTML(monsterComImagem, { size: 'lg', silhouette: true });
        expect(monsterComImagem).toEqual(original);
    });

    it('não deve mutar o objeto options', () => {
        const opts = { size: 'sm', silhouette: false };
        const originalOpts = { ...opts };
        getMonsterVisualHTML(monsterSemImagem, opts);
        expect(opts).toEqual(originalOpts);
    });
});

// ─── getMonsterVisualHTML - variantes contextuais ─────────────────────────────

describe('getMonsterVisualHTML - variant dex', () => {
    it('deve incluir classe monster-visual--variant-dex', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { variant: 'dex' });
        expect(html).toContain('monster-visual--variant-dex');
    });

    it('deve incluir classe monster-visual--variant-dex em render de imagem', () => {
        const html = getMonsterVisualHTML(monsterComImagem, { variant: 'dex' });
        expect(html).toContain('monster-visual--variant-dex');
        expect(html).toContain('<img');
    });

    it('deve acumular variant com size', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { variant: 'dex', size: 'lg' });
        expect(html).toContain('monster-visual--variant-dex');
        expect(html).toContain('monster-visual--lg');
    });
});

describe('getMonsterVisualHTML - variant box', () => {
    it('deve incluir classe monster-visual--variant-box', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { variant: 'box' });
        expect(html).toContain('monster-visual--variant-box');
    });

    it('deve incluir classe monster-visual--variant-box em render de imagem', () => {
        const html = getMonsterVisualHTML(monsterComImagem, { variant: 'box', size: 'md' });
        expect(html).toContain('monster-visual--variant-box');
    });
});

describe('getMonsterVisualHTML - variant battle', () => {
    it('deve incluir classe monster-visual--variant-battle', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { variant: 'battle' });
        expect(html).toContain('monster-visual--variant-battle');
    });
});

describe('getMonsterVisualHTML - variant inline', () => {
    it('deve incluir classe monster-visual--variant-inline', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { variant: 'inline' });
        expect(html).toContain('monster-visual--variant-inline');
    });

    it('deve incluir classe monster-visual--variant-inline junto ao size sm', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { variant: 'inline', size: 'sm' });
        expect(html).toContain('monster-visual--variant-inline');
        expect(html).toContain('monster-visual--sm');
    });
});

describe('getMonsterVisualHTML - variant silhouette (açúcar sintático)', () => {
    it('deve ativar monster-silhouette automaticamente via variant silhouette', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { variant: 'silhouette' });
        expect(html).toContain('monster-silhouette');
        expect(html).toContain('monster-visual--variant-silhouette');
    });

    it('variant silhouette funciona também com imagem', () => {
        const html = getMonsterVisualHTML(monsterComImagem, { variant: 'silhouette' });
        expect(html).toContain('monster-silhouette');
        expect(html).toContain('<img');
    });

    it('variant silhouette + silhouette: true explícito não duplica a classe', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { variant: 'silhouette', silhouette: true });
        // monster-silhouette deve aparecer exatamente uma vez
        const count = (html.match(/monster-silhouette/g) || []).length;
        expect(count).toBe(1);
    });
});

describe('getMonsterVisualHTML - variant inválido ignorado', () => {
    it('variant inválido não deve adicionar classe', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, { variant: 'invalido' });
        expect(html).not.toContain('monster-visual--variant-invalido');
        expect(html).toContain('monster-visual');
    });

    it('variant undefined não deve adicionar classe', () => {
        const html = getMonsterVisualHTML(monsterSemImagem, {});
        expect(html).not.toContain('monster-visual--variant-');
    });
});
