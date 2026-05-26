/**
 * Amphibious Agents - AI-Powered Roleplay System
 * Manages AI agent personas, dialog generation, and leaderboard tracking
 */

import { cerberasService } from '../services/CerberasService';

// Agent species types
export const SPECIES = {
  AMPHIBIOUS: 'amphibious',
  REPTILIAN: 'reptilian',
  SILICON: 'silicon',
  AVIAN: 'avian',
  INSECTOID: 'insectoid',
};

// Leaderboard storage key
const LEADERBOARD_KEY = 'amphibious_agents_leaderboard';

/**
 * Amphibious Agent Class
 * Represents a single AI-powered trader agent
 */
export class AmphibiousAgent {
  constructor(config = {}) {
    this.id = config.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = config.name || 'Unknown';
    this.species = config.species || SPECIES.AMPHIBIOUS;
    this.persona = config.persona || null;
    this.stats = {
      tradesCompleted: 0,
      profitGenerated: 0,
      conversations: 0,
      rating: 100, // Starting ELO-like rating
      wins: 0,
      losses: 0,
      ...config.stats,
    };
    this.isActive = config.isActive || true;
    this.lastActive = config.lastActive || Date.now();
    this.tradingHistory = [];
    
    // Initialize persona if not provided
    if (!this.persona) {
      this.initializePersona();
    }
  }

  /**
   * Initialize agent persona using AI
   */
  async initializePersona() {
    if (cerberasService.isConfigured()) {
      try {
        this.persona = await cerberasService.generateAgentPersona(this.species);
      } catch (error) {
        console.warn('AI persona generation failed, using defaults');
        this.persona = cerberasService.getDefaultPersona(this.species);
      }
    } else {
      this.persona = cerberasService.getDefaultPersona(this.species);
    }
    
    // Update name from persona if available
    if (this.persona?.name) {
      this.name = this.persona.name;
    }
  }

  /**
   * Generate dialog response
   */
  async generateDialog(input, context = {}) {
    const systemPrompt = `You are ${this.name}, a ${this.persona?.species || this.species} trader.
    
Personality: ${this.persona?.personality || 'neutral'}
Speech Pattern: ${this.persona?.speechPattern || 'normal'}
Specialty: ${this.persona?.specialty || 'general trading'}

Stay in character. Keep responses concise (under 150 characters).
You're in a sci-fi trading post, negotiating deals.`;

    try {
      return await cerberasService.generateResponse(input, {
        systemPrompt,
        temperature: 0.8,
        maxTokens: 100,
      });
    } catch (error) {
      console.error('Dialog generation failed:', error);
      return this.generateFallbackDialog(input);
    }
  }

  /**
   * Fallback dialog when AI is unavailable
   */
  generateFallbackDialog(input) {
    const responses = {
      greeting: [
        `*${this.name} nods in greeting*`,
        `${this.name} acknowledges your presence`,
        `*${this.name} prepares for trade*`,
      ],
      negotiation: [
        `${this.name} considers your offer carefully`,
        `*${this.name} calculates profit margins*`,
        `${this.name} seems interested...`,
      ],
      default: [
        `${this.name} waits for your proposal`,
        `*${this.name} observes the market*`,
        `${this.name} is ready to trade`,
      ],
    };

    const lowerInput = input.toLowerCase();
    let category = 'default';
    
    if (lowerInput.match(/hi|hello|greetings/)) {
      category = 'greeting';
    } else if (lowerInput.match(/trade|buy|sell|price/)) {
      category = 'negotiation';
    }

    const categoryResponses = responses[category];
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  }

  /**
   * Update agent stats after trade
   */
  updateStats(tradeResult) {
    this.stats.tradesCompleted++;
    this.stats.profitGenerated += tradeResult.profit || 0;
    this.stats.lastActive = Date.now();
    
    if (tradeResult.profit > 0) {
      this.stats.wins++;
      this.stats.rating += 10; // Simplified ELO
    } else {
      this.stats.losses++;
      this.stats.rating = Math.max(0, this.stats.rating - 5);
    }

    this.tradingHistory.push({
      timestamp: Date.now(),
      ...tradeResult,
    });

    // Keep only last 100 trades
    if (this.tradingHistory.length > 100) {
      this.tradingHistory.shift();
    }
  }

  /**
   * Serialize agent for storage
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      species: this.species,
      persona: this.persona,
      stats: this.stats,
      isActive: this.isActive,
      lastActive: this.lastActive,
      tradingHistory: this.tradingHistory,
    };
  }

  /**
   * Deserialize agent from storage
   */
  static fromJSON(data) {
    return new AmphibiousAgent(data);
  }
}

/**
 * Leaderboard Manager
 * Tracks and ranks all agents
 */
export class LeaderboardManager {
  constructor() {
    this.agents = [];
    this.loadFromStorage();
  }

  /**
   * Add agent to leaderboard
   */
  addAgent(agent) {
    if (!(agent instanceof AmphibiousAgent)) {
      agent = AmphibiousAgent.fromJSON(agent);
    }
    
    const existingIndex = this.agents.findIndex(a => a.id === agent.id);
    
    if (existingIndex >= 0) {
      this.agents[existingIndex] = agent;
    } else {
      this.agents.push(agent);
    }

    this.saveToStorage();
    return agent;
  }

  /**
   * Get top N agents by rating
   */
  getTopAgents(limit = 10) {
    return [...this.agents]
      .sort((a, b) => b.stats.rating - a.stats.rating)
      .slice(0, limit);
  }

  /**
   * Get leaderboard with rankings
   */
  getLeaderboard() {
    const sorted = [...this.agents].sort((a, b) => b.stats.rating - a.stats.rating);
    
    return sorted.map((agent, index) => ({
      rank: index + 1,
      id: agent.id,
      name: agent.name,
      species: agent.species,
      rating: agent.stats.rating,
      tradesCompleted: agent.stats.tradesCompleted,
      profitGenerated: agent.stats.profitGenerated,
      winRate: agent.stats.tradesCompleted > 0 
        ? ((agent.stats.wins / agent.stats.tradesCompleted) * 100).toFixed(1) 
        : '0.0',
    }));
  }

  /**
   * Save leaderboard to localStorage
   */
  saveToStorage() {
    try {
      const data = this.agents.map(agent => agent.toJSON());
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save leaderboard:', error);
    }
  }

  /**
   * Load leaderboard from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(LEADERBOARD_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.agents = parsed.map(agentData => AmphibiousAgent.fromJSON(agentData));
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      this.agents = [];
    }
  }

  /**
   * Clear all leaderboard data
   */
  clear() {
    this.agents = [];
    localStorage.removeItem(LEADERBOARD_KEY);
  }
}

// Singleton instance
export const leaderboardManager = new LeaderboardManager();
export default AmphibiousAgent;
