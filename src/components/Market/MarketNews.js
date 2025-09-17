import React, { useState, useEffect, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import { formatDistanceToNow } from 'date-fns';
import miscNews from '../../data/misc-news.json';
import './MarketNews.scss';

// Simple deterministic random number generator
const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const MarketNews = () => {
    const { currentCycle, galaxyName } = useMarketplace();
    const { theme } = useAILevel();
    const [tickerItems, setTickerItems] = useState([]);
    const [tickerState, setTickerState] = useState('playing');
    const tickerTrackRef = useRef(null);
    const scrollProgress = useRef(0);
    const lastTimestamp = useRef(0);
    const direction = useRef(1); // 1 for forward, -1 for reverse
    const isPaused = useRef(false);

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

    // This component no longer handles breaking news; it only shows continuous misc news.

    // Generate initial ticker items from misc-news.json
    useEffect(() => {
        if (!galaxyName) return;

        const events = [];
        const now = Date.now();
        const newsItems = [...miscNews.news];

        // Add news items with random timestamps (up to 24 hours old)
        newsItems.forEach((item, i) => {
            const eventTime = now - Math.floor(seededRandom(now * i) * 86400000);
            const hoursAgo = Math.floor((now - eventTime) / 3600000);
            const minutesAgo = Math.floor(((now - eventTime) % 3600000) / 60000);

            events.push({
                id: `news_${item.newsEvent}_${i}`,
                type: 'news',
                title: item.name,
                description: item.description,
                icon: '📰',
                timestamp: eventTime,
                timeAgo: hoursAgo > 0 ? `${hoursAgo}h ${minutesAgo}m ago` : `${minutesAgo}m ago`,
                isBreaking: false,
                sentiment: 'neutral',
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
        <div className="event-predictor">
            {/* {breakingNews && (
                <>
                    <div className="ticker-label">BREAKING NEWS</div>
                    <div className="ticker-outer-container">
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
                                {breakingNews.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`ticker-item ${
                                            item.isBreaking ? 'breaking' : ''
                                        } ${item.sentiment || ''}`}
                                        onClick={() => handleNewsClick(item)}
                                        title={item.eventData ? 'Click for details' : ''}
                                    >
                                        <span className="event-icon">
                                            {item.sentiment === 'bullish'
                                                ? '📈'
                                                : item.sentiment === 'bearish'
                                                ? '📉'
                                                : item.icon}
                                        </span>
                                        <div className="event-details">
                                            <div
                                                className="event-title"
                                                style={{
                                                    color:
                                                        item.sentiment === 'bullish'
                                                            ? '#4caf50'
                                                            : item.sentiment === 'bearish'
                                                            ? '#f44336'
                                                            : 'inherit',
                                                }}
                                            >
                                                {item.title}
                                                {item.eventData?.effect?.priceMultiplierRange && (
                                                    <span
                                                        className="event-impact"
                                                        style={{
                                                            color:
                                                                item.eventData.effect
                                                                    .priceMultiplierRange[0] >= 1
                                                                    ? '#4caf50'
                                                                    : '#f44336',
                                                            marginLeft: '8px',
                                                            fontSize: '0.8em',
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        {
                                                            item.eventData.effect
                                                                .priceMultiplierRange[0]
                                                        }
                                                        x
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                className="event-description"
                                                title={item.description}
                                                style={{
                                                    color:
                                                        item.sentiment === 'bullish'
                                                            ? '#a5d6a7'
                                                            : item.sentiment === 'bearish'
                                                            ? '#ef9a9a'
                                                            : 'inherit',
                                                }}
                                            >
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
                </>
            )} */}

            <div className="ticker-label">MARKET NEWS</div>
            <div className="ticker-outer-container">
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
                                className="ticker-item"
                                onClick={() => handleNewsClick(item)}
                                title={item.eventData ? 'Click for details' : ''}
                            >
                                <span className="event-icon">📰</span>
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
        </div>
    );
};

export default MarketNews;
