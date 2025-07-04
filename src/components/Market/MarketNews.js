import React, { useState, useEffect, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import { formatDistanceToNow } from 'date-fns';
import './MarketNews.scss';

// Known event types with their properties
const EVENT_TYPES = {
    PIRATE_RAID: {
        name: 'Pirate Raid',
        icon: '⚠️',
        duration: 3,
        rarity: 0.2,
        minCycleGap: 10,
        getDescription: (cycle) =>
            `Pirate activity detected! Increased demand for weapons and shields.`,
        getImpact: (cycle) => ({
            'Energy Weapons': { min: 15, max: 30 },
            'Shield Emitters': { min: 10, max: 25 },
            'Starship Parts': { min: 5, max: 15 },
        }),
    },
    TRADE_AGREEMENT: {
        name: 'Trade Agreement',
        icon: '🤝',
        duration: 5,
        rarity: 0.15,
        minCycleGap: 15,
        getDescription: (cycle) => `New trade agreement signed! Reduced prices on common goods.`,
        getImpact: (cycle) => ({
            'Food Rations': { min: -20, max: -10 },
            'Water Purifiers': { min: -15, max: -5 },
            'Medical Supplies': { min: -10, max: -5 },
        }),
    },
    MINING_STRIKE: {
        name: 'Mining Strike',
        icon: '⛏️',
        duration: 4,
        rarity: 0.1,
        minCycleGap: 20,
        getDescription: (cycle) => `Miners on strike! Reduced supply of raw materials.`,
        getImpact: (cycle) => ({
            Titanium: { min: 20, max: 40 },
            Platinum: { min: 15, max: 35 },
            'Quantum Crystals': { min: 25, max: 50 },
        }),
    },
    TECH_BOOM: {
        name: 'Tech Boom',
        icon: '🚀',
        duration: 6,
        rarity: 0.12,
        minCycleGap: 25,
        getDescription: (cycle) => `Tech sector booming! Increased demand for advanced components.`,
        getImpact: (cycle) => ({
            'Quantum Processors': { min: 20, max: 45 },
            'Neural Networks': { min: 15, max: 35 },
            'Holo-Projectors': { min: 10, max: 30 },
        }),
    },
    CIVIL_UNREST: {
        name: 'Civil Unrest',
        icon: '⚡',
        duration: 4,
        rarity: 0.18,
        minCycleGap: 18,
        getDescription: (cycle) =>
            `Civil unrest reported! Increased demand for security and medical supplies.`,
        getImpact: (cycle) => ({
            'Security Drones': { min: 15, max: 35 },
            'Medical Kits': { min: 20, max: 40 },
            'Emergency Rations': { min: 10, max: 25 },
        }),
    },
};

// Simple deterministic random number generator
const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const MarketNews = () => {
    const { currentGameEvent, currentCycle, galaxyName } = useMarketplace();
    const { theme } = useUI();
    const [tickerItems, setTickerItems] = useState([]);
    const [breakingNews, setBreakingNews] = useState(null);
    const [tickerState, setTickerState] = useState('playing');
    const tickerRef = useRef(null);
    const tickerTrackRef = useRef(null);
    const animationRef = useRef(null);
    const scrollProgress = useRef(0);
    const lastTimestamp = useRef(0);
    const direction = useRef(1); // 1 for forward, -1 for reverse
    const isPaused = useRef(false);
    const lastEventTime = useRef(Date.now());

    const handleMouseDown = (e) => {
        e.preventDefault();
        setTickerState('reversing');
    };

    const handleMouseUp = (e) => {
        e.preventDefault();
        setTickerState('paused');
    };

    const handleMouseEnter = (e) => {
        e.preventDefault();
        setTickerState('paused');
    };

    const handleMouseLeave = (e) => {
        e.preventDefault();
        setTickerState('playing');
    };

    // Handle animation frame updates
    useEffect(() => {
        const track = tickerTrackRef.current;
        if (!track) return;

        const duration = 60000; // 30 seconds for one full scroll
        let animationId;

        const animate = (timestamp) => {
            if (!lastTimestamp.current) lastTimestamp.current = timestamp;

            const deltaTime = timestamp - lastTimestamp.current;
            lastTimestamp.current = timestamp;

            if (!isPaused.current) {
                // Update progress based on direction and time
                scrollProgress.current += (direction.current * deltaTime) / duration;

                // Keep progress between 0 and 1
                scrollProgress.current = ((scrollProgress.current % 1) + 1) % 1;

                // Apply the transform
                const translateX = -50 * scrollProgress.current;
                track.style.transform = `translateX(${translateX}%)`;
            }

            animationId = requestAnimationFrame(animate);
        };

        // Start the animation
        animationId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, []);

    // Handle state changes
    useEffect(() => {
        switch (tickerState) {
            case 'playing':
                isPaused.current = false;
                direction.current = 1;
                break;
            case 'paused':
                isPaused.current = true;
                break;
            case 'reversing':
                isPaused.current = false;
                direction.current = -1;
                break;
            default:
                break;
        }
    }, [tickerState]);

    // Handle new game events
    useEffect(() => {
        if (!currentGameEvent) return;

        const now = Date.now();
        const timeSinceLastEvent = now - lastEventTime.current;

        // Only process if it's been at least 10 seconds since last event
        if (timeSinceLastEvent < 10000) return;

        lastEventTime.current = now;

        const eventType = EVENT_TYPES[currentGameEvent.type] || {
            name: currentGameEvent.name || 'Unknown Event',
            icon: 'ℹ️',
            getDescription: () =>
                currentGameEvent.description || 'An event is occurring in your sector.',
        };

        // Create breaking news item
        const newBreakingNews = {
            id: `breaking_${now}`,
            type: currentGameEvent.type,
            title: `BREAKING: ${eventType.name}`,
            description:
                typeof eventType.getDescription === 'function'
                    ? eventType.getDescription(currentCycle)
                    : eventType.description,
            icon: eventType.icon || 'ℹ️',
            timestamp: now,
            timeAgo: 'Just now',
            isBreaking: true,
        };

        // Set as breaking news and add to the beginning of the ticker
        setBreakingNews(newBreakingNews);
        setTickerItems((prev) => {
            // Remove any existing breaking news
            const filtered = prev.filter((item) => !item.isBreaking);
            // Add new breaking news at the beginning
            return [newBreakingNews, ...filtered];
        });

        // Clear breaking news after 10 seconds but keep the item in the ticker
        const timer = setTimeout(() => {
            setBreakingNews(null);
            // Update the item to be non-breaking in the ticker
            setTickerItems((prev) =>
                prev.map((item) =>
                    item.id === newBreakingNews.id ? { ...item, isBreaking: false } : item
                )
            );
        }, 10000);

        return () => clearTimeout(timer);
    }, [currentGameEvent, currentCycle]);

    // Generate initial ticker items immediately
    useEffect(() => {
        if (!galaxyName) return;

        const events = [];
        const now = Date.now();

        // Add a loading message that will be replaced immediately
        setTickerItems([
            {
                id: 'loading',
                title: 'Loading Market Data',
                description: 'Establishing secure connection...',
                icon: '⏳',
                timestamp: now,
                timeAgo: 'Just now',
                isBreaking: false,
            },
        ]);

        // Generate 10-15 random events for the ticker to ensure continuous scrolling
        const eventCount = 10 + Math.floor(seededRandom(now) * 6);
        const eventTypes = Object.entries(EVENT_TYPES);

        // Add some recent events (last 5 minutes)
        for (let i = 0; i < 5; i++) {
            const cycleOffset = 1 + Math.floor(seededRandom(now + i) * 10);
            const eventIndex = Math.floor(seededRandom(now + i + 1) * eventTypes.length);
            const [eventId, eventData] = eventTypes[eventIndex];
            const eventTime = now - Math.floor(seededRandom(now + i + 2) * 300000); // Up to 5 minutes old
            const minutesAgo = Math.floor((now - eventTime) / 60000);

            events.push({
                id: `recent_${eventId}_${i}`,
                type: eventId,
                title: eventData.name,
                description:
                    typeof eventData.getDescription === 'function'
                        ? eventData.getDescription(currentCycle + cycleOffset)
                        : 'Market activity detected',
                icon: eventData.icon || 'ℹ️',
                timestamp: eventTime,
                timeAgo: minutesAgo <= 1 ? 'Just now' : `${minutesAgo}m ago`,
                isBreaking: false,
            });
        }

        // Add some older events (5 minutes to 2 hours old)
        for (let i = 0; i < eventCount - 5; i++) {
            const cycleOffset = 1 + Math.floor(seededRandom(now + i + 1000) * 20);
            const eventIndex = Math.floor(seededRandom(now + i + 1001) * eventTypes.length);
            const [eventId, eventData] = eventTypes[eventIndex];
            const eventTime = now - 300000 - Math.floor(seededRandom(now + i + 1002) * 6600000); // 5 mins to 2 hours old
            const hoursAgo = Math.floor((now - eventTime) / 3600000);
            const minutesAgo = Math.floor(((now - eventTime) % 3600000) / 60000);

            events.push({
                id: `ticker_${eventId}_${i}`,
                type: eventId,
                title: eventData.name,
                description:
                    typeof eventData.getDescription === 'function'
                        ? eventData.getDescription(currentCycle + cycleOffset)
                        : 'Market activity detected',
                icon: eventData.icon || 'ℹ️',
                timestamp: eventTime,
                timeAgo: hoursAgo > 0 ? `${hoursAgo}h ${minutesAgo}m ago` : `${minutesAgo}m ago`,
                isBreaking: false,
            });
        }

        // Add some generic market updates
        const marketUpdates = [
            'Market indices showing increased volatility',
            'Trading volume up in the outer rim sectors',
            'New trade routes established in nearby systems',
            'Commodity prices stabilizing after recent fluctuations',
            'Increased pirate activity affecting shipping lanes',
            'New mining operations coming online in the asteroid belt',
        ];

        marketUpdates.forEach((update, i) => {
            const updateTime = now - Math.floor(seededRandom(now * (i + 1)) * 7200000); // Up to 2 hours old
            const hoursAgo = Math.floor((now - updateTime) / 3600000);

            events.push({
                id: `update_${i}`,
                type: 'market_update',
                title: 'Market Update',
                description: update,
                icon: '📊',
                timestamp: updateTime,
                timeAgo: hoursAgo > 0 ? `${hoursAgo}h ago` : 'Just now',
                isBreaking: false,
            });
        });

        // Sort by timestamp (newest first)
        const sortedEvents = events.sort((a, b) => b.timestamp - a.timestamp);

        // Ensure we have enough items for smooth scrolling
        if (sortedEvents.length < 10) {
            // Duplicate items if we don't have enough
            const additionalItems = [...sortedEvents];
            while (additionalItems.length < 10) {
                additionalItems.push(...sortedEvents);
            }
            setTickerItems(additionalItems);
        } else {
            setTickerItems(sortedEvents);
        }
    }, [currentCycle, galaxyName]);

    // Format time ago string
    const formatTimeAgo = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch (e) {
            return '';
        }
    };

    const handleNewsClick = (item) => {
        // Handle news item click if needed
        console.log('News item clicked:', item);
    };

    return (
        <div className={`event-predictor ${theme}`} ref={tickerRef}>
            <div className="ticker-label">{breakingNews ? 'BREAKING' : 'MARKET NEWS'}</div>
            <div className="ticker-container">
                <div
                    className={`ticker-track ${tickerState}`}
                    ref={tickerTrackRef}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: 'pointer' }}
                >
                    {tickerItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={`ticker-item ${item.isBreaking ? 'breaking' : ''}`}
                            onClick={() => handleNewsClick(item)}
                        >
                            <span className="event-icon">{item.icon}</span>
                            <div className="event-details">
                                <div className="event-title">{item.title}</div>
                                <div className="event-description" title={item.description}>
                                    {item.description}
                                </div>
                            </div>
                            <div
                                className="event-time"
                                title={new Date(item.timestamp).toLocaleString()}
                            >
                                {item.timeAgo || formatTimeAgo(item.timestamp)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MarketNews;
