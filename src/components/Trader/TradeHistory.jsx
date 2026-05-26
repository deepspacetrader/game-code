import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import './TradeHistory.scss';

const TradeHistory = () => {
    const { tradeHistory } = useMarketplace();
    const { improvedAILevel } = useAILevel();
    const historyArr = useMemo(() => {
        if (!Array.isArray(tradeHistory)) return [];

        // Group consecutive sell transactions with the same name and price
        const grouped = [];
        let currentGroup = null;

        for (let i = 0; i < tradeHistory.length; i++) {
            const t = tradeHistory[i];

            if (
                t.type === 'sell' &&
                currentGroup &&
                t.name === currentGroup.name &&
                t.price === currentGroup.price
            ) {
                currentGroup.quantity += t.quantity;
                currentGroup.profit += t.profit;
            } else {
                if (currentGroup) {
                    grouped.push(currentGroup);
                }
                currentGroup = { ...t };
            }
        }

        if (currentGroup) {
            grouped.push(currentGroup);
        }

        return grouped;
    }, [tradeHistory]);
    const cumData = useMemo(() => {
        let sum = 0;
        return historyArr.map((t) => (sum += t.profit));
    }, [historyArr]);
    const scrollRef = useRef(null);
    const [isScrolling, setIsScrolling] = useState(false);

    // Track scroll position and mouse interaction
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const handleScroll = () => {
            setIsScrolling(true);
        };

        const handleMouseLeave = () => {
            // Reset to auto-scroll after a short delay if mouse leaves
            setTimeout(() => {
                if (!isScrolling) return;
                setIsScrolling(false);
                if (container) {
                    if (improvedAILevel < 100) {
                        container.scrollLeft = container.scrollWidth;
                    } else {
                        container.scrollTop = container.scrollHeight;
                    }
                }
            }, 1000);
        };

        container.addEventListener('scroll', handleScroll);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [scrollRef, isScrolling, improvedAILevel]);

    // Auto-scroll when new items are added, unless manually scrolling
    useEffect(() => {
        if (improvedAILevel >= 50 && scrollRef.current && !isScrolling) {
            if (improvedAILevel < 100) {
                // For history-scroll (level 50-100)
                scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
            } else {
                // For history-detail (level 100+)
                if (improvedAILevel >= 500) {
                    // Smooth scroll for level 500+
                    scrollRef.current.scrollTo({
                        top: scrollRef.current.scrollHeight,
                        behavior: 'smooth',
                    });
                } else {
                    // Instant scroll for levels 100-499
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }
        }
    }, [historyArr, improvedAILevel, isScrolling]);

    // Smooth scroll animation for level 500+
    useEffect(() => {
        if (improvedAILevel < 500) return;

        const container = scrollRef.current;
        if (!container) return;

        const handleMouseLeave = () => {
            // Reset to auto-scroll after a short delay if mouse leaves
            setTimeout(() => {
                if (!isScrolling) return;
                setIsScrolling(false);
                if (container) {
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'smooth',
                    });
                }
            }, 1000);
        };

        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [scrollRef, isScrolling, improvedAILevel]);

    if (improvedAILevel < 25) return null;

    return (
        <div className="trade-history">
            {improvedAILevel < 50 && (
                <ul className="history-list">
                    {historyArr.map((t, i) => (
                        <li key={i}>
                            {t.type === 'buy' ? 'Bought' : 'Sold'} {t.quantity}×{t.name} for{' '}
                            {t.quantity * t.price}{' '}
                            <span
                                className={`trade-profit ${
                                    t.profit >= 0 ? 'positive' : 'negative'
                                }`}
                            >
                                ({t.profit >= 0 ? '+' : ''}
                                {t.profit})
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            {improvedAILevel >= 50 && improvedAILevel < 100 && (
                <div className="history-scroll" ref={scrollRef}>
                    {historyArr.map((t, i) => (
                        <span key={i} className="history-item">
                            [{t.type === 'buy' ? 'B' : 'S'} {t.quantity}×{t.name}{' '}
                            <span
                                className={`trade-profit ${
                                    t.profit >= 0 ? 'positive' : 'negative'
                                }`}
                            >
                                {t.profit >= 0 ? '+' : ''}
                                {t.profit}
                            </span>
                            ]
                        </span>
                    ))}
                </div>
            )}
            {improvedAILevel >= 100 && (
                <>
                    <div className="history-chart">
                        <Sparklines data={cumData}>
                            <SparklinesLine color="teal" />
                        </Sparklines>
                    </div>
                    <div className="history-detail" ref={scrollRef}>
                        {historyArr.map((t, i) => (
                            <div key={i} className="history-item-detailed">
                                {new Date(t.time).toLocaleTimeString()}{' '}
                                {t.type === 'buy' ? 'Bought' : 'Sold'} {t.quantity}×{t.name} for{' '}
                                {t.quantity * t.price}{' '}
                                <span
                                    className={`trade-profit ${
                                        t.profit >= 0 ? 'positive' : 'negative'
                                    }`}
                                >
                                    ({t.profit >= 0 ? '+' : ''}
                                    {t.profit})
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default TradeHistory;
