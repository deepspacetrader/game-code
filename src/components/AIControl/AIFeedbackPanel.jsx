/**
 * AI Feedback Panel - Human Feedback UI Component
 * Allows users to provide positive/neutral/negative feedback on AI actions
 */

import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { aiControlService } from '../../services/AIControlService';
import './AIFeedbackPanel.scss';

const AIFeedbackPanel = ({ isVisible }) => {
  const [lastAction, setLastAction] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [hasPendingFeedback, setHasPendingFeedback] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Poll for new actions needing feedback
    const interval = setInterval(() => {
      const stats = aiControlService.getFeedbackStats();
      setFeedbackStats(stats);
      setHasPendingFeedback(stats.unreviewed > 0);

      // Get last action for display
      const history = aiControlService.feedbackHistory;
      if (history.length > 0) {
        const last = history[history.length - 1];
        if (!last.feedback) {
          setLastAction(last);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleFeedback = (feedback) => {
    aiControlService.submitFeedback(feedback);
    setLastAction(null);
    setHasPendingFeedback(false);
  };

  if (!isVisible || !hasPendingFeedback || !lastAction) {
    return null;
  }

  return (
    <div className="ai-feedback-panel">
      <div className="feedback-card">
        <div className="feedback-header">
          <h6>AI Action Feedback</h6>
          <span className="action-type">{lastAction.action?.type || 'Unknown'}</span>
        </div>
        
        <div className="feedback-details">
          <p><strong>Action:</strong> {JSON.stringify(lastAction.action)}</p>
          <p><strong>Result:</strong> {lastAction.result?.success ? 'Success' : 'Failed'}</p>
          {lastAction.result?.error && (
            <p className="error-text"><strong>Error:</strong> {lastAction.result.error}</p>
          )}
        </div>

        <div className="feedback-buttons">
          <Button
            variant="success"
            size="sm"
            onClick={() => handleFeedback('positive')}
            className="feedback-btn"
          >
            👍 Good
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleFeedback('neutral')}
            className="feedback-btn"
          >
            😐 Neutral
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleFeedback('negative')}
            className="feedback-btn"
          >
            👎 Bad
          </Button>
        </div>
      </div>

      {feedbackStats && (
        <div className="feedback-stats">
          <small>
            Total: {feedbackStats.total} | 
            👍 {feedbackStats.positive} | 
            😐 {feedbackStats.neutral} | 
            👎 {feedbackStats.negative}
          </small>
        </div>
      )}
    </div>
  );
};

export default AIFeedbackPanel;
