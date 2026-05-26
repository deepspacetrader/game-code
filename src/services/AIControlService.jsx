/**
 * AI Control Service - Strategy Execution Framework
 * Manages AI-driven gameplay with fast refresh loops and human feedback
 *
 * Uses the AIControllerProtocol for system prompts, game snapshots,
 * and action validation.
 */

import { lmStudioService } from './LMStudioService';
import {
  AI_CONTROLLER_SYSTEM_PROMPT,
  FAST_SYSTEM_PROMPT,
  validateAction,
  parseFastAction,
  analyzeStateForAI,
  ACTIONS_CATALOG,
} from './AIControllerProtocol';

class AIControlService {
  constructor() {
    this.isActive = false;
    this.strategy = null;
    this.loopPromise = null;
    this.feedbackHistory = [];
    this.lastActionTime = 0;
    this.lastActionResult = null;

    // Training mode: wait for human feedback after each action
    this.trainingMode = false;
    this.trainingPaused = false;
    this.pendingActionForFeedback = null;
    this.totalFeedbacksCompleted = 0;

    // Callbacks for game state and actions
    this.onGameStateUpdate = null;
    this.onActionExecute = null;
    this.onFeedback = null;
  }

  /**
   * Set training mode. When enabled, the AI pauses after each action
   * until the human provides feedback.
   */
  setTrainingMode(enabled) {
    this.trainingMode = enabled;
    if (!enabled) {
      this.trainingPaused = false;
      this.pendingActionForFeedback = null;
    }
  }

  /**
   * Resume from training pause (called after human gives feedback)
   */
  resumeFromTraining() {
    if (this.trainingMode && this.trainingPaused) {
      this.trainingPaused = false;
      this.pendingActionForFeedback = null;
    }
  }

  /**
   * Start AI control with a strategy.
   * Clears previous feedback history so each training run starts fresh.
   */
  start(strategy) {
    // Clear previous run's feedback for clean training runs
    this.feedbackHistory = [];
    this.totalFeedbacksCompleted = 0;
    this.trainingPaused = false;
    this.pendingActionForFeedback = null;
    this.lastActionResult = null;

    this.strategy = strategy;
    this.isActive = true;
    this.loopPromise = this.runLoop();
    console.log('AI Control Service started with strategy:', strategy.name || 'unnamed');
  }

  /**
   * Stop AI control
   */
  stop() {
    this.isActive = false;
    this.loopPromise = null;
    console.log('AI Control Service stopped');
  }

  /**
   * Continuous decision loop — runs as fast as the AI model responds.
   * No fixed interval; each cycle is: get state → decide → execute → repeat.
   */
  async runLoop() {
    while (this.isActive) {
      try {
        // Training mode: pause after each action until human gives feedback
        if (this.trainingMode && this.trainingPaused) {
          await this._sleep(200);
          continue;
        }

        const gameState = await this.onGameStateUpdate?.();

        if (gameState && this.strategy) {
          // Attach last action result so the model can learn from failures
          if (this.lastActionResult) {
            gameState._lastResult = this.lastActionResult;
          }

          const action = await this.strategy.decide(gameState);

          if (action) {
            console.log(`[AI] Action: ${action.action}`, action.params || '');
            await this.executeAction(action);
          }
        }
      } catch (error) {
        console.error('AI loop error:', error);
      }
    }
  }

  /**
   * Execute a game action
   */
  async executeAction(action) {
    if (!action || !this.onActionExecute) return;

    this.lastActionTime = Date.now();

    try {
      const result = await this.onActionExecute(action);

      // Track last result so the model can learn from failures
      if (!result || !result.success) {
        this.lastActionResult = {
          action: action.action,
          error: result?.error || 'unknown',
          params: action.params,
        };
      } else {
        this.lastActionResult = null;
      }

      // Log action for feedback
      this.feedbackHistory.push({
        timestamp: Date.now(),
        action,
        result,
        feedback: null,
      });

      // Keep only last 100 actions
      if (this.feedbackHistory.length > 100) {
        this.feedbackHistory.shift();
      }

      // Training mode: pause and wait for human feedback
      if (this.trainingMode) {
        this.trainingPaused = true;
        this.pendingActionForFeedback = this.feedbackHistory[this.feedbackHistory.length - 1];
      }

      return result;
    } catch (error) {
      console.error('Error executing action:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for the last action
   */
  submitFeedback(feedback) {
    const lastAction = this.feedbackHistory[this.feedbackHistory.length - 1];
    if (lastAction) {
      this._applyFeedback(lastAction, feedback);
    }
  }

  /**
   * Rate a specific action entry (for stacked feedback view).
   */
  rateAction(entry, feedback) {
    const found = this.feedbackHistory.find((e) => e.timestamp === entry.timestamp && e.action?.action === entry.action?.action);
    if (found) {
      this._applyFeedback(found, feedback);
    }
  }

  /**
   * Internal: apply feedback to an entry and handle side effects.
   */
  _applyFeedback(entry, feedback) {
    entry.feedback = feedback;
    this.totalFeedbacksCompleted++;

    // Auto-resume from training pause after feedback given
    if (this.trainingMode && this.trainingPaused) {
      this.trainingPaused = false;
      this.pendingActionForFeedback = null;
    }

    if (this.onFeedback) {
      this.onFeedback(entry);
    }

    console.log(`Feedback submitted: ${feedback} for action:`, entry.action);
  }

  /**
   * Create a prompt-based strategy using the AIControllerProtocol
   */
  createPromptStrategy(userPrompt, options = {}) {
    const strategy = {
      name: options.name || 'Prompt Strategy',
      prompt: userPrompt,
      userPrompt,
      strategyId: `strategy_${Date.now()}`,
      decide: async (gameState) => {
        const isAvailable = await lmStudioService.isAvailable();
        if (!isAvailable) {
          return null;
        }

        const systemPrompt = `${AI_CONTROLLER_SYSTEM_PROMPT}

## YOUR SPECIFIC STRATEGY
${userPrompt}

## CURRENT GAME STATE
${JSON.stringify(gameState, null, 2)}

Respond with a JSON action object only.`;

        try {
          const response = await lmStudioService.generateResponse(
            'What action should I take next?',
            {
              model: lmStudioService.defaultModel,
              systemPrompt,
              maxTokens: 1024,
              temperature: options.temperature || 0.5,
            }
          );

          const validated = validateAction(response);
          if (validated.valid) {
            return {
              action: validated.action,
              params: validated.params,
              reason: validated.reason,
            };
          }

          console.warn('AI returned invalid action:', validated.error, response);
          return null;
        } catch (error) {
          console.error('Error in prompt strategy:', error);
          return null;
        }
      },
    };

    return strategy;
  }

  /**
   * Create a FAST prompt strategy for small models (1B-3B params).
   * Uses condensed system prompt (~400 tokens), compact state format,
   * and parses short-form action responses.
   * Designed for 300-600ms decision cycles.
   */
  createFastPromptStrategy(userStrategy, options = {}) {
    const strategy = {
      name: options.name || 'Fast Strategy',
      strategyId: `fast_strategy_${Date.now()}`,
      decide: async (gameState) => {
        const isAvailable = await lmStudioService.isAvailable();
        if (!isAvailable) {
          return null;
        }

        // Pre-analyze state into a digest small models can actually use
        const analysis = analyzeStateForAI(gameState, userStrategy);
        const systemPrompt = `${FAST_SYSTEM_PROMPT}

## Analysis
${analysis}

## Action?`;

        try {
          const response = await lmStudioService.generateResponse(
            'go',
            {
              model: lmStudioService.defaultModel,
              systemPrompt,
              maxTokens: options.maxTokens || 1024,
              temperature: options.temperature || 0.2,
            }
          );

          console.log(`[AI Raw] ${response}`);

          const parsed = parseFastAction(response);
          if (parsed && parsed.action) {
            console.log(`[AI Parsed] ${parsed.action}`, parsed.params);
            return parsed;
          }

          const validated = validateAction(response);
          if (validated.valid) {
            return {
              action: validated.action,
              params: validated.params,
              reason: validated.reason,
            };
          }

          console.warn('[AI] No valid action in response');
          return null;
        } catch (error) {
          console.warn('[AI] Error:', error);
          return null;
        }
      },
    };

    return strategy;
  }
  /**
   * Create a LOCAL strategy — no LM Studio or external LLM needed.
   * Parses the human's strategy prompt into rules, then makes fast decisions
   * using the game snapshot and the AIControllerProtocol action catalog.
   *
   * Designed for the fast snapshot format (single-letter keys from getFastGameSnapshot).
   * Runs in <1ms per decision cycle.
   */
  createLocalStrategy(userPrompt, options = {}) {
    const rules = this._parseStrategyPrompt(userPrompt);

    console.log('[AI Local] Extracted rules:', rules);

    const strategy = {
      name: options.name || 'Local Rule Strategy',
      prompt: userPrompt,
      strategyId: `local_${Date.now()}`,
      _rules: rules,
      decide: (gameState) => {
        const decision = this._makeDecision(gameState, rules);
        return decision;
      },
    };

    return strategy;
  }

  /**
   * Parse a free-form strategy prompt into concrete trading rules.
   * Uses simple pattern matching — no LLM needed.
   */
  _parseStrategyPrompt(prompt) {
    const lower = (prompt || '').toLowerCase();

    const rules = {
      // Buy: default 5% below base
      buyThreshold: this._extractPercent(lower, ['below', 'under', 'beneath', 'less than']) || 0.05,
      // Sell: default 5% above base
      sellThreshold: this._extractPercent(lower, ['above', 'over', 'more than']) || 0.05,

      // Fuel: default keep above 50
      minFuel: this._extractNumberAfter(lower, ['fuel above', 'fuel at least', 'keep fuel', 'minimum fuel']) || 50,

      // Credits: default 0 reserve (spend freely in small amounts per item)
      creditReserve: this._extractNumberAfter(lower, ['reserve', 'keep', 'minimum credits']) || 0,
      maxSpendPercent: this._extractPercent(lower, ['spend', 'spending', 'use']) || 50,

      // Item focus / avoidance
      focusItems: this._extractKeywords(lower, ['focus on', 'prioritize', 'specialize in', 'prefer']),
      avoidIllegal: lower.includes('avoid illegal') || lower.includes('no illegal'),
      preferIllegal: lower.includes('illegal') && !lower.includes('avoid illegal') && !lower.includes('no illegal'),

      // Play style
      aggressive: lower.includes('aggressive') || lower.includes('risk') || lower.includes('maximum profit'),
      conservative: lower.includes('conservative') || lower.includes('safe') || lower.includes('cautious'),
      explorer: lower.includes('explore') || lower.includes('travel frequently') || lower.includes('visit'),

      // Special focus
      quantumFocus: lower.includes('quantum') || lower.includes('processor') || lower.includes('ai level'),
      fuelPriority: lower.includes('fuel') && (lower.includes('high') || lower.includes('full') || lower.includes('always')),

      // Target-buy: "buy at least 10 of item: Basic QBiT Inverter then use them"
      targetBuy: this._parseTargetBuy(prompt),
      useTargetItems: lower.includes('then use') || lower.includes('use them') || lower.includes('use all') || lower.includes('increase ai'),
    };

    return rules;
  }

  /**
   * Parse "buy at least N of item: X [then use them]" patterns.
   */
  _parseTargetBuy(text) {
    if (!text) return null;
    const lower = text.toLowerCase();

    // Pattern: "buy at least N of item: X" or "buy N of item: X"
    const patterns = [
      /buy\s+at\s+least\s+(\d+)\s+of\s+item:?\s*(.+?)(?:\.|then|$|\n)/i,
      /buy\s+(\d+)\s+of\s+item:?\s*(.+?)(?:\.|then|$|\n)/i,
      /buy\s+at\s+least\s+(\d+)\s+(.+?)(?:\.|then|$|\n)/i,
    ];

    for (const pat of patterns) {
      const match = text.match(pat);
      if (match) {
        const quantity = parseInt(match[1]);
        let itemName = match[2].trim().replace(/\.$/, '').replace(/\s+then.*/i, '').trim();
        // Check if "then use" follows
        const useAfter = lower.includes('then use') || lower.includes('use them');
        return { item: itemName, quantity, useAfter };
      }
    }

    return null;
  }

  /**
   * Extract a percentage value from text near a keyword.
   * Handles "10% below", "20 percent above", "below 15%", etc.
   */
  _extractPercent(text, keywords) {
    if (!text) return null;

    // Pattern 1: number% before keyword: "10% below", "20% above"
    for (const kw of keywords) {
      const before = text.match(new RegExp(`(\\d+)\\s*%?\\s*${kw}`, 'i'));
      if (before) return parseInt(before[1]) / 100;
    }

    // Pattern 2: keyword before number%: "below 15%", "above 20%"
    for (const kw of keywords) {
      const after = text.match(new RegExp(`${kw}\\s+(\\d+)\\s*%`, 'i'));
      if (after) return parseInt(after[1]) / 100;
    }

    return null;
  }

  /**
   * Extract a number value that appears after one of the given phrases.
   * Handles "keep fuel above 50", "minimum fuel 30", etc.
   */
  _extractNumberAfter(text, phrases) {
    if (!text) return null;

    for (const phrase of phrases) {
      // "fuel above 50", "keep fuel 50", etc.
      const match = text.match(new RegExp(`${phrase}\\D{0,5}(\\d+)`, 'i'));
      if (match) return parseInt(match[1]);
    }

    return null;
  }

  /**
   * Extract comma-separated keywords/phrases from text near a lead-in.
   * e.g. "focus on quantum processors and AI items" → ['quantum processors', 'ai items']
   */
  _extractKeywords(text, leadIns) {
    if (!text) return [];

    for (const lead of leadIns) {
      const idx = text.indexOf(lead);
      if (idx === -1) continue;

      const after = text.slice(idx + lead.length).trim();
      // Take up to the next sentence period or end
      const end = after.search(/[.!\n]/);
      const segment = (end === -1 ? after : after.slice(0, end)).trim();

      // Split by commas, 'and', 'or'
      const items = segment
        .split(/,|\band\b|\bor\b/)
        .map((s) => s.trim().replace(/^items?\s*/i, ''))
        .filter((s) => s.length > 0);

      if (items.length > 0) return items;
    }

    return [];
  }

  /**
   * Core decision logic. Evaluates game state against extracted rules
   * and returns a protocol-format action.
   *
   * Priority order:
   *   1. Handle encounters (attack/escape/bribe/chooseLeft/chooseRight)
   *   2. Check if traveling → wait
   *   3. Buy fuel if below threshold
   *   4. Sell items that meet profit threshold
   *   5. Buy items that meet discount threshold
   *   6. Travel to next trader if nothing to do
   */
  _makeDecision(gameState, rules) {
    if (!gameState) return { action: 'wait', params: {}, reason: 'No game state' };

    const p = gameState.p || {};
    const m = gameState.m || [];
    const inv = gameState.i || [];
    const enc = gameState.e || null;

    const credits = p.c ?? 0;
    const fuel = p.f ?? 0;
    const health = p.h ?? 100;
    const traveling = p.it ?? false;
    const traderIdx = p.ti ?? 0;
    const totalTraders = p.nt ?? 1;
    const fuelPrice = p.fp ?? 5;

    // ---- 1. ENCOUNTERS ----
    if (enc) {
      if (enc.ty === 'e' || enc.type === 'enemy') {
        const enemyHp = enc.nh || enc.enemyHealth || 0;
        // If enemy is low health, attack; otherwise escape
        if (enemyHp < 15 || rules.aggressive) {
          return { action: 'attack', params: {}, reason: 'Enemy weak, attacking' };
        }
        if (credits > 500) {
          return { action: 'bribe', params: {}, reason: 'Bribing enemy' };
        }
        return { action: 'escape', params: {}, reason: 'Fleeing combat' };
      }
      if (enc.ty === 'd' || enc.type === 'danger') {
        return { action: 'chooseLeft', params: {}, reason: '50/50 danger choice' };
      }
    }

    // ---- 2. TRAVELING ----
    if (traveling) {
      return { action: 'wait', params: {}, reason: 'In transit, waiting' };
    }

    // ---- 3. FUEL ----
    if (fuel < rules.minFuel && fuelPrice > 0) {
      const buyAmount = Math.min(100, Math.round((rules.minFuel + 50 - fuel)));
      if (buyAmount > 0 && credits >= buyAmount * fuelPrice) {
        return { action: 'buyFuel', params: { amount: buyAmount }, reason: `Fuel ${fuel}, buying ${buyAmount}` };
      }
    }

    // ---- 4. TARGET BUY ITEMS ----
    // If user specified "buy at least N of item: X then use them",
    // handle that before regular buy/sell logic.
    if (rules.targetBuy) {
      const targetName = rules.targetBuy.item.toLowerCase();
      const targetQty = rules.targetBuy.quantity;
      const owned = inv.find((x) => (x.n || x.name || '').toLowerCase().includes(targetName));
      const ownedQty = owned ? (owned.q || owned.quantity || 1) : 0;

      // Find the item in the current market
      const marketItem = m.find((x) => (x.n || x.name || '').toLowerCase().includes(targetName));

      if (rules.targetBuy.useAfter && ownedQty >= targetQty) {
        // Have enough — use them
        return { action: 'useItem', params: { item: owned.n || owned.name }, reason: `Using ${owned.n || owned.name} (have ${ownedQty}/${targetQty})` };
      }

      if (ownedQty < targetQty && marketItem) {
        const price = marketItem.p ?? marketItem.price ?? 0;
        const stock = marketItem.s ?? marketItem.stock ?? 0;
        if (stock > 0 && price > 0 && credits >= price) {
          return { action: 'buy', params: { item: marketItem.n || marketItem.name }, reason: `Buying target item (${ownedQty}/${targetQty})` };
        }
      }

      if (ownedQty < targetQty && !marketItem) {
        // Target not available here — travel to find it
        if (fuel > rules.minFuel + 10) {
          return { action: 'nextTrader', params: {}, reason: 'Searching for target item' };
        }
      }
    }

    // ---- 5. USE ITEMS (boosters, meds, AI enhancers) ----
    // Before selling, check if we should use items instead.
    // Strategy may say "use them all" or we may have items meant for use.
    for (const item of inv) {
      const name = item.n || item.name;
      const qty = item.q || item.quantity || 0;
      if (!name || qty <= 0) continue;

      // If the strategy says to use target items, only use the target item
      if (rules.targetBuy && rules.targetBuy.useAfter) {
        const targetName = rules.targetBuy.item.toLowerCase();
        if (!name.toLowerCase().includes(targetName)) continue;
      }

      // Use items identified as usable (AI boosters, medkits, etc.)
      const lower = name.toLowerCase();
      const isUsable = lower.includes('multimed') || lower.includes('medkit')
        || lower.includes('ai') || lower.includes('booster')
        || lower.includes('processor') || lower.includes('quantum');

      if (isUsable && rules.useTargetItems) {
        return { action: 'useItem', params: { item: name }, reason: `Using ${name} per strategy` };
      }
    }

    // ---- 6. SELL ----
    // Find items in inventory that are profitable to sell at current trader
    for (const item of inv) {
      const name = item.n || item.name;
      const qty = item.q || item.quantity || 1;
      if (!name || qty <= 0) continue;

      // Find this item in the current market (to check sell price)
      const marketItem = m.find((x) => (x.n || x.name) === name);
      if (marketItem) {
        const marketPrice = marketItem.p ?? marketItem.price ?? 0;
        const basePrice = marketItem.bp ?? marketItem.basePrice ?? 0;

        // Sell if price is above base + threshold
        if (marketPrice > 0 && basePrice > 0 && marketPrice >= basePrice * (1 + rules.sellThreshold)) {
          return { action: 'sell', params: { item: name }, reason: `${name} at ${marketPrice} > base ${basePrice}` };
        }
      }

      // If item is not in market but we have it, still consider selling
      // (some items like quantum processors are valuable anywhere)
      if (name.includes('Quantum Processor') && credits > 0) {
        return { action: 'sell', params: { item: name }, reason: 'Selling QP for credits' };
      }
    }

    // ---- 7. BUY (fallback if no target item) ----
    if (credits > rules.creditReserve) {
      const maxUnitPrice = Math.max(credits * (rules.maxSpendPercent / 100), credits * 0.1);

      // Score market items to find the best buy
      let bestItem = null;
      let bestScore = -Infinity;

      for (const item of m) {
        const name = item.n || item.name;
        const price = item.p ?? item.price ?? 0;
        const basePrice = item.bp ?? item.basePrice ?? 0;
        const stock = item.s ?? item.stock ?? 0;

        if (stock <= 0 || price <= 0 || price > credits) continue;

        // Check item restrictions
        if (rules.focusItems.length > 0) {
          const matchesFocus = rules.focusItems.some((f) =>
            name.toLowerCase().includes(f.toLowerCase())
          );
          if (!matchesFocus) continue;
        }

        // Score: bigger discount from base = better
        const discount = basePrice > 0 ? (basePrice - price) / basePrice : 0;
        if (discount >= rules.buyThreshold && price <= maxUnitPrice) {
          // Bonus for items matching play style
          let score = discount;
          if (name.includes('Quantum') && rules.quantumFocus) score += 0.3;
          if (rules.aggressive && rules.preferIllegal && name.includes('Illegal')) score += 0.2;
          if (rules.conservative && name.includes('Illegal')) score -= 0.5;
          if (rules.avoidIllegal && name.includes('Illegal')) score = -999;

          if (score > bestScore) {
            bestScore = score;
            bestItem = { name, price, basePrice, discount };
          }
        }
      }

      if (bestItem) {
        return {
          action: 'buy',
          params: { item: bestItem.name },
          reason: `${bestItem.name} ${Math.round(bestItem.discount * 100)}% below base`,
        };
      }
    }

    // ---- 8. TRAVEL ----
    // Nothing profitable to do — move to next trader
    if (fuel > rules.minFuel + 10) {
      if (traderIdx < totalTraders - 1) {
        return { action: 'nextTrader', params: {}, reason: 'No deals, moving to next trader' };
      } else if (rules.explorer) {
        return { action: 'travelGalaxy', params: {}, reason: 'Explored all traders, jumping galaxy' };
      }
      // Loop back to first trader
      return { action: 'nextTrader', params: {}, reason: 'Checking other traders' };
    }

    // ---- 9. WAIT ----
    return { action: 'wait', params: {}, reason: 'No action available' };
  }

  /**
   * Sleep/pause helper for the training mode loop.
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all actions that haven't been reviewed with feedback yet.
   */
  getUnreviewedActions() {
    return this.feedbackHistory.filter((entry) => !entry.feedback);
  }

  /**
   * Analyze feedback history and generate a recommended strategy prompt.
   * Called after every 10 feedback ratings.
   * Returns { recommendation: string, stats: object }
   */
  generateStrategyRecommendation() {
    const reviewed = this.feedbackHistory.filter((e) => e.feedback);
    const lastBatch = reviewed.slice(-10);

    // Count good/neutral/bad per action type
    const actionCounts = {};
    for (const entry of lastBatch) {
      const act = entry.action?.action || 'unknown';
      if (!actionCounts[act]) actionCounts[act] = { positive: 0, neutral: 0, negative: 0 };
      actionCounts[act][entry.feedback]++;
    }

    // Build recommendation text
    const lines = [];
    const overallPositive = lastBatch.filter((e) => e.feedback === 'positive').length;
    const overallNegative = lastBatch.filter((e) => e.feedback === 'negative').length;

    lines.push(`Based on the last ${lastBatch.length} actions:`);
    lines.push(`Overall: ${overallPositive} good, ${overallNegative} bad, ${lastBatch.length - overallPositive - overallNegative} neutral`);

    for (const [act, counts] of Object.entries(actionCounts)) {
      const total = counts.positive + counts.neutral + counts.negative;
      if (total === 0) continue;
      const goodPct = Math.round((counts.positive / total) * 100);
      const badPct = Math.round((counts.negative / total) * 100);
      if (goodPct >= 60) {
        lines.push(`- ${act}: Mostly GOOD (${goodPct}%) — keep doing this`);
      } else if (badPct >= 60) {
        lines.push(`- ${act}: Mostly BAD (${badPct}%) — avoid or adjust`);
      } else {
        lines.push(`- ${act}: Mixed (${goodPct}% good, ${badPct}% bad)`);
      }
    }

    // Generate a suggested strategy prompt
    const suggestedPrompt = this._generateSuggestedPrompt(actionCounts, overallPositive, overallNegative, lastBatch.length);

    return {
      recommendation: lines.join('\n'),
      stats: { total: lastBatch.length, positive: overallPositive, negative: overallNegative },
      suggestedPrompt,
    };
  }

  /**
   * Generate a human-readable strategy prompt based on feedback analysis.
   */
  _generateSuggestedPrompt(actionCounts, overallPositive, overallNegative, total) {
    const parts = [];

    // Buy suggestions
    const buyStats = actionCounts['buy'];
    if (buyStats) {
      const buyGood = buyStats.positive / (buyStats.positive + buyStats.neutral + buyStats.negative);
      if (buyGood >= 0.6) {
        parts.push('Continue buying items when price is below base price.');
      } else if (buyStats.negative > buyStats.positive) {
        parts.push('Be more selective when buying — only buy items at a significant discount to base price.');
      } else {
        parts.push('Buy items when price is below base price.');
      }
    } else {
      parts.push('Buy items when price is below base price.');
    }

    // Sell suggestions
    const sellStats = actionCounts['sell'];
    if (sellStats) {
      const sellGood = sellStats.positive / (sellStats.positive + sellStats.neutral + sellStats.negative);
      if (sellGood >= 0.6) {
        parts.push('Sell items when price is above base price for profit.');
      } else if (sellStats.negative > sellStats.positive) {
        parts.push('Reduce selling — hold items longer for better prices.');
      } else {
        parts.push('Sell items when price is above base price.');
      }
    } else {
      parts.push('Sell items when price is above base price for profit.');
    }

    // Fuel suggestions
    const fuelStats = actionCounts['buyFuel'];
    if (fuelStats && fuelStats.negative >= fuelStats.positive) {
      parts.push('Keep fuel above 70 to avoid getting stranded.');
    } else {
      parts.push('Keep fuel above 50.');
    }

    // Travel suggestions
    const travelStats = actionCounts['nextTrader'];
    if (travelStats && travelStats.negative > travelStats.positive) {
      parts.push('Reduce unnecessary travel between traders.');
    }

    // Use item suggestions
    const useStats = actionCounts['useItem'];
    if (useStats && useStats.positive >= useStats.neutral) {
      parts.push('Use items from inventory when beneficial.');
    }

    // If target-buy was used, add note about it
    const targetBuys = actionCounts['buy'] && overallPositive >= overallNegative;

    return parts.join(' ');
  }

  getFeedbackStats() {
    const stats = {
      total: this.feedbackHistory.length,
      positive: 0,
      neutral: 0,
      negative: 0,
      unreviewed: 0,
    };

    this.feedbackHistory.forEach((entry) => {
      if (!entry.feedback) {
        stats.unreviewed++;
      } else if (entry.feedback === 'positive') {
        stats.positive++;
      } else if (entry.feedback === 'neutral') {
        stats.neutral++;
      } else if (entry.feedback === 'negative') {
        stats.negative++;
      }
    });

    return stats;
  }

  /**
   * Clear feedback history
   */
  clearFeedbackHistory() {
    this.feedbackHistory = [];
    this.consecutiveFails = 0;
  }

  /**
   * Export feedback history for analysis
   */
  exportFeedbackHistory() {
    return JSON.stringify(this.feedbackHistory, null, 2);
  }
}

// Singleton instance
export const aiControlService = new AIControlService();
export default aiControlService;