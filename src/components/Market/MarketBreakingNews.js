import React, { useEffect, useRef, useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatDistanceToNow } from 'date-fns';
import '../Market/MarketNews.scss';

const MarketBreakingNews = () => {
    const { currentGameEvent, currentCycle } = useMarketplace();

    const [items, setItems] = useState([]);
    const [tickerState, setTickerState] = useState('playing');
    const tickerTrackRef = useRef(null);
    const scrollProgress = useRef(0);
    const lastTimestamp = useRef(0);
    const direction = useRef(1);
    const isPaused = useRef(false);

    // Animate scrolling
    useEffect(() => {
        const track = tickerTrackRef.current;
        if (!track) return;

        const duration = 45000; // 45s per loop for breaking ticker
        let animationId;

        const animate = (timestamp) => {
            if (!lastTimestamp.current) lastTimestamp.current = timestamp;
            const deltaTime = timestamp - lastTimestamp.current;
            lastTimestamp.current = timestamp;

            if (!isPaused.current) {
                scrollProgress.current += (direction.current * deltaTime) / duration;
                scrollProgress.current = ((scrollProgress.current % 1) + 1) % 1;
                const translateX = -50 * scrollProgress.current;
                track.style.transform = `translateX(${translateX}%)`;
            }
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, []);

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

    // When a new breaking game event happens, push an item and auto-expire it
    useEffect(() => {
        if (!currentGameEvent) return;

        const now = Date.now();
        const isRandomEvent =
            currentGameEvent.effect &&
            (currentGameEvent.effect.priceMultiplierRange ||
                currentGameEvent.effect.stockMultiplierRange);

        let eventSentiment = 'neutral';
        let priceImpact = '';
        if (isRandomEvent && currentGameEvent.effect?.priceMultiplierRange) {
            const priceMultiplier = currentGameEvent.effect.priceMultiplierRange[0];
            eventSentiment = priceMultiplier >= 1 ? 'bullish' : 'bearish';
            const percentChange = Math.abs(Math.round((priceMultiplier - 1) * 100));
            priceImpact = ` (${percentChange}% ${priceMultiplier >= 1 ? '↑' : '↓'})`;
        }

        const newItem = {
            id: `breaking_${now}`,
            type: currentGameEvent.type || 'event',
            title: `${currentGameEvent.name || 'Market Event'}${priceImpact}`,
            description:
                currentGameEvent.description || 'Breaking news just in from our correspondents...',
            icon: '🚨',
            timestamp: now,
            timeAgo: 'Just now',
            isBreaking: true,
            sentiment: currentGameEvent.bearish
                ? 'bearish'
                : currentGameEvent.bullish
                ? 'bullish'
                : eventSentiment,
            eventData: currentGameEvent,
        };

        setItems((prev) => {
            // Keep a small list to loop smoothly
            const next = [newItem, ...prev].slice(0, 8);
            // Duplicate if too few to make loop smooth
            if (next.length < 4) return [...next, ...next];
            return next;
        });

        // Auto demote item from breaking after 15s, but keep it in ticker briefly
        const demoteTimer = setTimeout(() => {
            setItems((prev) =>
                prev.map((it) =>
                    it.id === newItem.id
                        ? {
                              ...it,
                              isBreaking: false,
                              icon:
                                  newItem.sentiment === 'bullish'
                                      ? '📈'
                                      : newItem.sentiment === 'bearish'
                                      ? '📉'
                                      : 'ℹ️',
                          }
                        : it
                )
            );
        }, 15000);

        // Remove item entirely after 35s
        const removeTimer = setTimeout(() => {
            setItems((prev) => prev.filter((it) => it.id !== newItem.id));
        }, 35000);

        return () => {
            clearTimeout(demoteTimer);
            clearTimeout(removeTimer);
        };
    }, [currentGameEvent, currentCycle]);

    const formatTimeAgo = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch (e) {
            return '';
        }
    };

    if (!items || items.length === 0) return null;

    const latest = items[0];
    const labelStyle = latest?.sentiment === 'bullish'
        ? { background: 'linear-gradient(90deg, rgba(0,60,0,0.9), rgba(0,140,0,0.7))', color: '#d7ffd7' }
        : latest?.sentiment === 'bearish'
        ? { background: 'linear-gradient(90deg, rgba(80,0,0,0.9), rgba(160,0,0,0.7))', color: '#ffd0d0' }
        : { background: 'linear-gradient(90deg, rgba(0,50,100,0.9), rgba(0,80,160,0.7))', color: '#a0e0ff' };

    return (
        <div className="event-predictor" style={{ marginTop: '8px' }}>
            <div className="ticker-label" style={labelStyle}>
                BREAKING NEWS
            </div>
            <div className="ticker-outer-container">
                <div className="ticker-container">
                    <div
                        className={`ticker-track ${tickerState}`}
                        ref={tickerTrackRef}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setTickerState('reversing');
                        }}
                        onMouseUp={(e) => {
                            e.preventDefault();
                            setTickerState('paused');
                        }}
                        onMouseEnter={(e) => {
                            e.preventDefault();
                            setTickerState('paused');
                        }}
                        onMouseLeave={(e) => {
                            e.preventDefault();
                            setTickerState('playing');
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={`ticker-item ${item.isBreaking ? 'breaking' : ''} ${
                                    item.sentiment || ''
                                }`}
                                title={item.eventData ? 'Click for details' : ''}
                            >
                                <span className="event-icon">
                                    {item.icon}
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
                                    </div>
                                    <div className="event-description" title={item.description}>
                                        {item.description}
                                    </div>
                                </div>
                                <div className="event-time" title={new Date(item.timestamp).toLocaleString()}>
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

export default MarketBreakingNews;

