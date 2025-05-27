import React, { createContext, useContext, useState, useCallback } from 'react';
import randomEvents from '../data/random-events.json';
import { randomInt } from '../utils/helpers';

const GameEventContext = createContext();

export const useGameEvent = () => useContext(GameEventContext);

export const GameEventProvider = ({ children }) => {
  const [currentGameEvent, setCurrentGameEvent] = useState(null);

  const triggerRandomGameEvent = useCallback(() => {
    const events = randomEvents.events;
    const ev = events[randomInt(0, events.length - 1)];
    setCurrentGameEvent(ev);
    return ev;
  }, []);

  const triggerEnemyEncounter = useCallback(() => {
    const enemies = randomEvents.events.filter(e => e.dialog);
    if (!enemies.length) return null;
    const ev = enemies[randomInt(0, enemies.length - 1)];
    setCurrentGameEvent(ev);
    return ev;
  }, []);

  return (
    <GameEventContext.Provider value={{
      currentGameEvent,
      setCurrentGameEvent,
      triggerRandomGameEvent,
      triggerEnemyEncounter
    }}>
      {children}
    </GameEventContext.Provider>
  );
};
