/**
 * FRIENDLY BATTLE LOG TESTS (CAMADA 4B)
 *
 * Testes para o módulo de log amigável de combate.
 * Cobertura: renderFriendlyBattleLog, scrollFriendlyLogToBottom
 */

import { describe, it, expect } from 'vitest';
import { renderFriendlyBattleLog, scrollFriendlyLogToBottom } from '../js/ui/friendlyBattleLog.js';

describe('FriendlyBattleLog - renderFriendlyBattleLog', () => {

    describe('Log vazio', () => {
        it('deve renderizar mensagem "Nenhuma ação ainda..." quando log vazio', () => {
            const html = renderFriendlyBattleLog([]);
            expect(html).toContain('Nenhuma ação ainda...');
        });

        it('deve renderizar mensagem vazia com array undefined tratado como vazio', () => {
            const html = renderFriendlyBattleLog(undefined);
            expect(html).toContain('Nenhuma ação ainda...');
        });

        it('deve renderizar mensagem vazia com null tratado como vazio', () => {
            const html = renderFriendlyBattleLog(null);
            expect(html).toContain('Nenhuma ação ainda...');
        });
    });

    describe('Título e estrutura HTML', () => {
        it('deve incluir título "Últimas Ações"', () => {
            const html = renderFriendlyBattleLog([]);
            expect(html).toContain('Últimas Ações');
        });

        it('deve incluir ID padrão do container para auto-scroll', () => {
            const html = renderFriendlyBattleLog([]);
            expect(html).toContain('id="friendlyBattleLog"');
        });

        it('deve incluir ID personalizado quando fornecido', () => {
            const html = renderFriendlyBattleLog([], { containerId: 'meuLog' });
            expect(html).toContain('id="meuLog"');
        });
    });

    describe('Exibição de entradas recentes', () => {
        it('deve exibir todas as entradas quando há menos que maxEntries', () => {
            const logs = ['⚔️ Ação 1', '🎲 Ação 2'];
            const html = renderFriendlyBattleLog(logs);
            expect(html).toContain('⚔️ Ação 1');
            expect(html).toContain('🎲 Ação 2');
        });

        it('deve exibir apenas as últimas 5 entradas por padrão', () => {
            const logs = [
                '1️⃣ entrada 1',
                '2️⃣ entrada 2',
                '3️⃣ entrada 3',
                '4️⃣ entrada 4',
                '5️⃣ entrada 5',
                '6️⃣ entrada 6',
                '7️⃣ entrada 7',
            ];
            const html = renderFriendlyBattleLog(logs);
            // Deve conter as 5 mais recentes
            expect(html).toContain('3️⃣ entrada 3');
            expect(html).toContain('4️⃣ entrada 4');
            expect(html).toContain('5️⃣ entrada 5');
            expect(html).toContain('6️⃣ entrada 6');
            expect(html).toContain('7️⃣ entrada 7');
            // Não deve conter as anteriores
            expect(html).not.toContain('1️⃣ entrada 1');
            expect(html).not.toContain('2️⃣ entrada 2');
        });

        it('deve respeitar maxEntries customizado de 3', () => {
            const logs = ['entrada_1', 'entrada_2', 'entrada_3', 'entrada_4', 'entrada_5'];
            const html = renderFriendlyBattleLog(logs, { maxEntries: 3 });
            expect(html).toContain('entrada_3');
            expect(html).toContain('entrada_4');
            expect(html).toContain('entrada_5');
            expect(html).not.toContain('entrada_1');
            expect(html).not.toContain('entrada_2');
        });

        it('deve respeitar maxEntries customizado de 5 (limite superior spec)', () => {
            const logs = ['entrada_1', 'entrada_2', 'entrada_3', 'entrada_4', 'entrada_5', 'entrada_6'];
            const html = renderFriendlyBattleLog(logs, { maxEntries: 5 });
            expect(html).toContain('entrada_2');
            expect(html).toContain('entrada_6');
            expect(html).not.toContain('entrada_1');
        });

        it('deve exibir entrada única corretamente', () => {
            const logs = ['🏁 Vitória!'];
            const html = renderFriendlyBattleLog(logs);
            expect(html).toContain('🏁 Vitória!');
            expect(html).not.toContain('Nenhuma ação ainda...');
        });
    });

    describe('Entradas com emojis e linguagem amigável', () => {
        it('deve preservar emojis nas entradas', () => {
            const logs = ['⚔️ João atacou Trok!', '💥 Trok recebeu 10 de dano'];
            const html = renderFriendlyBattleLog(logs);
            expect(html).toContain('⚔️ João atacou Trok!');
            expect(html).toContain('💥 Trok recebeu 10 de dano');
        });

        it('deve preservar mensagens de vitória e derrota', () => {
            const logs = [
                '🏁 Vitória! Todos os inimigos foram derrotados.',
                '💀 Derrota... Todos os participantes foram derrotados.'
            ];
            const htmlV = renderFriendlyBattleLog([logs[0]]);
            expect(htmlV).toContain('🏁 Vitória!');

            const htmlD = renderFriendlyBattleLog([logs[1]]);
            expect(htmlD).toContain('💀 Derrota...');
        });
    });

    describe('Retorno válido', () => {
        it('deve retornar string', () => {
            const html = renderFriendlyBattleLog([]);
            expect(typeof html).toBe('string');
        });

        it('deve retornar HTML não vazio', () => {
            const html = renderFriendlyBattleLog(['Ação']);
            expect(html.length).toBeGreaterThan(0);
        });
    });
});

describe('FriendlyBattleLog - scrollFriendlyLogToBottom', () => {
    it('deve ser uma função exportada', () => {
        expect(typeof scrollFriendlyLogToBottom).toBe('function');
    });

    it('não deve lançar erro quando container não existe no DOM', () => {
        // Em ambiente de teste (jsdom ou Node), não há DOM real - não deve lançar
        expect(() => scrollFriendlyLogToBottom('containerInexistente')).not.toThrow();
    });

    it('não deve lançar erro sem argumento (usa ID padrão)', () => {
        expect(() => scrollFriendlyLogToBottom()).not.toThrow();
    });
});
