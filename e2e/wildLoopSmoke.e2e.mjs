import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const safeTestMonsterHp = 1000;
const guaranteedCaptureThreshold = 0;
// Hosts externos de tipografia esperados (bloqueados de propósito no teste).
const expectedBlockedHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
// Mensagem esperada quando os hosts externos permitidos são bloqueados pelo route.abort().
const allowedConsoleErrorPatterns = [
    /^Failed to load resource: net::ERR_FAILED$/,
];

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.webp': 'image/webp',
};

function startStaticServer(rootDir) {
    const safeRoot = path.resolve(rootDir);
    const server = createServer(async (req, res) => {
        try {
            const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
            const rawPath = decodeURIComponent(reqUrl.pathname);
            const relativePath = rawPath === '/' ? 'index.html' : rawPath.slice(1);
            let filePath = path.resolve(path.join(safeRoot, relativePath));

            if (!filePath.startsWith(safeRoot)) {
                res.statusCode = 403;
                res.end('Forbidden');
                return;
            }

            const stat = await fs.stat(filePath).catch(() => null);
            if (!stat) {
                res.statusCode = 404;
                res.end('Not found');
                return;
            }
            if (stat.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }

            const body = await fs.readFile(filePath);
            const ext = path.extname(filePath).toLowerCase();
            res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
            res.statusCode = 200;
            res.end(body);
        } catch (error) {
            res.statusCode = 500;
            res.end(`Server error: ${error.message}`);
        }
    });

    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            resolve({
                baseUrl: `http://127.0.0.1:${address.port}`,
                close: () => new Promise((done) => server.close(done)),
            });
        });
    });
}

async function run() {
    const { baseUrl, close } = await startStaticServer(repoRoot);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    const blockedHosts = new Set();
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (error) => {
        pageErrors.push(error.message);
        console.error('pageerror:', error.message);
    });
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
            console.error('console.error:', msg.text());
        }
    });

    await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
        const isLocal = ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
        if (isHttp && !isLocal) {
            blockedHosts.add(url.hostname);
            await route.abort();
            return;
        }
        await route.continue();
    });

    try {
        await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });

        await page.locator('#mmIntro button:has-text("Jogar")').click();
        await page.locator('#mmMenu button:has-text("Novo Jogo")').click();
        await page.locator('#mmSlotPickerList button:has-text("Usar")').first().click();
        const confirmOverwrite = page.locator('#mmConfirmOk');
        if (await confirmOverwrite.isVisible().catch(() => false)) {
            await confirmOverwrite.click();
        }
        await page.waitForSelector('#mmNewGame.show', { timeout: 10000 });
        await page.evaluate(() => {
            const numPlayersInput = document.getElementById('mmNumPlayers');
            if (numPlayersInput) numPlayersInput.value = '1';
            window.mmNewGameNext();
            window.mmNewGameNext();
            const playerNameInput = document.getElementById('mmPName_0');
            if (playerNameInput) playerNameInput.value = 'E2E';
            if (typeof window.mmSelectClass === 'function') window.mmSelectClass(0, 'Mago');
            window.mmNewGameNext();
            window.mmFinishNewGame();
        });

        await page.waitForSelector('#mmStarterFlow.show', { timeout: 10000 });
        await page.locator('#mmStarterFlow button:has-text("Chocar o Ovo")').click();
        await page.locator('#mmStarterFlow button:has-text("Começar Aventura")').click();
        await page.locator('#mmStartChoice button:has-text("Pular")').click();
        await page.waitForFunction(() => {
            const choice = document.getElementById('mmStartChoice');
            return !!choice && !choice.classList.contains('show');
        }, null, { timeout: 10000 });
        const setupSave = await page.evaluate(() => {
            const raw = localStorage.getItem('monstrinhomon_state');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed?.state ?? parsed;
        });
        const setupPlayersCount = setupSave?.players?.length ?? 0;
        assert(
            setupPlayersCount >= 1,
            `Novo jogo não criou jogadores via fluxo de UI (encontrado: ${setupPlayersCount}, esperado: >= 1)`
        );

        await page.getByRole('button', { name: /Mundo/ }).click();
        await page.waitForFunction(() => typeof window.showWorldMap === 'function', null, { timeout: 10000 });
        await page.evaluate(async () => {
            await window.showWorldMap();
            window.selectWorldNode('LOC_001');
        });
        await page.waitForSelector('#spotsList .wm-spot:not(.wm-spot--service)', { timeout: 10000 });
        await page.locator('#spotsList .wm-spot:not(.wm-spot--service)').first().click();

        await page.selectOption('#encounterPlayer', { index: 1 });
        await page.locator('#wildSetupPanel button:has-text("Iniciar")').click();
        await page.waitForSelector('#encounterPanel button:has-text("Atacar")', { timeout: 10000 });

        const beforeBattleState = await page.evaluate(() => {
            const raw = localStorage.getItem('monstrinhomon_state');
            const parsed = raw ? JSON.parse(raw) : null;
            const save = parsed?.state ?? parsed ?? {};
            return {
                captureAttempts: save?.stats?.captureAttempts ?? 0,
            };
        });
        await page.evaluate((testMonsterHp) => {
            const enc = window.GameState?.currentEncounter;
            if (!enc?.wildMonster) return;
            enc.wildMonster.hpMax = Math.max(testMonsterHp, Number(enc.wildMonster.hpMax) || testMonsterHp);
            enc.wildMonster.hp = enc.wildMonster.hpMax;
            if (typeof window.renderEncounter === 'function') window.renderEncounter();
        }, safeTestMonsterHp);
        const logCountBeforeAttack = await page.locator('#combatLog > div').count();

        await page.locator('#encounterPanel button:has-text("Atacar")').first().click();
        await page.waitForFunction(
            (previousCount) => document.querySelectorAll('#combatLog > div').length > previousCount,
            logCountBeforeAttack,
            { timeout: 10000 }
        );
        await page.evaluate((guaranteedThreshold) => {
            const enc = window.GameState?.currentEncounter;
            if (!enc?.wildMonster) return;
            // Deixar o alvo em estado de captura para reduzir instabilidade no smoke E2E.
            enc.wildMonster.hp = 1;
            enc.wildMonster.aggression = 0;
            const rarity = enc.wildMonster.rarity || 'Comum';
            if (!window.GameState.config) window.GameState.config = {};
            if (!window.GameState.config.captureScoreThreshold) window.GameState.config.captureScoreThreshold = {};
            window.GameState.config.captureScoreThreshold[rarity] = guaranteedThreshold;
            if (typeof window.renderEncounter === 'function') window.renderEncounter();
        }, guaranteedCaptureThreshold);
        await page.locator('#encounterPanel button:has-text("Capturar")').first().click();
        await page.waitForFunction(
            (initialCaptureAttempts) => {
                const raw = localStorage.getItem('monstrinhomon_state');
                const parsed = raw ? JSON.parse(raw) : null;
                const save = parsed?.state ?? parsed ?? {};
                const nowAttempts = save?.stats?.captureAttempts ?? 0;
                return nowAttempts > initialCaptureAttempts;
            },
            beforeBattleState.captureAttempts,
            { timeout: 10000 }
        );

        const afterBattleState = await page.evaluate(() => {
            const raw = localStorage.getItem('monstrinhomon_state');
            const parsed = raw ? JSON.parse(raw) : null;
            const save = parsed?.state ?? parsed ?? {};
            return {
                captureAttempts: save?.stats?.captureAttempts ?? 0,
            };
        });
        assert(
            afterBattleState.captureAttempts >= beforeBattleState.captureAttempts + 1,
            `A tentativa de captura não foi registrada (antes: ${beforeBattleState.captureAttempts}, depois: ${afterBattleState.captureAttempts})`
        );

        const battleContinueButton = page.locator('#encounterPanel button:has-text("Continuar")').first();
        if (await battleContinueButton.isVisible().catch(() => false)) {
            await battleContinueButton.click();
        }

        await page.getByRole('button', { name: /Menu principal/ }).click();
        await page.getByRole('button', { name: /Gerenciar Saves/ }).click();
        await page.locator('#mmSavesScreen button:has-text("Salvar agora")').click();
        await page.locator('#mmSavesScreen button:has-text("Voltar")').click();

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('#mmIntro button:has-text("Jogar")').click();
        await page.locator('#mmMenu button:has-text("Continuar")').click();
        const startChoiceSkip = page.locator('#mmStartChoice button:has-text("Pular")');
        if (await startChoiceSkip.isVisible().catch(() => false)) {
            await startChoiceSkip.click();
        }

        const persistedCaptureAttempts = await page.evaluate(() => {
            const raw = localStorage.getItem('monstrinhomon_state');
            const parsed = raw ? JSON.parse(raw) : null;
            const save = parsed?.state ?? parsed ?? {};
            return save?.stats?.captureAttempts ?? 0;
        });
        assert(
            persistedCaptureAttempts >= beforeBattleState.captureAttempts + 1,
            `Save/Continue não preservou tentativa de captura (antes: ${beforeBattleState.captureAttempts}, persistido: ${persistedCaptureAttempts})`
        );

        for (const host of blockedHosts) {
            assert(expectedBlockedHosts.has(host), `Dependência externa inesperada: ${host}`);
        }
        const unexpectedConsoleErrors = consoleErrors.filter((msg) =>
            !allowedConsoleErrorPatterns.some((pattern) => pattern.test(msg))
        );
        assert(pageErrors.length === 0, `Erros JavaScript na página: ${pageErrors.join(' | ')}`);
        assert(unexpectedConsoleErrors.length === 0, `Console errors inesperados: ${unexpectedConsoleErrors.join(' | ')}`);
        console.log('✅ E2E Wild Loop smoke passou (Playwright)');
    } finally {
        await context.close();
        await browser.close();
        await close();
    }
}

run().catch((error) => {
    console.error('❌ E2E Wild Loop smoke falhou:', error);
    process.exitCode = 1;
});
