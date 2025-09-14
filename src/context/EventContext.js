import React, { createContext, useState, useCallback, useMemo } from 'react';
import randomEventsData from '../data/random-events.json';
import galaxyEventsData from '../data/galaxy-events.json';
import { randomInt } from '../utils/helpers';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
    const [eventHistory, setEventHistory] = useState([]);
    const [activeEvent, setActiveEvent] = useState(null);
    const [eventQueue, setEventQueue] = useState([]);

    const galaxyEvents = useMemo(() => galaxyEventsData.galaxyEvents || [], []);
    const randomEvents = useMemo(() => randomEventsData.events || [], []);

    // Trigger a specific galaxy event by ID or a random one if no ID provided
    const triggerGalaxyEvent = useCallback(
        (eventId = null) => {
            let event;
            if (eventId) {
                event = galaxyEvents.find((e) => e.galaxyEventId === eventId);
            } else {
                event = galaxyEvents[randomInt(0, galaxyEvents.length - 1)];
            }

            if (event) {
                const newEvent = {
                    ...event,
                    id: `event_${Date.now()}`,
                    type: 'galaxy',
                    timestamp: Date.now(),
                };

                setEventHistory((prev) => [newEvent, ...prev].slice(0, 10));
                setActiveEvent(newEvent);
                return newEvent;
            }
            return null;
        },
        [galaxyEvents]
    );

    // Trigger a random event from the random events pool
    const triggerRandomMajorEvent = useCallback(() => {
        if (randomEvents.length === 0) return null;
        const event = randomEvents[randomInt(0, randomEvents.length - 1)];
        const newEvent = {
            ...event,
            id: `event_${Date.now()}`,
            type: 'random',
            timestamp: Date.now(),
        };

        setEventHistory((prev) => [newEvent, ...prev].slice(0, 10));
        setActiveEvent(newEvent);
        return newEvent;
    }, [randomEvents]);

    // Queue an event to be shown later
    const queueEvent = useCallback((event) => {
        setEventQueue((prev) => [
            ...prev,
            {
                ...event,
                id: `queued_${Date.now()}`,
                timestamp: Date.now(),
            },
        ]);
    }, []);

    // Process the next event in the queue
    const processNextEvent = useCallback(() => {
        if (eventQueue.length === 0) return null;

        const [nextEvent, ...remainingEvents] = eventQueue;
        setEventQueue(remainingEvents);
        setActiveEvent(nextEvent);
        return nextEvent;
    }, [eventQueue]);

    // Clear the current active event
    const clearEvent = useCallback(() => {
        setActiveEvent(null);
    }, []);

    // Get event by ID
    const getEventById = useCallback(
        (eventId) => {
            return eventHistory.find((event) => event.id === eventId) || null;
        },
        [eventHistory]
    );

    return (
        <EventContext.Provider
            value={{
                // Current active event
                currentEvent: activeEvent,
                // Event history
                eventHistory,
                // Event queue
                eventQueue,
                // Event management functions
                triggerGalaxyEvent,
                triggerRandomMajorEvent,
                queueEvent,
                processNextEvent,
                clearEvent,
                getEventById,
                // Alias for compatibility
                activeEvent,
                clearCurrentEvent: clearEvent,
                // Show a new event (alias for triggerRandomMajorEvent for consistency with AILevelContext)
                showEvent: triggerRandomMajorEvent,
            }}
        >
            {children}
        </EventContext.Provider>
    );
};

export const useEventContext = () => React.useContext(EventContext);

export default EventContext;
