/*
 Playtest tool for Deep Space Trader

 - Launches the live site
 - Starts a new game
 - Completes onboarding/tutorial
 - Performs trading loops (buy low/sell later) using Basic QBiT Inverter (itemId 1)
 - Attempts to buy and use Quantum Processors (itemId 5)
 - Optionally enables cheats to reach target QPs if progress stalls (--allow-cheats)

 Usage:
   node scripts/playtest.js [--targetQPs=6] [--maxLoops=40] [--headless] [--slowMo=0] [--allow-cheats]

 Note:
 - Uses Puppeteer (bundles Chromium) so no separate browser install needed.
 - Captures screenshots into ./qa-artifacts
*/

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function parseArgs() {
    const args = process.argv.slice(2);
    const out = {
        url: 'https://deepspacetrader.github.io/',
        targetQPs: 6,
        maxLoops: 40,
        headless: true,
        slowMo: 0,
        allowCheats: false,
    };
    for (const a of args) {
        if (a.startsWith('--targetQPs=')) out.targetQPs = parseInt(a.split('=')[1], 10) || 6;
        else if (a.startsWith('--maxLoops=')) out.maxLoops = parseInt(a.split('=')[1], 10) || 40;
        else if (a.startsWith('--slowMo=')) out.slowMo = parseInt(a.split('=')[1], 10) || 0;
        else if (a === '--headed') out.headless = false;
        else if (a === '--headless') out.headless = true;
        else if (a === '--allow-cheats') out.allowCheats = true;
        else if (a.startsWith('--url=')) out.url = a.split('=')[1];
    }
    return out;
}

const SELECTORS = {
    startButton: '.game-menu .start-button',
    marketQBit: ".market-item[data-item-id='1']",
    invQBitUseOne: ".inv-item[data-item-id='1'] .use-buttons button:nth-of-type(1)",
    invQBitUseAll: ".inv-item[data-item-id='1'] .use-buttons .use-all-btn",
    marketQP: ".market-item[data-item-id='5']",
    invQPUseAll: ".inv-item[data-item-id='5'] .use-buttons .use-all-btn",
    continueBtn: '.onboarding-box button',
    nextTraderBtn: '.btn--travel__next',
    nextGalaxyBtn: '.next-galaxy-button',
    tierMenuSortPrice: '.tiered-menu button:nth-of-type(2)',
    quantumCount: '.quantum-info .highlight', // there are two spans: [0]=available, [1]=active X/6
    adminCheatsToggleBtn: '.admin-debug .cheats-toggle button', // Show Cheats / Hide Cheats
    adminQPInput: '.admin-debug .qp-input',
    adminQPAddBtn: '.admin-debug .form-group:nth-of-type(3) .button-group button:first-of-type',
};

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function screenshot(page, dir, name) {
    await ensureDir(dir);
    const file = path.join(dir, `${Date.now()}_${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`[screenshot] ${file}`);
}

async function waitVisible(page, selector, timeout = 15000) {
    await page.waitForSelector(selector, { timeout, visible: true });
}

async function safeClick(page, selector, options = {}) {
    const el = await page.$(selector);
    if (!el) return false;
    await el.click(options);
    return true;
}

async function safeRightClick(page, selector) {
    const el = await page.$(selector);
    if (!el) return false;
    const box = await el.boundingBox();
    if (!box) return false;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
    return true;
}

async function getQuantumStatus(page) {
    // Returns { available: number, active: number }
    const spans = await page.$$(SELECTORS.quantumCount);
    let available = 0;
    let active = 0;
    if (spans.length >= 1) {
        const t0 = (await page.evaluate((el) => el.textContent || '', spans[0])).trim();
        available = parseInt(t0.replace(/[^0-9]/g, ''), 10) || 0;
    }
    if (spans.length >= 2) {
        const t1 = (await page.evaluate((el) => el.textContent || '', spans[1])).trim();
        const m = t1.match(/(\d+)\s*\/\s*(\d+)/);
        if (m) active = parseInt(m[1], 10) || 0;
    }
    return { available, active };
}

async function completeTutorial(page, artifactsDir) {
    await waitVisible(page, SELECTORS.startButton);
    await screenshot(page, artifactsDir, 'main_menu');
    await safeClick(page, SELECTORS.startButton);
    await page.waitForTimeout(1500);

    // Step 1: Buy QBiT
    await waitVisible(page, SELECTORS.marketQBit);
    await safeClick(page, SELECTORS.marketQBit);
    // Step 2: Sell QBiT (right-click)
    await safeRightClick(page, SELECTORS.marketQBit);
    // Step 3: Buy QBiT again
    await safeClick(page, SELECTORS.marketQBit);

    // Step 4: Use QBiT once
    await page.waitForSelector(".inv-item[data-item-id='1']", { timeout: 10000 });
    await waitVisible(page, SELECTORS.invQBitUseOne, 10000);
    await safeClick(page, SELECTORS.invQBitUseOne);

    // Step 5/6: Continue then Next Trader
    await page.waitForSelector(SELECTORS.continueBtn, { timeout: 10000 });
    await safeClick(page, SELECTORS.continueBtn);

    await waitVisible(page, SELECTORS.nextTraderBtn, 10000);
    await safeClick(page, SELECTORS.nextTraderBtn);
    await page.waitForTimeout(3500);

    // Step 7: Next Galaxy
    await waitVisible(page, SELECTORS.nextGalaxyBtn, 10000);
    await safeClick(page, SELECTORS.nextGalaxyBtn);
    await page.waitForTimeout(3500);

    await screenshot(page, artifactsDir, 'post_tutorial');
}

async function buySellQBitCycle(page, count = 5) {
    // Buy N QBiTs
    for (let i = 0; i < count; i += 1) {
        const ok = await safeClick(page, SELECTORS.marketQBit);
        if (!ok) break;
        await page.waitForTimeout(120);
    }
    // Travel next trader
    await safeClick(page, SELECTORS.nextTraderBtn);
    await page.waitForTimeout(3500);
    // Sell N QBiTs
    for (let i = 0; i < count; i += 1) {
        const ok = await safeRightClick(page, SELECTORS.marketQBit);
        if (!ok) break;
        await page.waitForTimeout(120);
    }
}

async function tryBuyAndUseQP(page) {
    // Sort by Price (toggle twice to land on ascending consistently)
    await safeClick(page, SELECTORS.tierMenuSortPrice);
    await page.waitForTimeout(150);
    await safeClick(page, SELECTORS.tierMenuSortPrice);
    await page.waitForTimeout(300);

    // Attempt to buy QP twice (if credit allows)
    let purchased = 0;
    for (let i = 0; i < 2; i += 1) {
        const ok = await safeClick(page, SELECTORS.marketQP);
        if (ok) purchased += 1;
        await page.waitForTimeout(650); // wait for delivery (0.42s) and UI
    }
    // Use all QPs if present in inventory
    const invQP = await page.$(".inv-item[data-item-id='5']");
    if (invQP) {
        await safeClick(page, SELECTORS.invQPUseAll);
        await page.waitForTimeout(300);
    }
    return purchased;
}

async function enableCheatsAndAddQPs(page, targetQPs) {
    // Listen for prompt dialog and answer "yes"
    const onDialog = async (dialog) => {
        try {
            if (dialog.type() === 'prompt') await dialog.accept('yes');
            else await dialog.accept();
        } catch (e) {
            console.warn('Dialog handling error:', e.message);
        }
    };
    page.on('dialog', onDialog);
    try {
        // Open Cheats (first button toggles: Show Cheats)
        await safeClick(page, SELECTORS.adminCheatsToggleBtn);
        await page.waitForTimeout(800);
        // Set QP amount to 1 and click Add repeatedly up to target
        const { available, active } = await getQuantumStatus(page);
        let current = available + active;
        while (current < targetQPs) {
            // Ensure input value is 1
            const qpInput = await page.$(SELECTORS.adminQPInput);
            if (qpInput) {
                await qpInput.click({ clickCount: 3 });
                await qpInput.type('1');
            }
            await safeClick(page, SELECTORS.adminQPAddBtn);
            await page.waitForTimeout(250);
            // Use all QPs then re-check
            const invQP = await page.$(".inv-item[data-item-id='5']");
            if (invQP) {
                await safeClick(page, SELECTORS.invQPUseAll);
                await page.waitForTimeout(200);
            }
            const st = await getQuantumStatus(page);
            current = st.available + st.active;
            if (current >= targetQPs) break;
        }
    } finally {
        page.off('dialog', onDialog);
    }
}

async function main() {
    const cfg = parseArgs();
    const artifactsDir = path.resolve(process.cwd(), 'qa-artifacts');
    await ensureDir(artifactsDir);

    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: cfg.headless, slowMo: cfg.slowMo });
    const page = await browser.newPage();
    page.setDefaultTimeout(25000);

    try {
        console.log(`Navigating to ${cfg.url}`);
        await page.goto(cfg.url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        await completeTutorial(page, artifactsDir);

        let { available, active } = await getQuantumStatus(page);
        console.log(`Initial Quantum status: available=${available}, active=${active}`);

        let totalQPs = available + active;
        let loops = 0;

        while (totalQPs < cfg.targetQPs && loops < cfg.maxLoops) {
            loops += 1;
            console.log(
                `Loop ${loops} - QPs=${totalQPs}. Trading for credits, attempting QP buys...`
            );

            // Try a QP buy/use attempt on current trader/galaxy
            await tryBuyAndUseQP(page);

            // Do a QBiT buy/sell cycle to grind credits
            await buySellQBitCycle(page, 5);

            // Occasionally change galaxy to vary markets
            if (loops % 3 === 0) {
                await safeClick(page, SELECTORS.nextGalaxyBtn);
                await page.waitForTimeout(3500);
            }

            // Re-check quantum status
            const st = await getQuantumStatus(page);
            available = st.available;
            active = st.active;
            totalQPs = available + active;

            if (loops % 2 === 0) await screenshot(page, artifactsDir, `progress_loop_${loops}`);
        }

        if (totalQPs < cfg.targetQPs && cfg.allowCheats) {
            console.log(
                'Target not reached within max loops. Enabling cheats fallback to finish...'
            );
            await enableCheatsAndAddQPs(page, cfg.targetQPs);
            const st = await getQuantumStatus(page);
            available = st.available;
            active = st.active;
            totalQPs = available + active;
        }

        await screenshot(page, artifactsDir, 'final_state');

        if (totalQPs >= cfg.targetQPs) {
            console.log(
                `SUCCESS: Achieved ${totalQPs} Quantum Processors (target ${cfg.targetQPs}).`
            );
            process.exitCode = 0;
        } else {
            console.log(
                `PARTIAL: Reached ${totalQPs}/${cfg.targetQPs} Quantum Processors after ${loops} loops.`
            );
            process.exitCode = 2;
        }
    } catch (err) {
        console.error('Playtest failed:', err);
        try {
            await screenshot(page, artifactsDir, 'error');
        } catch (_) {}
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

main();
