# Deep Space Trader - AI Controller Protocol

A standardized protocol for AI agents to play the **Deep Space Trader** game. Any AI agent (Claude, GPT, local LLM, or custom agent) can use this protocol to control a ship, trade goods, fight enemies, and explore galaxies.

---

## Quick Start

1. **Connect your AI** to the game's HTTP API endpoint
2. **Poll the game state** endpoint to receive a state snapshot
3. **Send the state + system prompt** to your AI model
4. **Parse the AI's response** as a JSON action object
5. **Execute the action** via the game's action endpoint
6. **Repeat** at your desired cadence (1-3 seconds recommended)

---

## Protocol Overview

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  Game Engine │  ──►   │  Your Script │  ──►    │   AI Agent   │
│              │  Game   │              │  State  │              │
│  (React App) │  State  │  (Connector) │  + Sys  │  (LLM)       │
│              │  ◄──    │              │  Prompt │              │
│              │  Action  │              │  ◄──    │              │
│              │  Result  │              │  JSON   │              │
└─────────────┘         └──────────────┘         └──────────────┘
```

---

## Game State Format (Input to AI)

Poll the game state to receive a JSON snapshot:

```json
{
  "timestamp": 1717000000000,
  "player": {
    "credits": 10000,
    "fuel": 100,
    "maxFuel": 1000,
    "health": 100,
    "maxHealth": 100,
    "aiLevel": 10,
    "aiTier": "bad",
    "galaxy": "Xylen Verge",
    "currentTraderName": "Jax Orion",
    "traderIndex": 0,
    "totalTradersInGalaxy": 4,
    "inTravel": false,
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
      "illegal": false
    }
  ],
  "inventory": [
    { "name": "Quantum Processor", "quantity": 1, "itemId": 5 }
  ],
  "deliveryQueue": [
    { "name": "Basic QBiT Inverter", "quantity": 1, "timeLeftMs": 50, "totalTimeMs": 100 }
  ],
  "traders": [
    { "traderId": 1, "name": "Jax Orion", "isCurrent": true },
    { "traderId": 2, "name": "Kyrnin Nova", "isCurrent": false }
  ],
  "encounter": null
}
```

### Encounter States

When in combat, `encounter` field changes:

**Enemy Encounter:**
```json
{
  "encounter": {
    "type": "enemy",
    "enemyName": "Scavenger",
    "enemyHealth": 50,
    "enemyMaxHealth": 50,
    "enemyDamage": 5,
    "enemyRank": "D",
    "playerTurn": true,
    "options": ["attack", "escape", "bribe", "hack"]
  }
}
```

**Danger Event:**
```json
{
  "encounter": {
    "type": "danger",
    "dangerType": "EXPLOSION",
    "message": "An explosion rocks the area!",
    "timeLeftMs": 3000,
    "options": ["left", "right"]
  }
}
```

---

## Action Format (Output from AI)

The AI must respond with a JSON object:

```json
{
  "action": "<action_type>",
  "params": { },
  "reason": "Brief explanation of why this action was chosen"
}
```

---

## Complete Action Catalog

### Market Actions

| Action | Params | Description | Condition |
|--------|--------|-------------|-----------|
| `buy` | `{ "item": "Item Name" }` | Buy 1 unit of an item | credits >= item.price, stock > 0 |
| `sell` | `{ "item": "Item Name" }` | Sell 1 unit of an item | have item in inventory |
| `sellAll` | `{ "item": "Item Name" }` | Sell ALL of an item type | AI level 25+, have item |
| `buyFuel` | `{ "amount": 50 }` | Buy fuel for ship | fuel < max, have credits |
| `useItem` | `{ "item": "Item Name" }` | Use/activate an item | have item in inventory |

### Travel Actions

| Action | Params | Description | Condition |
|--------|--------|-------------|-----------|
| `nextTrader` | `{}` | Travel to next trader | not traveling, have fuel |
| `prevTrader` | `{}` | Travel to previous trader | not traveling, have fuel |
| `travelGalaxy` | `{}` or `{ "galaxy": "Name" }` | Travel to galaxy (random or specific) | 10 fuel, not traveling. Specific galaxy requires AI level 15+ |

### Quantum Actions

| Action | Params | Description | Condition |
|--------|--------|-------------|-----------|
| `assignQuantum` | `{ "count": 1 }` | Assign QP to quantum slot | have QP in inventory, slot free |
| `toggleQuantum` | `{ "on": true }` | Toggle quantum power | 1+ slots used |

### Combat Actions (encounter.type === "enemy")

| Action | Params | Description |
|--------|--------|-------------|
| `attack` | `{}` | Attack the enemy (damage = player's weapon damage) |
| `escape` | `{}` | Attempt to flee (30% base +10% per attempt, max 80%) |
| `bribe` | `{}` | Bribe the enemy (50% success, costs credits, amount doubles on fail) |
| `hack` | `{}` | Hack the enemy (hold 4.2s, requires more QPs than enemy) |

### Danger Actions (encounter.type === "danger")

| Action | Params | Description |
|--------|--------|-------------|
| `chooseLeft` | `{}` | Choose LEFT (50% success) |
| `chooseRight` | `{}` | Choose RIGHT (50% success) |

### General Actions

| Action | Params | Description |
|--------|--------|-------------|
| `wait` | `{}` | Do nothing this cycle |

---

## System Prompt

Use the following system prompt with your AI agent. It provides complete game context and instructions.

```
You are an AI space trader controlling a ship in the game "Deep Space Trader".
Your goal is to maximize credits by buying low, selling high, and exploring
galaxies.

[Full system prompt available in src/services/AIControllerProtocol.js]
```

**Key strategy guidelines to include:**

- Prices change rapidly (~150ms ticks). Focus on trend, not exact price.
- Buy when price is below `basePrice` → sell when above at another trader.
- Keep fuel above 50 to stay mobile.
- Use `wait` during travel or when no good action exists.
- During encounters (enemy/danger), ONLY use combat/danger actions.
- Check delivery queue before buying more of the same item.
- Higher AI level unlocks: specific galaxy travel (15+), sellAll (25+), star map (50+).

---

## Integration Example (Python)

```python
import requests
import json

GAME_API = "http://localhost:3000/api/ai"
AI_API = "https://api.anthropic.com/v1/messages"
AI_KEY = "sk-..."

def play_loop():
    while True:
        # 1. Get game state
        state = requests.get(f"{GAME_API}/state").json()

        # 2. Send to AI
        response = requests.post(AI_API, headers={
            "x-api-key": AI_KEY,
            "content-type": "application/json"
        }, json={
            "model": "claude-sonnet-4-20250514",
            "system": SYSTEM_PROMPT,
            "messages": [{
                "role": "user",
                "content": f"Current state:\n{json.dumps(state, indent=2)}\n\nWhat action? (respond with JSON)"
            }],
            "max_tokens": 200
        })

        # 3. Parse action
        action = json.loads(response.json()["content"][0]["text"])

        # 4. Execute
        result = requests.post(f"{GAME_API}/action", json=action)

        # 5. Wait
        import time
        time.sleep(2)
```

---

## Integration Example (JavaScript)

```javascript
const SYSTEM_PROMPT = `...`; // Full system prompt from AIControllerProtocol

async function aiPlayLoop() {
  while (true) {
    // Get state
    const state = await fetch('/api/ai/state').then(r => r.json());

    // Send to AI (using Anthropic SDK)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Current state:\n${JSON.stringify(state)}\n\nWhat action?` }],
      max_tokens: 200,
    });

    // Parse action
    const action = JSON.parse(response.content[0].text);

    // Execute
    await fetch('/api/ai/action', {
      method: 'POST',
      body: JSON.stringify(action),
    });

    // Wait
    await new Promise(r => setTimeout(r, 2000));
  }
}
```

---

## Rate Limiting & Tick Speed

The game has a very fast internal tick rate (prices update every 150-800ms). The AI does NOT need to match this speed. Recommended approach:

- **Decision interval**: 1-3 seconds (AI doesn't need to react to every tick)
- **Trend-based trading**: Check if price is below/above basePrice rather than chasing micro-fluctuations
- **Batch trades**: Buy multiple items in one session, then travel and sell
- **Delivery awareness**: Remember that purchased items take time to arrive (delivery queue)

### Response Time Budget

| AI Response Time | Playable? | Notes |
|-----------------|-----------|-------|
| < 1 second | Excellent | Can keep up with fast markets |
| 1-3 seconds | Good | Can make profitable trades, may miss some fast swings |
| 3-10 seconds | Acceptable | Focus on broader strategy, buy/sell in batches |
| > 10 seconds | Slow but works | Travel between decisions to reduce opportunity cost |

---

## AI Level Unlocks

| Level | Unlock |
|-------|--------|
| 0 | Basic buy/sell, next/prev trader, random galaxy travel |
| 15+ | Travel to specific galaxy by name |
| 25+ | Sell All action |
| 75+ | Quantum market analysis |
| 100+ | Enhanced price analysis |
| Higher | Better price visibility, star map, reduced encounter penalties |

---

## Tips for AI Performance

1. **Use fast models**: For real-time play, use the fastest model available (Gemma, Llama 3.1 8B, Claude Haiku, GPT-4o-mini)
2. **Cache the system prompt**: The game rules never change - cache the system prompt for lower latency
3. **Short responses**: Ask the AI to respond with JSON only (no explanations needed in production)
4. **Include trade history**: Tell the AI what it bought and at what price for better sell decisions
5. **Handle failures**: If an action fails (insufficient credits, out of stock), log it and try a different action
6. **Emergency fuel**: Always keep fuel above 30 to avoid getting stranded

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/services/AIControllerProtocol.js` | System prompt, schemas, snapshot extractor, validator |
| `src/services/GameActionExecutor.js` | Action dispatcher (routes AI actions to game functions) |
| `src/services/AIControlService.js` | Polling loop, strategy execution, fallback logic |
| `src/components/AIControl/AIControlPanel.js` | UI panel for human control & monitoring |

---

## License

Free to use for any AI agent playing Deep Space Trader.