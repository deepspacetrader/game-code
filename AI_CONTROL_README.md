# AI Control Framework for Deep Space Trader

## Overview

The AI Control Framework allows you to write strategies and have an AI automatically play the Deep Space Trader game. This system uses **LM Studio** for local AI inference, allowing you to run the game with your own local AI models without needing external API keys.

## Features

- **Fast Refresh Loop**: Polls game state at configurable intervals (default: 500ms)
- **Strategy Execution**: Supports both prompt-based and function-based strategies
- **Local AI Integration**: Uses LM Studio for local AI inference (no API keys needed)
- **Model Selection**: Choose from available LM Studio models
- **Human Feedback**: Provides positive/neutral/negative feedback buttons to refine AI behavior
- **Action Tracking**: Logs all AI actions with results for analysis
- **Export Capabilities**: Export feedback history for analysis
- **Fallback Mode**: Rule-based fallback when LM Studio is unavailable

## Prerequisites

### LM Studio Setup

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Launch LM Studio
3. Load a model (recommended: smaller/faster models like `google/gemma-2-2b-it` or `microsoft/phi-3-mini-4k-instruct`)
4. Start the local server:
   - Click the "Server" button in LM Studio
   - Ensure it's running on `http://localhost:1234`
   - The server should show "Server running" status

**Note**: For best performance, use smaller models. Large models may be slow and impact gameplay responsiveness.

## Quick Start

### 1. Access the AI Control Panel

1. Start the game
2. Click the "🤖 AI Control" button in the top-right menu bar
3. The AI Control Panel will appear on the right side of the screen

### 2. Check LM Studio Connection

The panel will show:
- **Connected** (green badge): LM Studio is available
- **Not Connected** (yellow badge): Using fallback rule-based strategy

### 3. Select AI Model

If LM Studio is connected, you'll see a dropdown with available models. Choose a model based on your needs:
- **Faster models**: Better for real-time gameplay
- **Smaller models**: Less resource intensive
- **Larger models**: Smarter but slower

### 4. Write Your Strategy

You can write a strategy in two ways:

#### Option A: Prompt-Based Strategy (Simplest)

Enter a natural language description of your trading strategy in the "Strategy Prompt" textarea:

```
Buy items when price is low, sell when price is high. Focus on profitable trades.
```

The AI will interpret this prompt and make decisions accordingly.

#### Option B: Function-Based Strategy (Advanced)

For more control, create a JavaScript function that receives game state and returns actions:

```javascript
const myStrategy = {
  name: 'My Custom Strategy',
  decide: (gameState) => {
    const { credits, inventory, traders, currentTrader } = gameState;
    
    // Your custom logic here
    if (credits > 5000) {
      return {
        action: 'buy',
        item: 'Fusion Core',
        reason: 'Buying Fusion Core with available credits'
      };
    }
    
    return null; // No action
  }
};
```

### 5. Configure Refresh Rate

Set the refresh rate (in milliseconds) to control how often the AI polls game state:
- **Lower values (100-300ms)**: Faster decisions, more resource intensive
- **Higher values (1000-5000ms)**: Slower decisions, less resource intensive
- **Recommended**: 500ms for balanced performance

**Important**: If using a slow AI model, increase the refresh rate to avoid overwhelming the model.

### 6. Start the AI

Click "▶ Start AI" to begin automated gameplay. The AI will:
- Poll game state at the configured refresh rate
- Execute your strategy on each poll
- Log actions for feedback

### 7. Provide Feedback

When the AI takes an action, a feedback panel will appear with three buttons:
- **👍 Good**: Positive feedback
- **😐 Neutral**: Neutral feedback
- **👎 Bad**: Negative feedback

This feedback is logged and can be exported for analysis.

## Available Game Actions

The AI can execute the following actions:

### Buy
```javascript
{
  action: 'buy',
  item: 'item name',
  index: 0, // Optional: trader inventory index
  reason: 'explanation'
}
```

### Sell
```javascript
{
  action: 'sell',
  item: 'item name',
  index: 0, // Optional: player inventory index
  quantity: 1, // Optional: quantity to sell
  reason: 'explanation'
}
```

### Sell All
```javascript
{
  action: 'sellAll',
  item: 'item name',
  quantity: 1,
  reason: 'explanation'
}
```

### Travel
```javascript
{
  action: 'travel',
  to: 'galaxy name',
  galaxyId: 1, // Optional: galaxy ID
  reason: 'explanation'
}
```

### Buy Fuel
```javascript
{
  action: 'buyFuel',
  amount: 10,
  reason: 'explanation'
}
```

### Use Item
```javascript
{
  action: 'useItem',
  item: 'item name',
  reason: 'explanation'
}
```

## Game State Structure

The strategy's `decide` function receives the following game state:

```javascript
{
  credits: number,           // Current credits
  inventory: array,          // Player inventory
  fuel: number,              // Current fuel
  health: number,            // Current health
  traders: array,            // All traders in current galaxy
  currentTrader: number,     // Current trader index
  currentGalaxy: object,     // Current galaxy info
  galaxyName: string,        // Current galaxy name
  galaxies: array           // All available galaxies
}
```

## Example Strategies

Several example strategies are provided in `src/services/exampleStrategies.js`:

1. **Conservative Strategy**: Safe, profitable trades with risk management
2. **Aggressive Strategy**: Maximum profit seeking with higher risk
3. **Balanced Strategy**: Steady growth with balanced risk
4. **Quantum Focus**: Specializes in quantum processors and AI items
5. **Illegal Goods**: Focuses on high-profit illegal items
6. **Minimalist**: Simple trading patterns with few item types
7. **Explorer**: Travels frequently to find new opportunities
8. **Custom Function**: JavaScript function-based strategy example

To use an example strategy:

```javascript
import { exampleStrategies } from './services/exampleStrategies';

// In your AI Control Panel integration
const strategy = exampleStrategies.conservative;
aiControlService.start(strategy, { refreshRate: 500 });
```

## API Reference

### AIControlService

#### `start(strategy, options)`
Start AI control with a strategy.

```javascript
aiControlService.start(strategy, {
  refreshRate: 500 // milliseconds
});
```

#### `stop()`
Stop AI control.

```javascript
aiControlService.stop();
```

#### `submitFeedback(feedback)`
Submit feedback for the last action.

```javascript
aiControlService.submitFeedback('positive'); // or 'neutral', 'negative'
```

#### `getFeedbackStats()`
Get feedback statistics.

```javascript
const stats = aiControlService.getFeedbackStats();
// Returns: { total, positive, neutral, negative, unreviewed }
```

#### `exportFeedbackHistory()`
Export feedback history as JSON.

```javascript
const data = aiControlService.exportFeedbackHistory();
```

#### `createPromptStrategy(prompt, options)`
Create a prompt-based strategy.

```javascript
const strategy = aiControlService.createPromptStrategy(
  'Buy low, sell high',
  { name: 'My Strategy' }
);
```

## Architecture

### Components

1. **AIControlService** (`src/services/AIControlService.js`)
   - Manages strategy execution
   - Handles game state polling
   - Tracks feedback history
   - Provides callback system for AI responses

2. **GameActionExecutor** (`src/services/GameActionExecutor.js`)
   - Bridges AI service with game functions
   - Executes game actions (buy, sell, travel, etc.)
   - Provides game state to strategies

3. **AIControlPanel** (`src/components/AIControl/AIControlPanel.js`)
   - UI component for AI control
   - Strategy prompt input
   - Start/stop controls
   - Refresh rate configuration

4. **AIFeedbackPanel** (`src/components/AIControl/AIFeedbackPanel.js`)
   - UI component for human feedback
   - Displays pending actions
   - Collects positive/neutral/negative feedback

### Integration

The AI Control system integrates with the existing game via:
- **MarketplaceContext**: Provides game state and action functions
- **CerberasService**: Provides AI response generation for prompt-based strategies
- **Game Component**: Renders AI Control Panel and manages integration

## Extending the Framework

### Adding New Actions

To add a new game action:

1. Add the action handler in `GameActionExecutor.js`:

```javascript
async executeMyNewAction(action) {
  // Your implementation
  return { success: true, action: 'myNewAction' };
}
```

2. Add the action type to the dispatcher:

```javascript
case 'myNewAction':
  return await this.executeMyNewAction(action);
```

### Custom AI Models

To use a custom AI model instead of Cerberas:

1. Modify `AIControlService.createPromptStrategy()` to use your AI service
2. Ensure your service returns JSON-formatted actions

### Chrome Extension

To run as a Chrome extension:

1. Create a `manifest.json` file
2. Package the game as a web app
3. Use content scripts to inject the AI Control panel
4. Use chrome.storage API for persistence

## Best Practices

1. **Start Simple**: Begin with prompt-based strategies before moving to function-based
2. **Test Refresh Rates**: Adjust refresh rate based on your computer's performance
3. **Provide Feedback**: Regular feedback helps understand AI behavior patterns
4. **Export and Analyze**: Use exported feedback data to refine strategies
5. **Monitor Credits**: Ensure strategies don't deplete credits too quickly
6. **Handle Errors**: Strategies should gracefully handle null/undefined game state

## Troubleshooting

### AI Not Taking Actions
- Check that the strategy is returning valid action objects
- Verify game state is being polled correctly
- Ensure refresh rate is not too high (causing rate limiting)

### Feedback Not Appearing
- Ensure AI Control Panel is visible
- Check that actions are being executed successfully
- Verify feedback panel polling is active

### Performance Issues
- Increase refresh rate to reduce polling frequency
- Use simpler strategies to reduce AI processing time
- Close other browser tabs to free resources

## Future Enhancements

Planned features for future versions:

- [ ] Strategy sharing marketplace
- [ ] Multi-strategy support (switch between strategies)
- [ ] Performance metrics dashboard
- [ ] Strategy backtesting with historical data
- [ ] Reinforcement learning integration
- [ ] Chrome extension package
- [ ] Webhook support for external AI services
- [ ] Strategy versioning and rollback

## License

This AI Control Framework is part of Deep Space Trader. See the main project license for details.

## Support

For issues, questions, or contributions, please refer to the main Deep Space Trader repository.
