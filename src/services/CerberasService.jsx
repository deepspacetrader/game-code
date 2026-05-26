/**
 * Cerberas AI Service - Free Tier Integration
 * Handles all AI communication for amphibious agent roleplay
 */

const CERBERAS_API_KEY = process.env.REACT_APP_CERBERAS_API_KEY || '';
const CERBERAS_BASE_URL = 'https://api.cerebras.ai/v1';

// Free model selection - using only free tier models
const FREE_MODELS = {
  LLAMA_8B: 'Llama-3.3-70B-Instruct', // Free tier available
  LLAMA_70B: 'Llama-3.3-70B-Instruct',
};

class CerberasService {
  constructor() {
    this.apiKey = CERBERAS_API_KEY;
    this.baseUrl = CERBERAS_BASE_URL;
    this.queue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
  }

  /**
   * Generate AI response for trader dialog
   * @param {string} prompt - The conversation prompt
   * @param {object} options - Generation options
   * @returns {Promise<string>} AI-generated response
   */
  async generateResponse(prompt, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 150,
      model = FREE_MODELS.LLAMA_70B,
      systemPrompt = 'You are an intergalactic trader in a sci-fi universe.',
    } = options;

    // Rate limiting - queue requests
    return new Promise((resolve, reject) => {
      this.queue.push({
        prompt,
        options: { temperature, maxTokens, model, systemPrompt },
        resolve,
        reject,
        timestamp: Date.now(),
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      
      try {
        const response = await this.makeRequest(request);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }

      // Rate limit: 1 request per second for free tier
      await this.delay(1000);
    }

    this.isProcessing = false;
  }

  /**
   * Make actual API call to Cerberas
   */
  async makeRequest(request) {
    const { prompt, options } = request;
    const { temperature, maxTokens, model, systemPrompt } = options;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: temperature,
            max_tokens: maxTokens,
            stream: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No response generated';
        
      } catch (error) {
        console.error(`Cerberas API attempt ${attempt + 1} failed:`, error);
        
        if (attempt === this.retryAttempts - 1) {
          throw error;
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  /**
   * Generate amphibious agent persona
   */
  async generateAgentPersona(species = 'amphibious') {
    const systemPrompt = `You are creating a unique ${species} species trader persona for a sci-fi trading game. 
    Generate a character with:
    - Name (alien-sounding but pronounceable)
    - Species traits (physical/behavioral)
    - Trading specialty
    - Personality quirks
    - Speech pattern
    
    Format as JSON object with fields: name, species, specialty, traits, personality, speechPattern
    Keep it under 200 characters total.`;

    try {
      const response = await this.generateResponse(
        'Create a unique alien trader persona',
        { systemPrompt, maxTokens: 100, temperature: 0.8 }
      );
      
      // Try to parse as JSON, fallback to default
      try {
        return JSON.parse(response);
      } catch {
        return this.getDefaultPersona(species);
      }
    } catch (error) {
      console.warn('Failed to generate persona, using default:', error);
      return this.getDefaultPersona(species);
    }
  }

  /**
   * Get default persona if AI generation fails
   */
  getDefaultPersona(species) {
    const personas = {
      amphibious: {
        name: 'Zorglax',
        species: 'Amphibious',
        specialty: 'Aquatic resources',
        traits: ['Webbed fingers', 'Gills', 'Moist skin'],
        personality: 'Calm, calculating, patient',
        speechPattern: 'Speaks in bubbles... *blip*'
      },
      reptilian: {
        name: 'Vexxor',
        species: 'Reptilian',
        specialty: 'Rare minerals',
        traits: ['Scales', 'Cold-blooded', 'Sharp claws'],
        personality: 'Aggressive, territorial',
        speechPattern: 'Hisses on sibilants'
      },
      silicon: {
        name: 'Crystalline-7',
        species: 'Silicon-based',
        specialty: 'Technology',
        traits: ['Crystalline structure', 'Glowing core'],
        personality: 'Logical, emotionless',
        speechPattern: 'Robotic, precise'
      }
    };

    return personas[species] || personas.amphibious;
  }

  /**
   * Generate dynamic market commentary
   */
  async generateMarketCommentary(marketState, trader) {
    const systemPrompt = `You are ${trader.name}, a ${trader.species} trader.
    Comment on current market conditions in character.
    Market state: ${JSON.stringify(marketState)}
    Keep it under 100 characters. Make it colorful and in-character.`;

    try {
      return await this.generateResponse(
        'Comment on the current market',
        { systemPrompt, maxTokens: 50, temperature: 0.9 }
      );
    } catch (error) {
      return this.generateFallbackCommentary(trader);
    }
  }

  /**
   * Fallback commentary when AI fails
   */
  generateFallbackCommentary(trader) {
    const comments = [
      `*${trader.name} adjusts trading collar*`,
      `*${trader.name} emits trading sounds*`,
      `Market fluctuations detected...`,
      `${trader.name} is observing the market...`
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API key is present
   */
  isConfigured() {
    return !!this.apiKey && this.apiKey.length > 10;
  }
}

// Singleton instance
export const cerberasService = new CerberasService();
export default cerberasService;
