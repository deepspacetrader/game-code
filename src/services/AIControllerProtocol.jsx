/**
 * AI Controller Protocol - System Prompt & Schema Definitions
 *
 * This file defines the protocol for AI agents to play Deep Space Trader.
 * It serves as both the system prompt template and the data format contract
 * between AI controllers and the game engine.
 *
 * The protocol is designed to be independent of any specific AI provider.
 * Any LLM or agent can use this protocol to play the game by:
 *   1. Receiving the system prompt + game state snapshot
 *   2. Responding with a JSON action
 *   3. The game engine executes the action
 */

// ============================================================
// GAME STATE SNAPSHOT
// ============================================================
// This is the shape of the game state sent to the AI on each poll cycle.
// The actual snapshot is extracted from MarketplaceContext by getGameSnapshot().

/*
{
  "timestamp": 1717000000000,
  "tick": 12345,

  "player": {
    "credits": 10000,
    "fuel": 100,
    "maxFuel": 1000,
    "health": 100,
    "maxHealth": 100,
    "aiLevel": 10,
    "aiTier": "bad",
    "galaxy": "Xylen Verge",
    "currentTraderId": 1,
    "currentTraderName": "Jax Orion",
    "traderIndex": 0,
    "totalTradersInGalaxy": 4,
    "inTravel": false,
    "isJumping": false,
    "shieldActive": false,
    "stealthActive": false
  },

  "fuel": {
    "current": 100,
    "max": 1000,
    "pricePerUnit": 5,
    "canBuy": true
  },

  "market": [
    {
      "itemId": 1,
      "name": "Basic QBiT Inverter",
      "price": 10,
      "basePrice": 10,
      "stock": 7,
      "illegal": false,
      "volatility": [0.978, 1.0221]
    }
  ],

  "inventory": [
    {
      "itemId": 5,
      "name": "Quantum Processor",
      "quantity": 1,
      "price": 42000
    }
  ],

  "deliveryQueue": [
    {
      "name": "Basic QBiT Inverter",
      "quantity": 1,
      "timeLeftMs": 50,
      "totalTimeMs": 100
    }
  ],

  "traders": [
    { "traderId": 1, "name": "Jax Orion" },
    { "traderId": 2, "name": "Kyrnin Nova" }
  ],

  "galaxies": [
    { "galaxyId": 1, "name": "Xylen Verge", "danger": false, "war": false, "distance": 1213 },
    { "galaxyId": 2, "name": "Cindros Bloom", "danger": false, "war": false, "distance": 10 }
  ],

  "statusEffects": {
    "fuel_cost": { "active": false },
    "shield_active": { "active": false },
    "stealth_active": { "active": false }
  },

  "encounter": null,
  // OR, if in combat:
  // "encounter": {
  //   "type": "enemy",
  //   "enemyName": "Scavenger",
  //   "enemyHealth": 50,
  //   "enemyMaxHealth": 50,
  //   "enemyDamage": 5,
  //   "enemyRank": "D",
  //   "playerTurn": true,
  //   "timeLeft": 30,
  //   "canHack": false,
  //   "bribeAmount": 500,
  //   "options": ["attack", "escape", "bribe", "hack"]
  // }
  // OR, if in a danger event:
  // "encounter": {
  //   "type": "danger",
  //   "dangerType": "EXPLOSION",
  //   "message": "An explosion rocks the area! Choose left or right!",
  //   "timeLeftMs": 3000,
  //   "options": ["left", "right"]
  // }

  "quantum": {
    "powerOn": false,
    "slotsUsed": 0,
    "totalSlots": 6,
    "processorsInInventory": 0,
    "abilities": [],
    "canAssignProcessor": false
  }
}
*/

// ============================================================
// AI ACTION RESPONSE SCHEMA
// ============================================================
// The AI must respond with a JSON object following this schema:

/*
{
  "action": "<action_type>",
  "params": {
    // Action-specific parameters (see below)
  },
  "reason": "Brief explanation of why this action was chosen"
}
*/

// ============================================================
// AVAILABLE ACTIONS
// ============================================================

const ACTIONS_CATALOG = {
  // ----- MARKET ACTIONS -----
  buy: {
    description: 'Buy 1 unit of an item from the current trader',
    context: 'Use when credits >= item.price and item.stock > 0',
    params: {
      item: 'string (item name, e.g. "Basic QBiT Inverter")',
    },
    example: { action: 'buy', params: { item: 'Basic QBiT Inverter' }, reason: 'Low price, good profit potential' },
  },

  sell: {
    description: 'Sell 1 unit of an item from your inventory to the current trader',
    context: 'Use when you have the item in inventory with quantity > 0',
    params: {
      item: 'string (item name)',
    },
    example: { action: 'sell', params: { item: 'Quantum Processor' }, reason: 'Price is high, taking profit' },
  },

  sellAll: {
    description: 'Sell ALL units of a specific item type from inventory',
    context: 'AI level 15+ recommended. Clears out entire stock of one item.',
    params: {
      item: 'string (item name)',
    },
    example: { action: 'sellAll', params: { item: 'Basic QBiT Inverter' }, reason: 'Clearing inventory of low-value items' },
  },

  buyFuel: {
    description: 'Buy fuel for your ship',
    context: 'Use when fuel is low (below 50)',
    params: {
      amount: 'number (default: 10, max fills to MAX_FUEL)',
    },
    example: { action: 'buyFuel', params: { amount: 50 }, reason: 'Fuel running low, need to prepare for travel' },
  },

  useItem: {
    description: 'Use/activate 1 unit of an item from inventory',
    context: 'Items have effects like healing, AI boost, fuel, shields, etc.',
    params: {
      item: 'string (item name)',
    },
    example: { action: 'useItem', params: { item: 'MultiMed' }, reason: 'Health is low, need healing' },
  },

  useAll: {
    description: 'Use ALL units of a specific item type from inventory',
    context: 'Applies every unit of the named item at once. Useful for boosting AI level in bulk.',
    params: {
      item: 'string (item name)',
    },
    example: { action: 'useAll', params: { item: 'Basic QBiT Inverter' }, reason: 'Boosting AI level with all units' },
  },

  // ----- TRAVEL ACTIONS -----
  nextTrader: {
    description: 'Travel to the next trader in the current galaxy',
    context: 'Costs fuel. Moves forward through trader list.',
    params: {},
    example: { action: 'nextTrader', params: {}, reason: 'Current market has bad prices, checking next trader' },
  },

  prevTrader: {
    description: 'Travel to the previous trader in the current galaxy',
    context: 'Costs fuel. Moves backward through trader list.',
    params: {},
    example: { action: 'prevTrader', params: {}, reason: 'Checking alternative trader for better prices' },
  },

  travelGalaxy: {
    description: 'Travel to a specific galaxy (requires AI level 15+) or a random galaxy',
    context: 'Costs 10 fuel. If galaxy param is omitted, travels to a random galaxy.',
    params: {
      galaxy: 'string (optional - galaxy name). If omitted, travels to a random galaxy.',
    },
    example: [
      { action: 'travelGalaxy', params: {}, reason: 'No good trades here, trying random galaxy' },
      { action: 'travelGalaxy', params: { galaxy: 'Cindros Bloom' }, reason: 'Better market opportunities there' },
    ],
  },

  // ----- QUANTUM ACTIONS -----
  assignQuantum: {
    description: 'Assign a Quantum Processor to a quantum slot',
    context: 'Requires Quantum Processor in inventory. Max 6 slots. Enables quantum abilities when 1+ slots filled.',
    params: {
      count: 'number (default: 1, processors to assign)',
    },
    example: { action: 'assignQuantum', params: { count: 1 }, reason: 'Enabling quantum processing for market analysis' },
  },

  toggleQuantum: {
    description: 'Toggle quantum power on/off',
    context: 'Requires 1+ quantum slots used. Enables/disables quantum abilities.',
    params: {
      on: 'boolean (true to enable, false to disable)',
    },
    example: { action: 'toggleQuantum', params: { on: true }, reason: 'Activating quantum market analysis' },
  },

  // ----- ENEMY ENCOUNTER ACTIONS -----
  attack: {
    description: 'Attack the enemy during combat',
    context: 'Only valid when encounter.type === "enemy" and playerTurn === true.',
    params: {},
    example: { action: 'attack', params: {}, reason: 'Enemy health is low, finishing them off' },
  },

  escape: {
    description: 'Attempt to escape from the enemy',
    context: '30% base success chance, +10% per failed attempt (max 80%). Only valid during enemy encounter.',
    params: {},
    example: { action: 'escape', params: {}, reason: 'Enemy is too strong, need to flee' },
  },

  bribe: {
    description: 'Bribe the enemy to end the encounter',
    context: '50% success chance. Costs credits. If fails, bribe amount doubles. Only valid during enemy encounter.',
    params: {},
    example: { action: 'bribe', params: {}, reason: 'Have enough credits to risk a bribe' },
  },

  hack: {
    description: 'Hold-and-complete hack: requires holding the hack action until completion',
    context: 'Requires Quantum Processors > enemy quantum_processors. Takes 4.2 seconds. Only valid during enemy encounter.',
    params: {},
    example: { action: 'hack', params: {}, reason: 'Have more quantum processors than enemy, attempting hack' },
  },

  // ----- DANGER ENCOUNTER ACTIONS -----
  chooseLeft: {
    description: 'Choose LEFT during a danger event',
    context: 'Only valid when encounter.type === "danger". 50% success rate.',
    params: {},
    example: { action: 'chooseLeft', params: {}, reason: 'Going left feels safer' },
  },

  chooseRight: {
    description: 'Choose RIGHT during a danger event',
    context: 'Only valid when encounter.type === "danger". 50% success rate.',
    params: {},
    example: { action: 'chooseRight', params: {}, reason: 'Taking the right path' },
  },

  // ----- GENERAL ACTIONS -----
  wait: {
    description: 'Do nothing and wait for the next cycle',
    context: 'Use when no good action is available, or waiting for delivery queue to process.',
    params: {},
    example: { action: 'wait', params: {}, reason: 'Waiting for delivery to complete before next trade' },
  },
};

// ============================================================
// SYSTEM PROMPT TEMPLATE
// ============================================================

const AI_CONTROLLER_SYSTEM_PROMPT = `You are an AI space trader controlling a ship in the game "Deep Space Trader". Your goal is to maximize credits by buying low, selling high, and exploring galaxies.

## GAME WORLD

The galaxy is divided into multiple star systems (galaxies). Each galaxy has multiple traders you can visit. Each trader buys and sells different items at prices that fluctuate in real-time (every 150-800ms). You have an AI level that increases as you use certain items, unlocking more advanced abilities.

### Player Stats
- **Credits**: Your money. Used to buy items, fuel, and bribe enemies.
- **Fuel**: Consumed when traveling between traders (cost varies) or galaxies (10 fuel). Max: 1000.
- **Health**: Your hit points. Max: 100. Can be healed with items.
- **AI Level**: Increases as you use AI-enhancing items. Higher levels unlock more abilities:
  - Level 15+: Can travel to specific galaxies by name
  - Level 25+: Sell All action available
  - Higher levels: Better price analysis, star map, quantum abilities

### Items
Items have the following properties:
- **basePrice**: The reference price
- **price**: Current market price (fluctuates from basePrice)
- **stock**: How many units the trader has
- **volatility**: How much the price fluctuates (larger range = more profit potential)
- **deliveryTime**: Seconds before a purchased item arrives in your inventory
- **illegal**: Some items are illegal and can trigger Market Police

Item categories include: medical supplies, technology, weapons, illegal goods, quantum processors, ship modules, and more.

Your **inventory** is where items go after the delivery timer completes. You can use items from inventory for various effects.

### Delivery Queue
When you buy an item, it enters a delivery queue. After the delivery time elapses, it appears in your inventory. The delivery time is reduced by "courier drones" upgrades.

### Market Prices
Market prices tick very fast (every ~150ms for fast items). Each item has a volatility range that determines price drift per tick. Events can temporarily affect prices (e.g., "Trade Festival" increases prices). Strategy tip: you don't need to react to every tick - buy items when the price is favorable and the AI can then travel and sell at a better market.

### Travel
- **Between traders in the same galaxy**: Costs fuel (varies per trader). Takes ~3 seconds. May trigger random encounters.
- **Between galaxies**: Costs 10 fuel. Takes ~3 seconds. Triggers market police checks on arrival (if carrying illegal items or too many quantum processors).

### Quantum Processing
Quantum Processors (QPs) are special items that unlock advanced market analysis. Assign them to quantum slots (max 6) and enable quantum power to use abilities like Quantum Scan and Quantum Hover.

### Encounters
You may encounter enemies or danger events:
- **Enemies**: Turn-based combat with Attack, Bribe (50% success), Escape (30%+ per attempt), or Hack (hold 4.2s, requires QPs). Win = earn credits. Lose = lose credits/items. Timer expires in 30s.
- **Danger**: Quick-time event. Choose LEFT or RIGHT (50% success). Success = no damage. Failure = take damage.

## YOUR GOAL
Maximize your credit balance through smart trading. Consider:
1. Buy items when price is below basePrice (potential profit)
2. Sell items when price is above what you paid
3. Keep enough fuel to travel (don't get stranded)
4. Use items strategically (heal when low HP, boost AI when possible)
5. Explore different traders and galaxies for better prices
6. Balance risk vs reward with illegal items
7. Manage inventory space and delivery queue timing

## RESPONSE FORMAT
You MUST respond with a JSON object only - no additional text, no markdown formatting:

\`\`\`json
{
  "action": "<action_type>",
  "params": { },
  "reason": "Brief explanation"
}
\`\`\`

## AVAILABLE ACTIONS

| Action | Description | When to Use |
|--------|-------------|-------------|
| buy | Buy 1 unit of an item | item price is good, have credits, item in stock |
| sell | Sell 1 unit of an item | price is profitable, have item in inventory |
| sellAll | Sell all of an item type (AI lvl 25+) | clearing inventory of low-value items |
| buyFuel | Buy fuel for ship | fuel is below 50 |
| useItem | Use an item from inventory | need healing, AI boost, shield, etc. |
| nextTrader | Travel to next trader | want to see different inventory/prices |
| prevTrader | Travel to previous trader | want to check previous trader |
| travelGalaxy | Travel to another galaxy | current market has poor opportunities |
| assignQuantum | Assign QP to quantum slot | have QPs in inventory and free slots |
| toggleQuantum | Toggle quantum power on/off | have QPs assigned, want market analysis |
| attack | Attack enemy in combat | enemy encounter, player's turn |
| escape | Attempt to flee combat | enemy too strong |
| bribe | Bribe enemy to leave | have enough credits |
| hack | Hack enemy (hold 4.2s) | have more QPs than enemy |
| chooseLeft | Choose LEFT in danger event | danger encounter |
| chooseRight | Choose RIGHT in danger event | danger encounter |
| wait | Do nothing this cycle | no good action, waiting for deliveries |

## ENCOUNTER STATES
When \`encounter\` is not null in the game state, you MUST handle it:
- **Enemy encounter** (\`encounter.type === "enemy"\`): Use attack/escape/bribe/hack
- **Danger event** (\`encounter.type === "danger"\`): Use chooseLeft/chooseRight
- Do NOT use market or travel actions during encounters

## STRATEGY GUIDELINES
- Prices change rapidly (every ~150ms). Focus on trend rather than exact price. If the price is below basePrice, it's generally a buy opportunity.
- Check delivery queue before buying - items you already bought will arrive soon.
- Keep fuel above 30 to ensure you can travel when needed.
- Use \`wait\` when traveling is in progress (inTravel=true) or no good action is available.
- For maximum profit: buy in markets with low prices, sell in markets with high prices.
- Higher AI level items (Quantum Processors, AI boosters) are very valuable.
`;

// ============================================================
// SNAPSHOT EXTRACTOR
// ============================================================

/**
 * Extract a clean, minimal game state snapshot from the full MarketplaceContext
 * This is the data sent to the AI on each poll cycle.
 *
 * @param {Object} gameFunctions - The game functions object from Game.js
 * @param {Object} extraState - Additional state (encounter, quantum, etc.)
 * @returns {Object} Clean game state snapshot for the AI
 */
export function getGameSnapshot(gameFunctions, extraState = {}) {
  if (!gameFunctions) return null;

  const {
    credits,
    inventory,
    fuel,
    health,
    traders,
    currentTrader,
    galaxyName,
    traderIds,
    traderNames,
    fuelPrices,
    deliveryQueue,
    statusEffects,
    shieldActive,
    stealthActive,
    improvedAILevel,
    aiTier,
    inTravel,
    isJumping,
  } = gameFunctions;

  // Find the current trader index
  const traderIdx = Array.isArray(traderIds)
    ? traderIds.findIndex((tid) => tid === currentTrader)
    : -1;

  // Get current trader's inventory (the market)
  const currentMarket = Array.isArray(traders) && traderIdx >= 0 && traders[traderIdx]
    ? traders[traderIdx].map((cell) => ({
        itemId: cell.itemId,
        name: cell.name,
        price: cell.price,
        basePrice: cell.basePrice,
        stock: cell.stock,
        illegal: cell.illegal || false,
        volatility: cell.volatilityRange || null,
      }))
    : [];

  // Get fuel price at current trader
  const fuelPrice = Array.isArray(fuelPrices) && traderIdx >= 0
    ? fuelPrices[traderIdx]
    : 0;

  // Format inventory
  const inventoryList = Array.isArray(inventory)
    ? inventory.map((item) => ({
        name: item.name,
        quantity: item.quantity || 1,
        itemId: item.itemId,
      }))
    : [];

  // Format delivery queue
  const deliveryList = Array.isArray(deliveryQueue)
    ? deliveryQueue.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        timeLeftMs: Math.round(item.timeLeft || 0),
        totalTimeMs: Math.round(item.totalTime || 0),
      }))
    : [];

  // Format trader list
  const traderList = Array.isArray(traderIds) && Array.isArray(traderNames)
    ? traderIds.map((id, i) => ({
        traderId: id,
        name: traderNames[i] || `Trader ${id}`,
        isCurrent: id === currentTrader,
      }))
    : [];

  // Format status effects
  const effectsSummary = {};
  if (statusEffects) {
    Object.entries(statusEffects).forEach(([key, val]) => {
      if (val && typeof val === 'object') {
        effectsSummary[key] = {
          active: !!val.active,
          expiresAt: val.expiresAt || null,
        };
      }
    });
  }

  const snapshot = {
    timestamp: Date.now(),
    player: {
      credits: credits || 0,
      fuel: fuel || 0,
      maxFuel: 1000,
      health: health || 0,
      maxHealth: 100,
      aiLevel: improvedAILevel || 0,
      aiTier: aiTier || 'unknown',
      galaxy: galaxyName || '',
      currentTraderId: currentTrader,
      currentTraderName: traderList.find((t) => t.isCurrent)?.name || '',
      traderIndex: traderIdx,
      totalTradersInGalaxy: traderIds?.length || 0,
      inTravel: inTravel || false,
      isJumping: isJumping || false,
      shieldActive: shieldActive || false,
      stealthActive: stealthActive || false,
    },
    fuel: {
      current: fuel || 0,
      max: 1000,
      pricePerUnit: fuelPrice,
      canBuy: fuel < 1000 && credits > fuelPrice,
    },
    market: currentMarket,
    inventory: inventoryList,
    deliveryQueue: deliveryList,
    traders: traderList,
    statusEffects: effectsSummary,
    encounter: extraState.encounter || null,
    quantum: {
      powerOn: extraState.quantumPower || false,
      slotsUsed: extraState.quantumSlotsUsed || 0,
      totalSlots: 6,
      processorsInInventory: inventoryList.find((i) => i.name === 'Quantum Processor')?.quantity || 0,
      abilities: extraState.quantumAbilities || [],
      canAssignProcessor: (extraState.quantumSlotsUsed || 0) < 6
        && (inventoryList.find((i) => i.name === 'Quantum Processor')?.quantity || 0) > 0,
    },
  };

  return snapshot;
}

// ============================================================
// ACTION VALIDATOR
// ============================================================

const ACTION_HANDLES = [
  'buy', 'sell', 'sellAll', 'buyFuel', 'useItem', 'useAll',
  'nextTrader', 'prevTrader', 'travelGalaxy',
  'assignQuantum', 'toggleQuantum',
  'attack', 'escape', 'bribe', 'hack',
  'chooseLeft', 'chooseRight',
  'wait',
];

/**
 * Validate that an AI response contains a valid action
 */
export function validateAction(response) {
  if (!response) return { valid: false, error: 'Empty response' };

  let actionObj = response;

  // If response is a string, try to parse JSON
  if (typeof response === 'string') {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        actionObj = JSON.parse(jsonMatch[0]);
      } else {
        return { valid: false, error: 'No JSON object found in response' };
      }
    } catch (e) {
      return { valid: false, error: `Invalid JSON: ${e.message}` };
    }
  }

  if (!actionObj.action) {
    return { valid: false, error: 'Missing "action" field' };
  }

  if (!ACTION_HANDLES.includes(actionObj.action)) {
    return {
      valid: false,
      error: `Unknown action "${actionObj.action}". Valid actions: ${ACTION_HANDLES.join(', ')}`,
    };
  }

  return {
    valid: true,
    action: actionObj.action,
    params: actionObj.params || {},
    reason: actionObj.reason || '',
  };
}

// ============================================================
// FAST MODE - Condensed System Prompt (~400 tokens)
// ============================================================
// For ultra-fast models (1B-3B params). Strips explanations,
// keeps only what the AI needs to make decisions.

const FAST_SYSTEM_PROMPT = `# DST Trader

## ONLY output JSON. NO text.
{"a":"buy","d":{"n":"Basic QBiT Inverter"},"r":"low price"}
{"a":"sell","d":{"n":"Mixed Energy Cores"},"r":"profit"}
{"a":"next","d":{},"r":"find deals"}
{"a":"fuel","d":{"a":50},"r":"fuel low"}
{"a":"wait","d":{},"r":"traveling"}

## RULES
- TRAVELING? wait
- LAST=failed? different action
- BEST deal? buy it
- OWN items? sell it
- nothing? next`;

// ============================================================
// FAST MODE - State Snapshot (single-letter keys, ~80% smaller)
// ============================================================

/**
 * Ultra-compact game snapshot for fast models.
 * Uses single-letter keys. ~80% smaller than full snapshot.
 */
export function getFastGameSnapshot(gameFunctions, extraState = {}) {
  if (!gameFunctions) return null;

  const {
    credits, inventory, fuel, health, traders,
    currentTrader, galaxyName, traderIds, traderNames,
    fuelPrices, deliveryQueue, improvedAILevel, aiTier,
    inTravel, isJumping,
  } = gameFunctions;

  const traderIdx = Array.isArray(traderIds)
    ? traderIds.findIndex((tid) => tid === currentTrader)
    : -1;

  const fuelPrice = Array.isArray(fuelPrices) && traderIdx >= 0 ? fuelPrices[traderIdx] : 0;

  // Reduce market to essentials - filter out items with 0 stock
  const market = Array.isArray(traders) && traderIdx >= 0 && traders[traderIdx]
    ? traders[traderIdx]
        .filter((c) => c && c.stock > 0)
        .map((c) => ({ n: c.name, p: c.price, bp: c.basePrice, s: c.stock }))
    : [];

  const inv = Array.isArray(inventory)
    ? inventory.map((i) => ({ n: i.name, q: i.quantity || 1 }))
    : [];

  const dq = Array.isArray(deliveryQueue)
    ? deliveryQueue.map((d) => ({ n: d.name, q: d.quantity, t: Math.round(d.timeLeft || 0) }))
    : [];

  // Build encounter block
  let enc = null;
  if (extraState.encounter) {
    const e = extraState.encounter;
    if (e.type === 'enemy') {
      enc = { ty: 'e', nh: e.enemyHealth, nm: e.enemyName, pt: e.playerTurn };
    } else if (e.type === 'danger') {
      enc = { ty: 'd', dt: e.dangerType };
    }
  }

  return {
    p: {
      c: credits || 0, f: fuel || 0, h: health || 0,
      al: improvedAILevel || 0, g: galaxyName || '',
      ti: traderIdx, nt: traderIds?.length || 0,
      it: inTravel || false, fp: fuelPrice,
    },
    m: market,
    i: inv,
    dq: dq.length > 0 ? dq : undefined,
    e: enc,
    q: extraState.quantumPower ? { qp: (inv.find((x) => x.n === 'Quantum Processor')?.q || 0) } : undefined,
  };
}

// ============================================================
// FAST MODE - Short action name mapping
// ============================================================

const SHORT_ACTION_MAP = {
  left: 'chooseLeft',
  right: 'chooseRight',
  fuel: 'buyFuel',
  buyfuel: 'buyFuel',
  next: 'nextTrader',
  prev: 'prevTrader',
  previous: 'prevTrader',
  galaxy: 'travelGalaxy',
  travel: 'travelGalaxy',
  use: 'useItem',
  useall: 'useAll',
  qp: 'assignQuantum',
  quantum: 'toggleQuantum',
};

/**
 * Resolve a potentially shortened action name to its full form
 */
export function resolveActionName(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  if (ACTION_HANDLES.includes(lower)) return lower;
  return SHORT_ACTION_MAP[lower] || null;
}

// ============================================================
// FAST MODE - Action Parser (handles compact formats)
// ============================================================

/**
 * Parse a fast-mode AI response. Handles:
 * - Full JSON: {"a":"buy","p":{"n":"QBit"},"r":"profit"}
 * - Short form: buy n=QBit
 * - Ultra short: buy QBit
 * - Terse alias: fuel a=50  (maps to buyFuel)
 */
export function parseFastAction(raw) {
  if (!raw) return null;

  let text = typeof raw === 'string' ? raw.trim() : '';

  // Try JSON first (most reliable)
  if (text.startsWith('{') || (typeof raw === 'object' && raw !== null)) {
    const obj = typeof raw === 'string' ? tryParseJSON(text) : raw;
    if (obj) {
      const rawAction = obj.a || obj.action;
      const action = resolveActionName(rawAction);
      if (!action) return null;

      const params = obj.d || obj.p || obj.params || {};

      // If action needs an item but params has none, scan the whole response
      if (!params.item && !params.n && !params.name && ['buy', 'sell', 'sellAll', 'useItem'].includes(action)) {
        const item = obj.item || obj.name || obj.n;
        if (item) params.item = item;
        else {
          // Scan nested objects for item/name/n fields
          for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              const nested = obj[key];
              const ni = nested.item || nested.name || nested.n;
              if (ni) { params.item = ni; break; }
            }
          }
        }
      }

      // Map single-letter param keys back
      if (params.n !== undefined && !params.item) params.item = params.n;
      if (params.name !== undefined && !params.item) params.item = params.name;
      if (params.a !== undefined && !params.amount) params.amount = params.a;
      if (params.g !== undefined && !params.galaxy) params.galaxy = params.g;
      if (params.q !== undefined && !params.quantity) params.quantity = params.q;
      if (params.c !== undefined && !params.count) params.count = params.c;
      return { action, params, reason: obj.r || obj.reason || '' };
    }
  }

  // Try line format: "action key=value" or "action value"
  const parts = text.split(/\s+/);
  const rawAction = parts[0];
  const action = resolveActionName(rawAction);
  if (!action) return null;

  const params = {};
  for (let i = 1; i < parts.length; i++) {
    const kv = parts[i].split('=');
    if (kv.length === 2) {
      const key = kv[0];
      const val = kv[1];
      if (key === 'n' || key === 'item') params.item = val;
      else if (key === 'a' || key === 'amount') params.amount = parseInt(val) || val;
      else if (key === 'g' || key === 'galaxy') params.galaxy = val;
      else if (key === 'q') params.quantity = parseInt(val) || val;
      else if (key === 'c') params.count = parseInt(val) || val;
      else params[key] = val;
    }
  }

  // Un-keyed arg after action = item name for relevant actions
  if (parts.length === 2 && !parts[1].includes('=') && ['buy', 'sell', 'sellAll', 'useItem'].includes(action)) {
    params.item = parts[1];
  }

  return { action, params, reason: '' };
}

function tryParseJSON(str) {
  try {
    const match = str.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const text = match[0];

    // Try the full match first, then progressively shorter matches at each }
    let i = text.lastIndexOf('}');
    while (i !== -1) {
      const candidate = text.substring(0, i + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // Try the = repair on this candidate
        try {
          const fixed = candidate.replace(/\{([^{}]*)\}/g, (m, inner) => {
            if (inner.includes('=')) {
              return '{' + inner.replace(/(\w+)\s*=\s*/g, '"$1":') + '}';
            }
            return m;
          });
          return JSON.parse(fixed);
        } catch {
          i = text.lastIndexOf('}', i - 1);
        }
      }
    }
    return null;
  } catch { return null; }
}

/**
 * Analyze game state and produce a plain-text summary for small models.
 * 1-3B models struggle with raw JSON; this gives them a digest they can actually use.
 */
export function analyzeStateForAI(gameState, userStrategy) {
  if (!gameState) return '';

  const parts = [];

  // Support both fast-mode (p/m/i) and full-mode (player/market/inventory) keys
  const p = gameState.p || gameState.player || {};
  const m = gameState.m || gameState.market || [];
  const i = gameState.i || gameState.inventory || [];
  const e = gameState.e || gameState.encounter;

  const credits = p.c ?? p.credits ?? 0;
  const fuel = p.f ?? p.fuel ?? 0;
  const health = p.h ?? p.health ?? 0;
  const traveling = p.it ?? p.inTravel ?? false;

  parts.push(`C:${credits} F:${Math.round(fuel)} H:${Math.round(health)}`);

  if (traveling) parts.push('TRAVELING');

  if (e) {
    const eName = e.nm || e.enemyName || e.ty || 'enemy';
    parts.push(`ENEMY:${eName}`);
  }

  // Market items (only stock > 0 are listed in fast mode)
  if (Array.isArray(m) && m.length > 0) {
    const deals = m
      .map((item) => {
        const name = item.n || item.name || '?';
        const price = item.p ?? item.price ?? 0;
        const base = item.bp ?? item.basePrice ?? 0;
        const stock = item.s ?? item.stock ?? 0;
        const profit = Math.round(base - price);
        return { name, price, base, stock, profit };
      })
      .filter((x) => x.stock > 0)
      .sort((a, b) => b.profit - a.profit);

    if (deals.length > 0) {
      const best = deals[0];
      parts.push(`BEST:${best.name}(${best.price}/${best.base}) profit${best.profit > 0 ? '+' : ''}${best.profit}`);
      if (deals.length > 1) {
        const rest = deals.slice(1, 3).map((d) => `${d.name}(${d.price}/${d.base})`).join(' ');
        parts.push(`MORE:${rest}`);
      }
    } else {
      parts.push('NODEALS');
    }
  } else {
    parts.push('NOMARKET');
  }

  // Inventory
  if (Array.isArray(i) && i.length > 0) {
    const owned = i.map((item) => {
      const name = item.n || item.name || '?';
      const qty = item.q || item.quantity || 1;
      return `${name}x${qty}`;
    });
    parts.push(`OWN:${owned.join(' ')}`);
  }

  // Last action result — tells the model what just happened
  const lastResult = gameState._lastResult;
  if (lastResult) {
    parts.push(`LAST:${lastResult.action}=${lastResult.error}`);
  }

  // User strategy hint (truncated)
  if (userStrategy) {
    parts.push(`GOAL:${userStrategy.slice(0, 120)}`);
  }

  return parts.join(' | ');
}

export {
  AI_CONTROLLER_SYSTEM_PROMPT,
  FAST_SYSTEM_PROMPT,
  ACTIONS_CATALOG,
  ACTION_HANDLES,
  SHORT_ACTION_MAP,
};