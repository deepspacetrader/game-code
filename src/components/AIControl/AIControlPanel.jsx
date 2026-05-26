/**
 * AI Control Panel - Main UI for AI Strategy Control
 * Defaults to local mode (no external LLM needed). The strategy prompt
 * is parsed into rules and decisions are made locally in <1ms.
 * Optionally supports LM Studio for external LLM strategies.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Form, Badge, Alert, Accordion } from 'react-bootstrap';
import { aiControlService } from '../../services/AIControlService';
import { lmStudioService } from '../../services/LMStudioService';
import { gameActionExecutor } from '../../services/GameActionExecutor';
import { getFastGameSnapshot } from '../../services/AIControllerProtocol';
import AIFeedbackPanel from './AIFeedbackPanel';
import './AIControlPanel.scss';

const AIControlPanel = ({ gameFunctions, currentEnemy, quantumPower, quantumSlotsUsed }) => {
  const [isActive, setIsActive] = useState(false);
  const [strategyPrompt, setStrategyPrompt] = useState(
    'Buy items when price is below base price. Sell when price is above base price. Keep fuel above 50. Focus on steady profit.'
  );
  const [status, setStatus] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastDecision, setLastDecision] = useState(null);
  const [aiStatusLog, setAiStatusLog] = useState([]);

  // Mode: 'local' (fast, no deps) or 'lmstudio' (uses external LLM)
  const [aiMode, setAiMode] = useState('local');

  // LM Studio state (only shown when mode is 'lmstudio')
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [lmStudioAvailable, setLmStudioAvailable] = useState(false);

  // Encounter state
  const encounterState = useMemo(() => {
    if (!currentEnemy) return null;
    return {
      type: 'enemy',
      enemyName: currentEnemy.name,
      enemyHealth: currentEnemy.health,
      enemyMaxHealth: currentEnemy.maxHealth || currentEnemy.health,
      enemyDamage: currentEnemy.damage,
      enemyRank: currentEnemy.rank || 'Unknown',
      playerTurn: true,
      timeLeft: 30,
      options: ['attack', 'escape', 'bribe'],
    };
  }, [currentEnemy]);

  // Register game functions once
  useEffect(() => {
    if (gameFunctions) {
      gameActionExecutor.registerGameFunctions(gameFunctions);
    }
  }, [gameFunctions]);

  // Register callbacks with AI control service
  useEffect(() => {
    aiControlService.onGameStateUpdate = async () => {
      if (!gameFunctions) return null;
      const extra = { encounter: encounterState, quantumPower, quantumSlotsUsed };
      return getFastGameSnapshot(gameFunctions, extra);
    };

    aiControlService.onActionExecute = async (action) => {
      if (gameFunctions) {
        setLastDecision(action);
        return await gameActionExecutor.executeAction(action);
      }
      return null;
    };

    aiControlService.onFeedback = (feedbackData) => {
      setStatus(`Feedback: ${feedbackData.feedback}`);
      setAiStatusLog((log) => [
        ...log.slice(-19),
        `[${new Date().toLocaleTimeString()}] Feedback: ${feedbackData.feedback}`,
      ]);
    };
  }, [gameFunctions, encounterState, quantumPower, quantumSlotsUsed]);

  const handleStart = useCallback(async () => {
    try {
      let strategy;

      if (aiMode === 'local') {
        // Fast local strategy — no external dependencies
        strategy = aiControlService.createLocalStrategy(strategyPrompt, {
          name: 'Local Strategy',
        });
      } else {
        // LM Studio — external LLM
        if (selectedModel) {
          lmStudioService.setModel(selectedModel);
        }
        strategy = aiControlService.createFastPromptStrategy(strategyPrompt, {
          name: 'LM Studio Strategy',
          temperature: 0.2,
          maxTokens: 80,
        });
      }

      aiControlService.start(strategy);
      setIsActive(true);
      setStatus(`AI started (${aiMode} mode)`);
      setShowFeedback(true);
      setAiStatusLog((log) => [
        ...log,
        `[${new Date().toLocaleTimeString()}] Started (${aiMode}) — ${strategyPrompt.slice(0, 50)}...`,
      ]);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  }, [strategyPrompt, aiMode, selectedModel]);

  const logEntry = useCallback((msg) => {
    setAiStatusLog((log) => [...log.slice(-19), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const checkLMStudio = useCallback(async () => {
    const available = await lmStudioService.isAvailable();
    setLmStudioAvailable(available);
    if (available) {
      const models = await lmStudioService.getAvailableModels();
      setAvailableModels(models);
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0]);
      }
      logEntry(`Found ${models.length} LM Studio model(s)`);
    } else {
      setStatus('LM Studio not available');
    }
  }, [selectedModel, logEntry]);

  const handleStop = useCallback(() => {
    aiControlService.stop();
    setIsActive(false);
    setStatus('AI stopped');
    setShowFeedback(false);
    setAiStatusLog((log) => [...log, `[${new Date().toLocaleTimeString()}] Stopped`]);
  }, []);

  const handleExportFeedback = () => {
    const data = aiControlService.exportFeedbackHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-feedback-history.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Feedback history exported');
  };

  return (
    <div className="ai-control-panel">
      <div className="ai-control-header">
        <h5>AI Strategy Control</h5>
        <Badge bg={isActive ? 'success' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
        <Badge bg={aiMode === 'local' ? 'info' : 'warning'} className="ms-2">
          {aiMode === 'local' ? 'Local Mode' : 'LM Studio'}
        </Badge>
      </div>

      <Form className="ai-control-form">
        {/* Strategy Prompt — the core of the AI's behavior */}
        <Form.Group className="mb-2">
          <Form.Label className="fw-bold">Strategy Prompt</Form.Label>
          <div className="text-muted small mb-1">
            Tell the AI HOW to trade. It parses your instructions into rules and plays fast.
          </div>
          <Form.Control
            as="textarea"
            rows={3}
            value={strategyPrompt}
            onChange={(e) => setStrategyPrompt(e.target.value)}
            placeholder="Describe your trading strategy. Example: Buy items under base price, sell above. Keep fuel above 50. Focus on steady profit."
            disabled={isActive}
          />
        </Form.Group>

        {/* Mode toggle: Local vs LM Studio */}
        <div className="mb-2">
          <Form.Check
            type="switch"
            id="ai-mode-switch"
            label={
              <span>
                Use <strong>LM Studio</strong> (external LLM, slower) —{' '}
                <span className="text-muted">off = local mode (fast, no deps)</span>
              </span>
            }
            checked={aiMode === 'lmstudio'}
            onChange={(e) => setAiMode(e.target.checked ? 'lmstudio' : 'local')}
            disabled={isActive}
          />
        </div>

        {/* LM Studio settings (collapsible, only when mode=lmstudio) */}
        {aiMode === 'lmstudio' && (
          <div className="lm-studio-section mb-3 p-2 border rounded">
            <Form.Group className="mb-2">
              <Form.Label>Model</Form.Label>
              <div className="d-flex gap-2">
                <Form.Select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isActive}
                  className="flex-grow-1"
                  size="sm"
                >
                  {availableModels.length === 0 && <option value="">No models found</option>}
                  {availableModels.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </Form.Select>
                <Button variant="outline-primary" size="sm" onClick={checkLMStudio} disabled={isActive}>
                  Refresh
                </Button>
              </div>
              <Form.Text className={lmStudioAvailable ? 'text-success' : 'text-muted'}>
                {lmStudioAvailable ? `${availableModels.length} model(s) available` : 'Not connected'}
              </Form.Text>
            </Form.Group>
          </div>
        )}

        {/* Start/Stop buttons */}
        <div className="ai-control-buttons d-flex gap-2">
          {!isActive ? (
            <Button variant="success" onClick={handleStart} className="flex-grow-1">
              Start AI
            </Button>
          ) : (
            <Button variant="danger" onClick={handleStop} className="flex-grow-1">
              Stop AI
            </Button>
          )}
          <Button variant="outline-secondary" size="sm" onClick={handleExportFeedback}>
            Export
          </Button>
        </div>
      </Form>

      {/* Last decision display */}
      {lastDecision && isActive && (
        <Alert variant="info" className="mt-2 ai-decision-alert" style={{ padding: '6px 10px', marginBottom: '6px' }}>
          <strong>Last:</strong> {lastDecision.action}
          {lastDecision.params?.item && ` — ${lastDecision.params.item}`}
          {lastDecision.reason && (
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>{lastDecision.reason}</div>
          )}
        </Alert>
      )}

      {/* Encounter alert */}
      {encounterState && isActive && (
        <Alert variant="danger" className="mt-2" style={{ padding: '6px 10px', marginBottom: '6px' }}>
          <strong>Combat!</strong> {encounterState.enemyName} ({encounterState.enemyHealth}/{encounterState.enemyMaxHealth} HP)
        </Alert>
      )}

      {/* Status */}
      {status && (
        <Alert variant={status.includes('Error') ? 'danger' : 'info'} className="mt-2" style={{ padding: '6px 10px' }}>
          <small>{status}</small>
        </Alert>
      )}

      {/* Collapsible logs */}
      <Accordion className="mt-2">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Activity Log ({aiStatusLog.length})</Accordion.Header>
          <Accordion.Body>
            <pre className="ai-log-pre" style={{ maxHeight: '120px', fontSize: '0.75rem' }}>
              {aiStatusLog.length === 0 ? 'No activity yet' : aiStatusLog.join('\n')}
            </pre>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <AIFeedbackPanel isVisible={showFeedback} />
    </div>
  );
};

export default AIControlPanel;