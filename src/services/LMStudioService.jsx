/**
 * LM Studio Service - Local AI Integration
 * Connects to local LM Studio instance for AI responses
 */

class LMStudioService {
  constructor() {
    this.baseUrl = 'http://localhost:1234/v1';
    this.defaultModel = 'google/gemma-4-e4b'; // Default model, can be changed
    this.queue = [];
    this.isProcessing = false;
    this.timeout = 30000; // 30 second timeout for local AI
    this.apiFormat = null; // Will be detected: 'openai', 'legacy', 'openai-v1', or 'unknown'
  }

  /**
   * Generate AI response
   */
  async generateResponse(input, options = {}) {
    const {
      model = this.defaultModel,
      systemPrompt = 'You are a helpful assistant.',
      maxTokens = 200,
      temperature = 0.7,
    } = options;

    return new Promise((resolve, reject) => {
      this.queue.push({
        input,
        options: { model, systemPrompt, maxTokens, temperature },
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
   * Process queued requests
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

      // Small delay between requests to avoid overwhelming local AI
      await this.delay(100);
    }

    this.isProcessing = false;
  }

  /**
   * Make actual API call to LM Studio
   */
  async makeRequest(request) {
    const { input, options } = request;
    const { model, systemPrompt, maxTokens, temperature } = options;

    // Detect API format if not already detected
    if (!this.apiFormat) {
      this.apiFormat = await this.detectApiFormat();
      console.log('Detected LM Studio API format:', this.apiFormat);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      let endpoint, body;

      // Use detected format
      if (this.apiFormat === 'openai') {
        endpoint = `${this.baseUrl}/chat/completions`;
        body = {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input },
          ],
          // LM Studio doesn't recognize max_tokens
          temperature: temperature,
        };
      } else if (this.apiFormat === 'openai-v1') {
        endpoint = `${this.baseUrl}/v1/chat/completions`;
        body = {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input },
          ],
          // LM Studio doesn't recognize max_tokens
          temperature: temperature,
        };
      } else if (this.apiFormat === 'legacy') {
        endpoint = `${this.baseUrl}/chat`;
        body = {
          model: model,
          system_prompt: systemPrompt,
          input: input,
          // Don't include max_tokens in legacy format as it's not recognized
          temperature: temperature,
        };
      } else {
        // Unknown format, try legacy as fallback without max_tokens
        endpoint = `${this.baseUrl}/chat`;
        body = {
          model: model,
          system_prompt: systemPrompt,
          input: input,
          temperature: temperature,
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('LM Studio API error details:', JSON.stringify(errorData, null, 2));
        const errorMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
        throw new Error(errorMessage || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Parse response based on format
      if (this.apiFormat === 'openai' || this.apiFormat === 'openai-v1') {
        if (data.choices && data.choices[0]) {
          return data.choices[0].message?.content || data.choices[0].text;
        }
      } else {
        // Legacy format - handle array responses
        if (Array.isArray(data)) {
          // Extract the message content from array format
          const messageItem = data.find(item => item.type === 'message');
          if (messageItem && messageItem.content) {
            // Extract JSON from markdown code blocks
            const jsonMatch = messageItem.content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              return jsonMatch[1];
            }
            return messageItem.content;
          }
          // Fallback to last item's content
          const lastItem = data[data.length - 1];
          return lastItem.content || JSON.stringify(lastItem);
        }
        // Legacy format - handle object responses
        if (data.response) {
          return data.response;
        } else if (data.output) {
          return data.output;
        } else if (data.text) {
          return data.text;
        } else if (data.choices && data.choices[0]) {
          return data.choices[0].message?.content || data.choices[0].text;
        }
      }
      
      return 'No response generated';
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('LM Studio request timed out');
      }
      console.error('LM Studio API error:', error);
      throw error;
    }
  }

  /**
   * Try legacy LM Studio format
   */
  async makeLegacyRequest(request) {
    const { input, options } = request;
    const { model, systemPrompt, maxTokens, temperature } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          system_prompt: systemPrompt,
          input: input,
          max_tokens: maxTokens,
          temperature: temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Legacy format response parsing
      if (data.response) {
        return data.response;
      } else if (data.output) {
        return data.output;
      } else if (data.text) {
        return data.text;
      } else if (data.choices && data.choices[0]) {
        return data.choices[0].message?.content || data.choices[0].text;
      } else if (typeof data === 'string') {
        return data;
      }
      
      return 'No response generated';
      
    } catch (error) {
      console.error('LM Studio legacy API error:', error);
      throw error;
    }
  }

  /**
   * Set the model to use
   */
  setModel(model) {
    this.defaultModel = model;
  }

  /**
   * Set the base URL (for different LM Studio ports)
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * Check if LM Studio is available
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect the correct API format
   */
  async detectApiFormat() {
    // Try OpenAI format first
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'test',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) return 'openai';
    } catch (e) {
      // Continue to legacy
    }

    // Try legacy format
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'test',
          input: 'test',
        }),
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) return 'legacy';
    } catch (e) {
      // Continue
    }

    // Try /v1/chat/completions (some versions use this)
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'test',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) return 'openai-v1';
    } catch (e) {
      // Continue
    }

    return 'unknown';
  }

  /**
   * Get available models from LM Studio
   */
  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      // LM Studio returns { models: [{ key: "model-name", display_name: "...", ... }] }
      if (data.models && Array.isArray(data.models)) {
        return data.models.map(m => m.key || m.display_name).filter(Boolean);
      }

      // OpenAI-compatible format: { data: [{ id: "model-name", ... }] }
      if (data.data && Array.isArray(data.data)) {
        return data.data.map(m => m.id).filter(Boolean);
      }

      // Plain array of strings
      if (Array.isArray(data)) {
        return data.map(m => typeof m === 'string' ? m : (m.id || m.name)).filter(Boolean);
      }

      console.log('Unknown LM Studio models format:', data);
      return [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const lmStudioService = new LMStudioService();
export default lmStudioService;
