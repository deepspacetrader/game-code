import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { randomFloatRange } from '../utils/helpers';
import itemsData from '../data/items.json';
import randomEvents from '../data/random-events.json';
import './Event.scss';

const Event = () => {
    const {
        currentGameEvent,
        currentEvent, // Some contexts might use this instead of currentGameEvent
        triggerRandomEvent,
        triggerRandomMarketEvent,
        setCurrentGameEvent,
    } = useMarketplace();

    // Use either currentGameEvent or currentEvent, whichever is available
    const activeEvent = currentGameEvent || currentEvent;
    const [showEvent, setShowEvent] = useState(false);

    // Debug logging
    // console.log('[Event] Current state:', { currentGameEvent, showEvent });

    useEffect(() => {
        console.log('[Event] Component mounted or updated');
        return () => console.log('[Event] Component unmounting');
    }, []);

    useEffect(() => {
        console.log('[Event] Event state changed:', {
            currentGameEvent,
            currentEvent,
            activeEvent,
        });

        if (activeEvent) {
            console.log('[Event] Showing event:', activeEvent.name || 'Unnamed Event');
            setShowEvent(true);

            // Auto-hide after 10 seconds
            const timer = setTimeout(() => {
                console.log('[Event] Auto-hiding event');
                setShowEvent(false);
            }, 10000);

            return () => {
                console.log('[Event] Cleaning up event timer');
                clearTimeout(timer);
            };
        } else {
            console.log('[Event] No active event, hiding');
            setShowEvent(false);
        }
    }, [activeEvent, currentGameEvent, currentEvent]);

    // Debug function to trigger a test event
    const triggerTestEvent = async () => {
        console.log('[Event] Manually triggering test event');

        // Create a test event with all required properties
        const testEvent = {
            ...randomEvents.events[0],
            name: 'TEST EVENT',
            description: 'This is a test event to verify the event system is working.',
            effect: {
                affectedItems: [1, 2, 3],
                priceMultiplierRange: [0.5, 2.0],
                stockMultiplierRange: [0.8, 1.2]
            }
        };

        console.log('[Event] Test event created:', testEvent);

        // Try to use the context's trigger function if available
        try {
            if (typeof triggerRandomEvent === 'function') {
                console.log('[Event] Using triggerRandomEvent');
                triggerRandomEvent();
            } else if (typeof triggerRandomMarketEvent === 'function') {
                console.log('[Event] Using triggerRandomMarketEvent');
                await triggerRandomMarketEvent();
            } else if (typeof setCurrentGameEvent === 'function') {
                console.log('[Event] Using setCurrentGameEvent');
                setCurrentGameEvent(testEvent);
            } else {
                console.error('[Event] No event trigger function available');
                // Fallback to local state for testing
                console.log('[Event] Using local state for testing');
                setLocalEvent(testEvent);
                setShowEvent(true);
                return;
            }

            // If we get here, the event was triggered through the context
            console.log('[Event] Event triggered through context');

            // Force show the event UI after a short delay to allow context to update
            setTimeout(() => {
                console.log('[Event] Forcing show after delay');
                setShowEvent(true);
                // Add a debug class to the document body to help with styling
                document.body.classList.add('event-debug-mode');
            }, 100);

        } catch (error) {
            console.error('[Event] Error triggering event:', error);
        }
    };

    // Local state for testing when context isn't available
    const [localEvent, setLocalEvent] = useState({
        name: 'TEST EVENT',
        description: 'This is a test event to verify the event system is working.',
        effect: {
            affectedItems: [1, 2, 3],
            priceMultiplierRange: [0.5, 2.0],
            stockMultiplierRange: [0.8, 1.2]
        }
    });

    // Use local event if context event isn't available
    const displayEvent = activeEvent || localEvent;

    if (!showEvent || !displayEvent) {
        // console.log('[Event] Not rendering event UI. State:', {
        //     showEvent,
        //     hasActiveEvent: !!activeEvent,
        //     hasCurrentGameEvent: !!currentGameEvent,
        //     hasCurrentEvent: !!currentEvent
        // });

        return (
            <div
                className="debug-event-trigger"
                style={{
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '10px',
                    borderRadius: '5px',
                    zIndex: 1000,
                }}
            >
                <div>Event System Status: {displayEvent ? 'ACTIVE' : 'INACTIVE'}</div>
                <div>Current Event: {displayEvent ? (displayEvent.name || 'Unnamed') : 'None'}</div>
                <div>Source: {localEvent ? 'Local' : 'Context'}</div>
                <button
                    onClick={triggerTestEvent}
                    className="btn btn-sm btn-warning"
                    style={{ marginTop: '5px' }}
                >
                    Trigger Test Event
                </button>
            </div>
        );
    }

    console.log('[Event] Rendering event UI with:', displayEvent, 'Show:', showEvent);

    // Get the event to display
    const eventToDisplay = displayEvent || {};

    // Add debug styling directly to ensure visibility
    const debugStyle = {
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid #00ff00',
        borderRadius: '8px',
        padding: '20px',
        color: '#fff',
        maxWidth: '400px',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
    };

    const formatMultiplier = (multiplier) => {
        if (multiplier >= 1) {
            return `+${(multiplier - 1) * 100}%`;
        }
        return `-${(1 - multiplier) * 100}%`;
    };

    return (
        <div 
            className={`event-container ${showEvent ? 'active' : ''}`}
            style={showEvent ? debugStyle : { display: 'none' }}
        >
            <button 
                className="close-button" 
                onClick={() => setShowEvent(false)}
                style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: 'red',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
            >
                ×
            </button>
            <div className="event-header">{eventToDisplay.name || 'Unknown Event'}</div>
            <div className="event-description">{eventToDisplay.description || 'No description available'}</div>
            <div className="event-effects">
                {eventToDisplay.effect?.affectedItems?.map((itemId) => {
                    const item = itemsData.items.find((i) => i.itemId === itemId);
                    if (!item) return null;
                    return (
                        <div key={itemId} className="effect-item">
                            <div className="item-name">{item.name}</div>
                            <div className="effect-values">
                                <span className="price-change">
                                    Price:{' '}
                                    {formatMultiplier(
                                        randomFloatRange(
                                            eventToDisplay.effect?.priceMultiplierRange?.[0] || 0.5,
                                            eventToDisplay.effect?.priceMultiplierRange?.[1] || 2.0
                                        )
                                    )}
                                </span>
                                <span className="stock-change">
                                    Stock:{' '}
                                    {formatMultiplier(
                                        randomFloatRange(
                                            eventToDisplay.effect?.stockMultiplierRange?.[0] || 0.8,
                                            eventToDisplay.effect?.stockMultiplierRange?.[1] || 1.2
                                        )
                                    )}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Event;
