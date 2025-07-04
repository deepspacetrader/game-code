import { useState, useEffect, useCallback } from 'react';
import { randomInt } from '../utils/helpers';
import randomEvents from '../data/random-events.json';

const EVENT_CHECK_INTERVAL = 5000; // Check for events every 5 seconds
const BASE_EVENT_CHANCE = 0.2; // 20% chance for an event to trigger on each check
const MIN_EVENT_COOLDOWN = 30000; // Minimum 30 seconds between events

const useEventSystem = (triggerEvent) => {
    const [lastEventTime, setLastEventTime] = useState(0);
    const [activeEvents, setActiveEvents] = useState([]);

    // Process a single event's effects
    const processEventEffects = useCallback((event) => {
        if (!event?.effect) return null;

        const { affectedItems, priceMultiplierRange, stockMultiplierRange } = event.effect;
        if (!affectedItems || !priceMultiplierRange || !stockMultiplierRange) return null;

        // Calculate multipliers with some randomness
        const priceMultiplier = 
            randomFloat(priceMultiplierRange[0], priceMultiplierRange[1]);
        const stockMultiplier = 
            randomFloat(stockMultiplierRange[0], stockMultiplierRange[1]);

        // Return the effect data to be applied to the market
        return {
            affectedItems,
            priceMultiplier,
            stockMultiplier,
            eventName: event.name,
            eventDescription: event.description
        };
    }, []);

    // Check if we should trigger a new event
    const checkForEvent = useCallback(() => {
        const now = Date.now();
        
        // Don't trigger if we're in cooldown
        if (now - lastEventTime < MIN_EVENT_COOLDOWN) return;
        
        // Random chance to trigger an event
        if (Math.random() > BASE_EVENT_CHANCE) return;

        // Select a random event
        const eligibleEvents = randomEvents.events.filter(e => 
            !activeEvents.some(ae => ae.randomEventId === e.randomEventId)
        );
        
        if (eligibleEvents.length === 0) return;
        
        const randomEvent = eligibleEvents[randomInt(0, eligibleEvents.length - 1)];
        const effects = processEventEffects(randomEvent);
        
        if (effects) {
            setLastEventTime(now);
            setActiveEvents(prev => [...prev, {
                ...randomEvent,
                startTime: now,
                endTime: now + 30000, // Events last 30 seconds by default
                isActive: true
            }]);
            
            // Trigger the event through the provided callback
            triggerEvent(effects);
            
            // Log for debugging
            console.log(`Event triggered: ${randomEvent.name}`, effects);
        }
    }, [lastEventTime, activeEvents, triggerEvent, processEventEffects]);

    // Clean up expired events
    const cleanupEvents = useCallback(() => {
        const now = Date.now();
        setActiveEvents(prev => 
            prev.filter(event => event.endTime > now)
        );
    }, []);

    // Set up the event loop
    useEffect(() => {
        const interval = setInterval(() => {
            cleanupEvents();
            checkForEvent();
        }, EVENT_CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [checkForEvent, cleanupEvents]);

    return { activeEvents };
};

// Helper function to get a random float between min and max
const randomFloat = (min, max) => {
    return Math.random() * (max - min) + min;
};

export default useEventSystem;
