import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import randomEventsData from '../data/random-events.json';
import galaxyEventsData from '../data/galaxy-events.json';
import { randomInt } from '../utils/helpers';

const EventContext = createContext();

export const useEvents = () => useContext(EventContext);

export const EventProvider = ({ children }) => {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventHistory, setEventHistory] = useState([]);

  const galaxyEvents = useMemo(() => galaxyEventsData.galaxyEvents || [], []);
  const randomEvents = useMemo(() => randomEventsData.events || [], []);

  const triggerGalaxyEvent = useCallback((eventId = null) => {
    let event;
    if (eventId) {
      event = galaxyEvents.find(e => e.galaxyEventId === eventId);
    } else {
      event = galaxyEvents[randomInt(0, galaxyEvents.length - 1)];
    }
    
    if (event) {
      setCurrentEvent({ ...event, type: 'galaxy' });
      setEventHistory(prev => [event, ...prev].slice(0, 10)); // Keep last 10 events
      return event;
    }
    return null;
  }, [galaxyEvents]);

  const triggerRandomEvent = useCallback(() => {
    if (randomEvents.length === 0) return null;
    const event = randomEvents[randomInt(0, randomEvents.length - 1)];
    setCurrentEvent({ ...event, type: 'random' });
    setEventHistory(prev => [event, ...prev].slice(0, 10));
    return event;
  }, [randomEvents]);

  const clearCurrentEvent = useCallback(() => {
    setCurrentEvent(null);
  }, []);

  return (
    <EventContext.Provider value={{
      currentEvent,
      eventHistory,
      triggerGalaxyEvent,
      triggerRandomEvent,
      clearCurrentEvent
    }}>
      {children}
    </EventContext.Provider>
  );
};
