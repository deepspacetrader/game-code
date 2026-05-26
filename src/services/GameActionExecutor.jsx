/**
 * Game Action Executor - Bridges AI Control Service with Game Functions
 * Exposes game actions as scriptable functions for AI strategies
 *
 * Full protocol implementation supporting all AI controller actions:
 *  - Market: buy, sell, sellAll, buyFuel, useItem
 *  - Travel: nextTrader, prevTrader, travelGalaxy
 *  - Quantum: assignQuantum, toggleQuantum
 *  - Combat: attack, escape, bribe, hack
 *  - Danger: chooseLeft, chooseRight
 *  - General: wait
 */

class GameActionExecutor {
  constructor() {
    this.gameFunctions = null;
    this.extraActions = null;
  }

  /**
   * Register game functions from MarketplaceContext
   */
  registerGameFunctions(functions) {
    this.gameFunctions = functions;
  }

  /**
   * Register extra actions for encounters (attack/escape/bribe/hack/danger choices)
   * These are callbacks that the game UI exposes for AI control
   */
  registerExtraActions(actions) {
    this.extraActions = actions;
  }

  /**
   * Execute a buy action
   */
  async executeBuy(action) {
    if (!this.gameFunctions) {
      throw new Error('Game functions not registered');
    }

    if (this.gameFunctions.inTravel) {
      return { success: false, action: 'buy', error: 'In travel' };
    }

    const { handleBuyClick } = this.gameFunctions;
    const itemName = action.params?.item || action.item;

    if (itemName) {
      console.log(`[Exec] Buy "${itemName}"`);
      const result = await handleBuyClick(itemName);
      return { success: result !== false, action: 'buy', item: itemName };
    }

    return { success: false, action: 'buy', error: 'Item not specified' };
  }

  /**
   * Execute a sell action
   */
  async executeSell(action) {
    if (!this.gameFunctions) {
      throw new Error('Game functions not registered');
    }

    if (this.gameFunctions.inTravel) {
      return { success: false, action: 'sell', error: 'In travel' };
    }

    const { handleSellClick } = this.gameFunctions;
    const itemName = action.params?.item || action.item;

    if (itemName) {
      console.log(`[Exec] Sell "${itemName}"`);
      const result = await handleSellClick(itemName);
      return { success: result !== false, action: 'sell', item: itemName };
    }

    return { success: false, action: 'sell', error: 'Item not specified' };
  }

  /**
   * Execute a sell all action
   */
  async executeSellAll(action) {
    if (!this.gameFunctions) {
      throw new Error('Game functions not registered');
    }

    const { handleSellAll } = this.gameFunctions;
    const itemName = action.params?.item || action.item;
    const quantity = action.params?.quantity || undefined;

    if (itemName) {
      await handleSellAll(itemName, quantity);
      return { success: true, action: 'sellAll', item: itemName, quantity };
    }

    return { success: false, action: 'sellAll', error: 'Item not specified' };
  }

  /**
   * Execute a buy fuel action
   */
  async executeBuyFuel(action) {
    if (!this.gameFunctions) {
      throw new Error('Game functions not registered');
    }

    const { buyFuel } = this.gameFunctions;
    const amount = action.params?.amount || action.amount || 10;
    console.log(`[Exec] Buy fuel ${amount}`);
    await buyFuel(amount);
    return { success: true, action: 'buyFuel', amount };
  }

  /**
   * Execute a use item action
   */
  async executeUseItem(action) {
    if (!this.gameFunctions) {
      throw new Error('Game functions not registered');
    }

    const { handleUseItem } = this.gameFunctions;
    const itemName = action.params?.item || action.item;

    if (itemName) {
      await handleUseItem(itemName);
      return { success: true, action: 'useItem', item: itemName };
    }

    return { success: false, action: 'useItem', error: 'Item not specified' };
  }

  /**
   * Execute travel to next trader
   */
  async executeNextTrader() {
    if (!this.gameFunctions) {
      throw new Error('Game functions not registered');
    }

    if (this.gameFunctions.inTravel) {
      return { success: false, action: 'nextTrader', error: 'In travel' };
    }

    const { handleNextTrader } = this.gameFunctions;
    if (handleNextTrader) {
      console.log('[Exec] Next trader');
      handleNextTrader();
      return { success: true, action: 'nextTrader' };
    }
    return { success: false, action: 'nextTrader', error: 'Function not available' };
  }

  /**
   * Execute travel to previous trader
   */
  async executePrevTrader() {
    if (!this.gameFunctions) {
      throw new Error('Game functions not registered');
    }

    if (this.gameFunctions.inTravel) {
      return { success: false, action: 'prevTrader', error: 'In travel' };
    }

    const { handlePrevTrader } = this.gameFunctions;
    if (handlePrevTrader) {
      console.log('[Exec] Prev trader');
      handlePrevTrader();
      return { success: true, action: 'prevTrader' };
    }
    return { success: false, action: 'prevTrader', error: 'Function not available' };
  }

  /**
   * Execute travel to a galaxy (specific or random)
   */
  async executeTravelGalaxy(action) {
    if (!this.gameFunctions) {
      throw new Error('Game functions not registered');
    }

    if (this.gameFunctions.inTravel) {
      return { success: false, action: 'travelGalaxy', error: 'In travel' };
    }

    const { travelToGalaxy } = this.gameFunctions;
    const galaxy = action.params?.galaxy || action.galaxy;

    if (galaxy) {
      await travelToGalaxy(galaxy);
      return { success: true, action: 'travelGalaxy', to: galaxy };
    }

    // No target specified - travel to random galaxy
    // travelToGalaxy with null/undefined picks random
    await travelToGalaxy(null);
    return { success: true, action: 'travelGalaxy', to: 'random' };
  }

  /**
   * Execute assign quantum processor
   */
  async executeAssignQuantum(action) {
    if (!this.gameFunctions) {
      throw new Error('Game functions not registered');
    }

    const { subtractQuantumProcessor } = this.gameFunctions;
    const count = action.params?.count || 1;

    if (subtractQuantumProcessor) {
      const result = await subtractQuantumProcessor(count);
      return {
        success: result,
        action: 'assignQuantum',
        count,
        error: result ? null : 'Not enough Quantum Processors or function failed',
      };
    }

    return { success: false, action: 'assignQuantum', error: 'Function not available' };
  }

  /**
   * Execute toggle quantum power
   */
  async executeToggleQuantum(action) {
    if (!this.gameFunctions) {
      throw new Error('Game functions not registered');
    }

    const { toggleQuantumAbilities } = this.gameFunctions;
    if (toggleQuantumAbilities) {
      toggleQuantumAbilities();
      return { success: true, action: 'toggleQuantum' };
    }
    return { success: false, action: 'toggleQuantum', error: 'Function not available' };
  }

  /**
   * Execute attack during enemy encounter
   */
  async executeAttack() {
    if (this.extraActions?.handleAttack) {
      this.extraActions.handleAttack();
      return { success: true, action: 'attack' };
    }
    return { success: false, action: 'attack', error: 'No active encounter' };
  }

  /**
   * Execute escape during enemy encounter
   */
  async executeEscape() {
    if (this.extraActions?.handleEscape) {
      this.extraActions.handleEscape();
      return { success: true, action: 'escape' };
    }
    return { success: false, action: 'escape', error: 'No active encounter' };
  }

  /**
   * Execute bribe during enemy encounter
   */
  async executeBribe() {
    if (this.extraActions?.handleBribe) {
      this.extraActions.handleBribe();
      return { success: true, action: 'bribe' };
    }
    return { success: false, action: 'bribe', error: 'No active encounter' };
  }

  /**
   * Execute hack during enemy encounter
   */
  async executeHack() {
    if (this.extraActions?.handleHack) {
      this.extraActions.handleHack();
      return { success: true, action: 'hack' };
    }
    return { success: false, action: 'hack', error: 'No active encounter' };
  }

  /**
   * Execute chooseLeft during danger encounter
   */
  async executeChooseLeft() {
    if (this.extraActions?.handleDangerChoice) {
      this.extraActions.handleDangerChoice('left');
      return { success: true, action: 'chooseLeft' };
    }
    return { success: false, action: 'chooseLeft', error: 'No active danger encounter' };
  }

  /**
   * Execute chooseRight during danger encounter
   */
  async executeChooseRight() {
    if (this.extraActions?.handleDangerChoice) {
      this.extraActions.handleDangerChoice('right');
      return { success: true, action: 'chooseRight' };
    }
    return { success: false, action: 'chooseRight', error: 'No active danger encounter' };
  }

  /**
   * Main action dispatcher - routes any action to its handler
   */
  async executeAction(action) {
    if (!action || !action.action) {
      return { success: false, error: 'Invalid action: missing "action" field' };
    }

    const result = await (() => {
      switch (action.action) {
        case 'buy': return this.executeBuy(action);
        case 'sell': return this.executeSell(action);
        case 'sellAll': return this.executeSellAll(action);
        case 'buyFuel': return this.executeBuyFuel(action);
        case 'useItem': return this.executeUseItem(action);
        case 'nextTrader': return this.executeNextTrader(action);
        case 'prevTrader': return this.executePrevTrader(action);
        case 'travelGalaxy': return this.executeTravelGalaxy(action);
        case 'assignQuantum': return this.executeAssignQuantum(action);
        case 'toggleQuantum': return this.executeToggleQuantum(action);
        case 'attack': return this.executeAttack();
        case 'escape': return this.executeEscape();
        case 'bribe': return this.executeBribe();
        case 'hack': return this.executeHack();
        case 'chooseLeft': return this.executeChooseLeft();
        case 'chooseRight': return this.executeChooseRight();
        case 'wait': return { success: true, action: 'wait', info: 'AI chose to wait' };
        default: return { success: false, error: `Unknown action type: ${action.action}` };
      }
    })();

    if (!result?.success) {
      console.warn(`[Exec] ${action.action} FAILED:`, result?.error || 'unknown');
    }
    return result;
  }

  /**
   * Get current game state (helper for backward compatibility)
   */
  getGameState() {
    if (!this.gameFunctions) return null;

    return {
      credits: this.gameFunctions.credits,
      inventory: this.gameFunctions.inventory,
      fuel: this.gameFunctions.fuel,
      health: this.gameFunctions.health,
      traders: this.gameFunctions.traders,
      currentTrader: this.gameFunctions.currentTrader,
      currentGalaxy: this.gameFunctions.currentGalaxy,
      galaxyName: this.gameFunctions.galaxyName,
      galaxies: this.gameFunctions.galaxies,
      traderIds: this.gameFunctions.traderIds,
      traderNames: this.gameFunctions.traderNames,
      fuelPrices: this.gameFunctions.fuelPrices,
      deliveryQueue: this.gameFunctions.deliveryQueue,
      statusEffects: this.gameFunctions.statusEffects,
      shieldActive: this.gameFunctions.shieldActive,
      stealthActive: this.gameFunctions.stealthActive,
      improvedAILevel: this.gameFunctions.improvedAILevel,
      aiTier: this.gameFunctions.aiTier,
      inTravel: this.gameFunctions.inTravel,
      isJumping: this.gameFunctions.isJumping,
    };
  }
}

// Singleton instance
export const gameActionExecutor = new GameActionExecutor();
export default gameActionExecutor;