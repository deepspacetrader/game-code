/**
 * LM Studio Service - Local AI Integration
 * Connects to local LM Studio instance via its documented APIs:
 *   - POST /v1/chat/completions  (OpenAI-compatible, preferred)
 *   - POST /api/v1/chat          (Native LM Studio API, fallback)
 *   - GET  /v1/models            (List models, OpenAI)
 *   - GET  /api/v1/models        (List models, native)
 *   - POST /api/v1/load          (Load a model)
 *   - POST /api/v1/unload        (Unload a model)
 *
 * See: https://lmstudio.ai/docs/developer/openai-compat/chat-completions
 *      https://lmstudio.ai/docs/developer/rest/chat
 */

class LMStudioService {
  constructor() {
    this.baseUrl = 'http://localhost:1234';
    this.openaiBase = 'http://localhost:1234/v1';
    this.defaultModel = '';
    this.timeout = 30000;
    this.apiFormat = null; // 'openai' (preferred) or 'native'
    this._detectPromise = null;
    this._cachedAvailable = null; // Cache availability check
    this._cachedModels = null; // Cache models list
  }

  /**
   * Generate a text response from LM Studio.
   * Auto-detects API format on first call if not already detected.
   */
  async generateResponse(input, options = {}) {
    const { model = this.defaultModel, systemPrompt = '', maxTokens = 200, temperature = 0.7 } = options;

    // Auto-detect format on first call if not already detected
    if (!this.apiFormat) {
      this.apiFormat = await this._detectApiFormat();
    }

    if (this.apiFormat === 'openai') {
      return this._openaiChat(model, systemPrompt, input, maxTokens, temperature);
    }
    return this._nativeChat(model, systemPrompt, input, maxTokens, temperature);
  }

  /**
   * POST /v1/chat/completions — OpenAI-compatible format.
   */
  async _openaiChat(model, systemPrompt, input, maxTokens, temperature) {
    const messages = systemPrompt
      ? [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input },
        ]
      : [{ role: 'user', content: input }];

    const body = { model, messages, max_tokens: maxTokens, temperature };

    const response = await fetch(`${this.openaiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`LM Studio API error (${response.status}): ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content === undefined || content === null) {
      throw new Error('LM Studio returned empty response — model may not be loaded');
    }
    return content;
  }

  /**
   * POST /api/v1/chat — Native LM Studio REST API format.
   */
  async _nativeChat(model, systemPrompt, input, maxTokens, temperature) {
    const body = {
      model,
      input: [{ type: 'message', content: input }],
      max_output_tokens: maxTokens,
      temperature,
    };
    if (systemPrompt) body.system_prompt = systemPrompt;

    const response = await fetch(`${this.baseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`LM Studio API error (${response.status}): ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    const message = data.output?.find((o) => o.type === 'message');
    const content = message?.content;
    if (content === undefined || content === null) {
      throw new Error('LM Studio returned empty response — model may not be loaded');
    }
    return content;
  }

  /**
   * Detect which API format LM Studio supports.
   * Tries OpenAI-compatible format first, then native LM Studio API.
   */
  async _detectApiFormat() {
    if (this._detectPromise) return this._detectPromise;

    this._detectPromise = this._doDetect();
    return this._detectPromise;
  }

  async _doDetect() {
    // 1. Try OpenAI-compatible format
    try {
      const res = await fetch(`${this.openaiBase}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: '',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        console.log('[LM Studio] Detected OpenAI-compatible API');
        return 'openai';
      }
    } catch {
      // Fall through
    }

    // 2. Try native LM Studio API
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: '', input: 'test', max_output_tokens: 1 }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        console.log('[LM Studio] Detected native API');
        return 'native';
      }
    } catch {
      // Fall through
    }

    // Default to OpenAI format (most standard)
    console.log('[LM Studio] API detection failed, defaulting to OpenAI-compatible');
    return 'openai';
  }

  /**
   * Load a model in LM Studio.
   * POST /api/v1/load
   */
  async loadModel(modelId) {
    console.log('[LM Studio] Loading model:', modelId);
    const response = await fetch(`${this.baseUrl}/api/v1/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId }),
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to load model (${response.status}): ${text.slice(0, 200)}`);
    }
    // Reset detect so next call re-checks available endpoints
    this._detectPromise = null;
    this.apiFormat = null;
    // Clear cache after loading a new model
    this._cachedAvailable = null;
    this._cachedModels = null;
    return response.json();
  }

  /**
   * Unload the current model from memory.
   * POST /api/v1/unload
   */
  async unloadModel(modelId) {
    console.log('[LM Studio] Unloading model:', modelId || '(current)');
    const body = modelId ? { model: modelId } : {};
    const response = await fetch(`${this.baseUrl}/api/v1/unload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to unload model (${response.status}): ${text.slice(0, 200)}`);
    }
    this._detectPromise = null;
    this.apiFormat = null;
    // Clear cache after unloading
    this._cachedAvailable = null;
    this._cachedModels = null;
    return response.json();
  }

  /**
   * Check if LM Studio is available (server is running).
   * Results are cached per page load.
   */
  async isAvailable(forceRefresh = false) {
    if (this._cachedAvailable !== null && !forceRefresh) {
      return this._cachedAvailable;
    }

    try {
      const res = await fetch(`${this.openaiBase}/models`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        this._cachedAvailable = true;
        return true;
      }
    } catch {
      // Fall through
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/models`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        this._cachedAvailable = true;
        return true;
      }
    } catch {
      // Fall through
    }

    this._cachedAvailable = false;
    return false;
  }

  /**
   * Get list of available models from LM Studio.
   * Results are cached per page load.
   */
  async getAvailableModels(forceRefresh = false) {
    if (this._cachedModels !== null && !forceRefresh) {
      return this._cachedModels;
    }

    // 1. Try OpenAI-compatible format
    try {
      const res = await fetch(`${this.openaiBase}/models`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        // OpenAI format: { data: [{ id: "model-name", ... }] }
        if (data.data && Array.isArray(data.data)) {
          const models = data.data.map((m) => m.id).filter(Boolean);
          if (models.length > 0) {
            this._cachedModels = models;
            return models;
          }
        }
      }
    } catch {
      // Fall through
    }

    // 2. Try native LM Studio API
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/models`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        let models;
        if (Array.isArray(data)) {
          models = data.map((m) => (typeof m === 'string' ? m : m.id || m.name || m)).filter(Boolean);
        } else if (data.data) {
          models = data.data.map((m) => m.id).filter(Boolean);
        }
        if (models && models.length > 0) {
          this._cachedModels = models;
          return models;
        }
      }
    } catch {
      // Fall through
    }

    this._cachedModels = [];
    return [];
  }

  /**
   * Get the currently loaded model (if any).
   */
  async getCurrentModel() {
    try {
      const res = await fetch(`${this.openaiBase}/models`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data[0].id || null;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Set the default model to use for requests.
   */
  setModel(model) {
    this.defaultModel = model;
  }

  /**
   * Set the base URL for LM Studio.
   */
  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/+$/, '');
    this.openaiBase = `${this.baseUrl}/v1`;
    this._detectPromise = null;
    this.apiFormat = null;
  }
}

// Singleton instance
export const lmStudioService = new LMStudioService();
export default lmStudioService;