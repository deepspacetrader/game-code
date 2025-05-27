import React, { useEffect, useCallback } from 'react';
import './Danger.scss';

const DANGER_TYPES = {
  INDIRECT_FIRE: {
    title: 'INCOMING FIRE!',
    message: 'Incoming indirect fire! Choose a side to dodge!',
    damageRange: [25, 50],
    successMessage: 'You dove out of the way just in time!',
    failureMessage: 'You were too slow! Took {damage} damage!'
  },
  EXPLOSION: {
    title: 'EXPLOSION!',
    message: 'A nearby explosion rocks the area! Choose a side to take cover!',
    damageRange: [30, 60],
    successMessage: 'You found cover just in time!',
    failureMessage: 'The blast caught you! Took {damage} damage!'
  },
  COLLAPSE: {
    title: 'COLLAPSE!',
    message: 'The structure is collapsing! Move to safety!',
    damageRange: [20, 40],
    successMessage: 'You barely made it to safety!',
    failureMessage: 'You were caught in the collapse! Took {damage} damage!'
  },
  AMBUSH: {
    title: 'AMBUSH!',
    message: 'You\'ve been ambushed! Quick, choose a direction!',
    damageRange: [15, 35],
    successMessage: 'You evaded the ambush!',
    failureMessage: 'The attackers got a hit in! Took {damage} damage!'
  }
};

const Danger = ({ 
  type = 'INDIRECT_FIRE', 
  onChoice, 
  onClose, 
  onDamage,
  autoCloseDelay = 2000 
}) => {
  const dangerType = DANGER_TYPES[type] || DANGER_TYPES.INDIRECT_FIRE;
  const [message, setMessage] = React.useState('');
  const [showChoices, setShowChoices] = React.useState(true);
  const [damageDealt, setDamageDealt] = React.useState(0);
  const [outcome, setOutcome] = React.useState(null);

  const handleChoice = useCallback((choice) => {
    if (!showChoices) return;
    
    setShowChoices(false);
    
    // 50% chance of success
    const success = Math.random() > 0.5;
    
    if (success) {
      setMessage(dangerType.successMessage);
      setOutcome('success');
    } else {
      const [min, max] = dangerType.damageRange;
      const damage = Math.floor(Math.random() * (max - min + 1)) + min;
      setDamageDealt(damage);
      setMessage(dangerType.failureMessage.replace('{damage}', damage));
      setOutcome('failure');
      
      // Trigger damage callback if provided
      if (onDamage) onDamage(damage);
    }
    
    // Auto-close after delay
    setTimeout(() => {
      if (onClose) onClose(outcome, damageDealt);
    }, autoCloseDelay);
  }, [dangerType, showChoices, onDamage, onClose, outcome, damageDealt, autoCloseDelay]);

  // Auto-choose if no choice is made in time
  useEffect(() => {
    if (!showChoices) return;
    
    const timer = setTimeout(() => {
      const choices = ['left', 'right'];
      const randomChoice = choices[Math.floor(Math.random() * choices.length)];
      handleChoice(randomChoice);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [showChoices, handleChoice]);

  return (
    <div className="danger-overlay" onClick={(e) => e.stopPropagation()}>
      <div className={`danger-content ${outcome || ''}`}>
        <div className="danger-title">{dangerType.title}</div>
        <div className="danger-message">
          {message || dangerType.message}
        </div>
        {showChoices ? (
          <div className="danger-choices">
            <button 
              className="danger-choice left"
              onClick={() => handleChoice('left')}
            >
              LEFT
            </button>
            <button 
              className="danger-choice right"
              onClick={() => handleChoice('right')}
            >
              RIGHT
            </button>
          </div>
        ) : (
          <div className="danger-outcome">
            <div className={`outcome-message ${outcome}`}>
              {message}
            </div>
            <button 
              className="danger-close" 
              onClick={() => onClose && onClose(outcome, damageDealt)}
            >
              CONTINUE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { Danger, DANGER_TYPES };