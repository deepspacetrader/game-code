/**
 * Example AI Strategies for Deep Space Trader
 * Users can use these as templates or modify them for their own strategies
 */

import { aiControlService } from './AIControlService';

// Example 1: Conservative Trading Strategy
export const conservativeStrategy = aiControlService.createPromptStrategy(
  `You are a conservative trader. Focus on safe, profitable trades.
  
Rules:
- Only buy items when price is 20% or more below base price
- Only sell items when price is 20% or more above base price
- Never spend more than 50% of current credits on a single purchase
- Keep at least 1000 credits in reserve at all times
- Prioritize items with high volatility for better profit margins
- Avoid illegal items unless profit margin is > 50%
- Travel to new galaxies only when current market has no good opportunities`,
  { name: 'Conservative Trader' }
);

// Example 2: Aggressive Trading Strategy
export const aggressiveStrategy = aiControlService.createPromptStrategy(
  `You are an aggressive trader seeking maximum profit quickly.
  
Rules:
- Buy any item with price below base price
- Sell items as soon as price rises above purchase price
- Spend up to 80% of credits on purchases
- Take risks on illegal items for high profit potential
- Travel frequently to find better markets
- Focus on quantum processors and high-value items
- Don't worry about keeping large credit reserves`,
  { name: 'Aggressive Trader' }
);

// Example 3: Balanced Strategy
export const balancedStrategy = aiControlService.createPromptStrategy(
  `You are a balanced trader seeking steady growth.
  
Rules:
- Buy items when price is 10-15% below base price
- Sell items when price is 15-20% above base price
- Maintain 2000-3000 credits in reserve
- Diversify inventory across different item types
- Travel when current galaxy has limited opportunities
- Consider both legal and illegal items based on profit potential
- Keep an eye on fuel costs when traveling`,
  { name: 'Balanced Trader' }
);

// Example 4: Quantum Focus Strategy
export const quantumFocusStrategy = aiControlService.createPromptStrategy(
  `You specialize in quantum processors and AI enhancement items.
  
Rules:
- Prioritize buying Quantum Processors and AI-related items
- Buy these items even at slightly above base price if stock is low
- Sell quantum items when price is 25% above purchase price
- Travel to galaxies with tech-focused traders
- Buy fuel regularly to enable frequent travel
- Ignore most other items unless they're extremely profitable
- Focus on improving AI level through item effects`,
  { name: 'Quantum Specialist' }
);

// Example 5: Illegal Goods Strategy
export const illegalGoodsStrategy = aiControlService.createPromptStrategy(
  `You specialize in illegal goods trading for high profits.
  
Rules:
- Focus on illegal items with high profit margins
- Buy illegal items when available, even at higher prices
- Sell illegal items in safe galaxies (non-dangerous areas)
- Avoid galaxies with high danger ratings when carrying illegal goods
- Keep credits high to bribe/escape if caught
- Travel frequently to find new illegal item sources
- Accept higher risk for higher rewards`,
  { name: 'Illegal Goods Trader' }
);

// Example 6: Minimalist Strategy
export const minimalistStrategy = aiControlService.createPromptStrategy(
  `You are a minimalist trader. Keep things simple.
  
Rules:
- Only trade 2-3 types of items maximum
- Focus on items with consistent profit margins
- Buy in bulk when prices are good
- Sell all inventory before traveling
- Keep travel to a minimum
- Maintain simple, predictable trading patterns`,
  { name: 'Minimalist Trader' }
);

// Example 7: Explorer Strategy
export const explorerStrategy = aiControlService.createPromptStrategy(
  `You are an explorer who travels frequently to find opportunities.
  
Rules:
- Travel to new galaxies every 3-5 trades
- Buy items that are unique to current galaxy
- Sell them in galaxies where they're rare
- Keep fuel levels high for frequent travel
- Don't stay in one galaxy too long
- Explore all galaxies to find the best trading routes
- Accept lower profit margins for the sake of exploration`,
  { name: 'Galaxy Explorer' }
);

// Example 8: Custom Function-Based Strategy
export const customFunctionStrategy = {
  name: 'Custom Function Strategy',
  decide: (gameState) => {
    // This is a JavaScript function-based strategy
    // Users can write custom logic here
    
    const { credits, inventory, traders, currentTrader } = gameState;
    
    // Example logic: Buy cheapest item if credits > 5000
    if (credits > 5000 && traders && traders[currentTrader]) {
      const trader = traders[currentTrader];
      const cheapestItem = trader.inventory
        .filter(item => item.stock > 0 && item.price <= credits)
        .sort((a, b) => a.price - b.price)[0];
      
      if (cheapestItem) {
        return {
          action: 'buy',
          item: cheapestItem.name,
          index: trader.inventory.indexOf(cheapestItem),
          reason: 'Buying cheapest available item',
        };
      }
    }
    
    // Example logic: Sell most expensive item if inventory > 5
    if (inventory && inventory.length > 5) {
      const mostExpensive = inventory
        .sort((a, b) => (b.price || 0) - (a.price || 0))[0];
      
      if (mostExpensive) {
        return {
          action: 'sell',
          item: mostExpensive.name,
          index: inventory.indexOf(mostExpensive),
          reason: 'Selling most expensive item to free inventory',
        };
      }
    }
    
    return null; // No action to take
  },
};

// Export all strategies
export const exampleStrategies = {
  conservative: conservativeStrategy,
  aggressive: aggressiveStrategy,
  balanced: balancedStrategy,
  quantumFocus: quantumFocusStrategy,
  illegalGoods: illegalGoodsStrategy,
  minimalist: minimalistStrategy,
  explorer: explorerStrategy,
  customFunction: customFunctionStrategy,
};

export default exampleStrategies;
