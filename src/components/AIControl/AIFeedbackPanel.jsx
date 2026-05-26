/**
 * AI Feedback Panel - Stacked history with training mode and strategy recommendations
 *
 * Training mode: AI pauses after each action and waits for human feedback.
 * Every 10 ratings: AI analyzes what worked/didn't and suggests a strategy update.
 *
 * Each action card shows:
 *  - What the AI wanted to do (action + item)
 *  - Why the AI chose it (reason)
 *  - Whether it succeeded or failed with details
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Alert } from 'react-bootstrap';
import { aiControlService } from '../../services/AIControlService';
import './AIFeedbackPanel.scss';

const ACTION_LABELS = {
  buy: 'Buy',
  sell: 'Sell',
  sellAll: 'Sell All',
  buyFuel: 'Buy Fuel',
  useItem: 'Use Item',
  nextTrader: 'Travel → Next',
  prevTrader: 'Travel ← Prev',
  travelGalaxy: 'Jump Galaxy',
  assignQuantum: 'Assign QP',
  toggleQuantum: 'Toggle Quantum',
  attack: 'Attack',
  escape: 'Escape',
  bribe: 'Bribe',
  hack: 'Hack',
  chooseLeft: 'Choose Left',
  chooseRight: 'Choose Right',
  wait: 'Wait',
};

const AIFeedbackPanel = ({ isVisible, trainingMode, onTrainingModeChange, onApplyStrategy }) => {
  const [unreviewed, setUnreviewed] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [lastFeedbackCount, setLastFeedbackCount] = useState(0);
  const [recommendation, setRecommendation] = useState(null);
  const [ratedEntries, setRatedEntries] = useState(new Set());

  // Poll for new unreviewed actions
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const unreviewedList = aiControlService.getUnreviewedActions();
      setUnreviewed([...unreviewedList].reverse());
      setFeedbackStats(aiControlService.getFeedbackStats());
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleFeedback = useCallback((feedback, entry) => {
    if (entry) {
      aiControlService.rateAction(entry, feedback);
      setRatedEntries(prev => new Set([...prev, entry.timestamp]));
    } else {
      aiControlService.submitFeedback(feedback);
    }

    const completed = aiControlService.totalFeedbacksCompleted;

    if (completed > 0 && completed % 10 === 0 && completed !== lastFeedbackCount) {
      setLastFeedbackCount(completed);
      const rec = aiControlService.generateStrategyRecommendation();
      setRecommendation(rec);
    }
  }, [lastFeedbackCount]);

  const handleApply = useCallback(() => {
    if (recommendation && onApplyStrategy) {
      onApplyStrategy(recommendation.suggestedPrompt);
      setRecommendation(null);
    }
  }, [recommendation, onApplyStrategy]);

  const handleDismissRecommendation = useCallback(() => {
    setRecommendation(null);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="ai-feedback-panel">
      <div className="feedback-header">
        <h6>AI Action Feedback</h6>
        <Badge bg="secondary">{feedbackStats?.total || 0} actions</Badge>
      </div>

      {/* Training mode toggle */}
      <div className="training-toggle mb-2">
        <label className="d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={trainingMode}
            onChange={(e) => onTrainingModeChange(e.target.checked)}
          />
          <strong>Training Mode</strong>
          <span className="text-small" style={{ fontSize: '0.75rem' }}>
            {trainingMode ? '(pauses for feedback each step)' : '(continuous play)'}
          </span>
        </label>
      </div>

      {/* Stats bar */}
      {feedbackStats && (
        <div className="feedback-stats small mb-2">
          <span className="me-2 text-success">👍 {feedbackStats.positive} good</span>
          <span className="me-2 text-secondary">😐 {feedbackStats.neutral} neutral</span>
          <span className="me-2 text-danger">👎 {feedbackStats.negative} bad</span>
          <span>| {feedbackStats.unreviewed} pending</span>
        </div>
      )}

      {/* Strategy recommendation banner */}
      {recommendation && (
        <Alert variant="info" className="recommendation-banner p-2 mb-2" style={{ fontSize: '0.8rem' }}>
          <div className="fw-bold mb-1">AI Strategy Assessment (after {lastFeedbackCount} ratings)</div>
          <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', margin: 0, maxHeight: '80px', overflow: 'auto' }}>
            {recommendation.recommendation}
          </pre>
          <hr style={{ margin: '4px 0' }} />
          <div className="fw-bold mb-1">Suggested Strategy:</div>
          <div className="suggested-strategy" style={{
            background: '#f0f8ff', padding: '4px 8px', borderRadius: '4px',
            fontStyle: 'italic', marginBottom: '6px',
          }}>
            "{recommendation.suggestedPrompt}"
          </div>
          <div className="d-flex gap-2">
            <Button size="sm" variant="primary" onClick={handleApply}>
              Apply Strategy
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={handleDismissRecommendation}>
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {/* Stacked list of unreviewed actions */}
      <div className="unreviewed-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {unreviewed.length === 0 && (
          <div className="small p-2 text-center text-secondary">No actions pending review</div>
        )}
        {unreviewed.map((entry, idx) => {
          const actionType = entry.action?.action || '?';
          const actionLabel = ACTION_LABELS[actionType] || actionType;
          const itemName = entry.action?.params?.item || '';
          const reason = entry.action?.reason || '';
          const succeeded = entry.result?.success;
          const failed = entry.result && !entry.result.success;
          const errorMsg = entry.result?.error || '';

          return (
            <div key={entry.timestamp + '-' + idx} className="action-card mb-1 p-2 border rounded">
              {/* Top bar: action + result badge + time */}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-1">
                  <Badge bg="secondary" className="me-1">{actionLabel}</Badge>
                  {itemName && (
                    <strong style={{ fontSize: '0.8rem' }}>{itemName}</strong>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2">
                  {succeeded && (
                    <Badge bg="success" style={{ fontSize: '0.6rem' }}>OK</Badge>
                  )}
                  {failed && (
                    <Badge bg="danger" style={{ fontSize: '0.6rem' }}>FAILED</Badge>
                  )}
                  <small className="text-secondary" style={{ fontSize: '0.65rem' }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </small>
                </div>
              </div>

              {/* Reason — why the AI chose this action */}
              {reason && (
                <div className="text-secondary small mb-1" style={{ fontSize: '0.7rem', lineHeight: 1.3 }}>
                  <span className="fw-bold">Why:</span> {reason}
                </div>
              )}

              {/* Result details — what happened */}
              {entry.result && (
                <div className="small" style={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                  {succeeded && (
                    <span className="text-success">
                      Action completed{entry.result.item ? ` — ${entry.result.item}` : ''}
                      {entry.result.amount ? ` (${entry.result.amount})` : ''}
                      {entry.result.to ? ` → ${entry.result.to}` : ''}
                    </span>
                  )}
                  {failed && (
                    <span className="text-danger">
                      Failed: {errorMsg || 'Unknown error'}
                    </span>
                  )}
                </div>
              )}

              {/* Rating buttons */}
              <div className="d-flex gap-1 mt-1 pt-1 border-top">
                <Button
                  size="sm"
                  variant={ratedEntries.has(entry.timestamp) ? 'success' : 'outline-success'}
                  style={{ padding: '1px 8px', fontSize: '0.7rem' }}
                  onClick={() => handleFeedback('positive', entry)}
                  disabled={ratedEntries.has(entry.timestamp)}
                >
                  👍 Good
                </Button>
                <Button
                  size="sm"
                  variant={ratedEntries.has(entry.timestamp) ? 'secondary' : 'outline-secondary'}
                  style={{ padding: '1px 8px', fontSize: '0.7rem' }}
                  onClick={() => handleFeedback('neutral', entry)}
                  disabled={ratedEntries.has(entry.timestamp)}
                >
                  😐 Neutral
                </Button>
                <Button
                  size="sm"
                  variant={ratedEntries.has(entry.timestamp) ? 'danger' : 'outline-danger'}
                  style={{ padding: '1px 8px', fontSize: '0.7rem' }}
                  onClick={() => handleFeedback('negative', entry)}
                  disabled={ratedEntries.has(entry.timestamp)}
                >
                  👎 Bad
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIFeedbackPanel;