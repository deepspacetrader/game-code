import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useEventContext } from '../../context/EventContext';
import { useAILevel } from '../../context/AILevelContext';
import { randomFloatRange } from '../../utils/helpers';
import itemsData from '../../data/items.json';
import './Event.scss';

const itemImages = require.context('../../images', false, /^\.\/item\d+\.webp$/);

// Simple inline sparkline component
const Sparkline = ({ data, width = 50, height = 20, color = '#00ff00' }) => {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data
        .map((value, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg
            width={width}
            height={height}
            style={{ display: 'inline-block', verticalAlign: 'middle' }}
        >
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
    );
};

// Simple encryption/obfuscation for low AI levels
const obfuscateText = (text, level) => {
    if (level >= 25) return text;

    // Simple character substitution for demonstration
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    return text
        .split('')
        .map((char, i) => {
            if (Math.random() > 0.3) return char;
            return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');
};

const Event = () => {
    const { triggerRandomMarketEvent, marketData, priceHistory = {} } = useMarketplace();
    const { activeEvent, clearCurrentEvent } = useEventContext();

    const { improvedAILevel } = useAILevel();

    const [showEvent, setShowEvent] = useState(false);
    const [displayEvent, setDisplayEvent] = useState(null);
    const [localPriceHistory, setLocalPriceHistory] = useState({});
    const [trendData, setTrendData] = useState({});

    // Update price history and trends when market data changes
    useEffect(() => {
        if (!displayEvent?.effect?.affectedItems?.length) return;

        const newPriceHistory = { ...localPriceHistory };
        const timestamp = Date.now();
        let hasUpdates = false;

        // Update price history for affected items
        displayEvent.effect.affectedItems.forEach((itemId) => {
            const itemData = marketData?.find((item) => item.id === itemId);
            if (!itemData) return;

            if (!newPriceHistory[itemId]) {
                newPriceHistory[itemId] = [];
            }

            newPriceHistory[itemId].push({
                timestamp,
                price: itemData.price,
            });

            // Keep only the last 100 data points
            if (newPriceHistory[itemId].length > 100) {
                newPriceHistory[itemId].shift();
            }

            hasUpdates = true;
        });

        if (!hasUpdates) return;

        setLocalPriceHistory(newPriceHistory);

        // Update trend data
        const newTrendData = { ...trendData };
        let trendUpdates = false;

        displayEvent.effect.affectedItems.forEach((itemId) => {
            const history = newPriceHistory[itemId] || [];
            if (history.length < 2) return;

            const prices = history.map((entry) => entry?.price).filter(Boolean);
            if (prices.length < 2) return;

            const currentPrice = prices[prices.length - 1];
            const previousPrice = prices[prices.length - 2];
            const priceChange = currentPrice - previousPrice;
            const percentChange = (priceChange / previousPrice) * 100;

            newTrendData[itemId] = {
                direction: Math.sign(priceChange),
                percentChange: Math.abs(percentChange).toFixed(1),
                priceHistory: prices,
            };
            trendUpdates = true;
        });

        if (trendUpdates) {
            setTrendData(newTrendData);
        }
    }, [displayEvent, marketData, localPriceHistory, trendData]);

    // Get price trend data for sparklines
    const getPriceTrendData = useCallback(
        (itemId) => {
            if (improvedAILevel < 2) return [];

            const history = priceHistory?.[itemId] || [];
            if (history.length < 2) return [];

            // Normalize prices for the sparkline
            const prices = history.map((entry) => entry?.price).filter(Boolean);
            return prices.length > 1 ? prices.slice(-10) : []; // Last 10 data points if available
        },
        [improvedAILevel, priceHistory]
    );

    // Get top 5 affected items by impact
    const topAffectedItems = useMemo(() => {
        if (!displayEvent?.effect?.affectedItems?.length) return [];

        return displayEvent.effect.affectedItems
            .map((itemId) => {
                const item = itemsData.items.find((i) => i.itemId === itemId);
                if (!item) return null;

                const trend = trendData[itemId] || {};
                const priceMult = randomFloatRange(
                    displayEvent.effect.priceMultiplierRange[0],
                    displayEvent.effect.priceMultiplierRange[1]
                );
                const stockMult = randomFloatRange(
                    displayEvent.effect.stockMultiplierRange[0],
                    displayEvent.effect.stockMultiplierRange[1]
                );

                // Calculate impact score (higher is more significant)
                const priceImpact = Math.abs(priceMult - 1) * 100; // Convert to percentage
                const stockImpact = Math.abs(1 - stockMult) * 100; // Invert since lower stock is more impactful
                const impactScore = priceImpact * 0.7 + stockImpact * 0.3; // Weight price more heavily

                return {
                    ...item,
                    priceMultiplier: priceMult,
                    stockMultiplier: stockMult,
                    impactScore,
                    trend,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.impactScore - a.impactScore)
            .slice(0, 5); // Top 5 most impacted items
    }, [displayEvent, trendData]);

    // Get the most impacted item for low AI levels
    const getMostImpactedItem = useCallback(() => {
        if (!topAffectedItems?.length) return null;
        return topAffectedItems[0]; // Already sorted by impact
    }, [topAffectedItems]);

    // Update trend data when market data changes
    useEffect(() => {
        if (!marketData || !priceHistory) return;

        const newTrendData = {};
        Object.entries(priceHistory).forEach(([itemId, history]) => {
            if (history?.length > 1) {
                const prices = history.map((h) => h?.price).filter(Boolean);
                if (prices.length > 1) {
                    newTrendData[itemId] = {
                        prices,
                        timestamps: history.map((h) => h?.timestamp).filter(Boolean),
                    };
                }
            }
        });

        setTrendData((prev) => ({
            ...prev,
            ...newTrendData,
        }));
    }, [marketData, priceHistory, setTrendData]);

    // Auto-hide event after 30 seconds (except for galaxy events which require acknowledge)
    useEffect(() => {
        if (!showEvent || !displayEvent) return;
        if (displayEvent?.type === 'galaxy') return; // Do not auto-hide galaxy events

        const timer = setTimeout(() => {
            console.log('[Event] Auto-hiding event');
            setShowEvent(false);
            if (typeof clearCurrentEvent === 'function') clearCurrentEvent();
        }, 30000);

        return () => clearTimeout(timer);
    }, [showEvent, displayEvent, clearCurrentEvent]);

    // Single effect to handle new events
    useEffect(() => {
        if (activeEvent && !displayEvent) {
            // Only set displayEvent if it's not already set
            setDisplayEvent(activeEvent);
            setShowEvent(true);

            // Apply the event effects to the market
            if (triggerRandomMarketEvent) {
                triggerRandomMarketEvent(activeEvent);
            }
        }
    }, [activeEvent, displayEvent, triggerRandomMarketEvent]);

    // When we get a new event, update our display and apply effects
    useEffect(() => {
        if (activeEvent) {
            // console.log('[Event] New event detected:', activeEvent);

            // Apply the event effects to the market
            if (triggerRandomMarketEvent) {
                triggerRandomMarketEvent(activeEvent);
            }

            setDisplayEvent(activeEvent);
            setShowEvent(true);
        }
    }, [activeEvent, triggerRandomMarketEvent]);

    if (!showEvent || !displayEvent) {
        return null;
    }

    const formatMultiplier = (multiplier, showPrecise = false) => {
        const change = (multiplier - 1) * 100;
        const prefix = change >= 0 ? '+' : '';

        // AI Level-based information disclosure
        if (improvedAILevel >= 500) {
            // Maximum detail for high AI levels
            return `${prefix}${change.toFixed(2)}%`;
        } else if (improvedAILevel >= 100) {
            // Show one decimal place for mid-high levels
            return `${prefix}${change.toFixed(1)}%`;
        } else if (improvedAILevel >= 50) {
            // Show rounded percentages for mid levels
            return `${prefix}${Math.round(change)}%`;
        } else if (improvedAILevel >= 25) {
            // Just show direction and relative strength for low levels
            const strength = Math.min(5, Math.ceil(Math.abs(change) / 20));
            const arrow = change >= 0 ? '▲' : '▼';
            return arrow.repeat(strength);
        } else {
            // Just show direction for very low levels
            return change >= 0 ? '▲' : '▼';
        }
    };

    // Render content based on AI level
    const renderContent = () => {
        // Level 0-24: Just show event title
        if (improvedAILevel < 25) {
            return (
                <div style={{ padding: '10px' }}>
                    <div
                        style={{
                            fontSize: '1.2em',
                            fontWeight: 'bold',
                            color: '#00ff00',
                            textAlign: 'center',
                            marginBottom: '10px',
                        }}
                    >
                        {obfuscateText(displayEvent.name || 'UNKNOWN EVENT', improvedAILevel)}
                    </div>
                    <div
                        style={{
                            fontSize: '0.8em',
                            color: '#888',
                            textAlign: 'center',
                            fontStyle: 'italic',
                        }}
                    >
                        [UPGRADE AI LEVEL FOR MORE INFO]
                    </div>
                </div>
            );
        }

        // Level 25-49: Show title, description, and most impacted item
        if (improvedAILevel < 50) {
            const item = getMostImpactedItem();
            return (
                <div style={{ padding: '10px' }}>
                    <div
                        style={{
                            fontSize: '1.2em',
                            fontWeight: 'bold',
                            color: '#00ff00',
                            marginBottom: '10px',
                            borderBottom: '1px solid #333',
                            paddingBottom: '8px',
                        }}
                    >
                        {displayEvent.name || 'UNKNOWN EVENT'}
                    </div>
                    <div
                        style={{
                            marginBottom: '15px',
                            lineHeight: '1.4',
                            color: '#aaa',
                            fontStyle: 'italic',
                        }}
                    >
                        {displayEvent.description || 'No description available'}
                    </div>
                    {item && (
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '10px',
                                borderRadius: '4px',
                                borderLeft: '3px solid #00ff00',
                                marginTop: '10px',
                            }}
                        >
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                {item.name} {formatMultiplier(item.priceMultiplier)}
                            </div>
                            <div style={{ fontSize: '0.8em', color: '#888' }}>
                                [UPGRADE AI LEVEL FOR MORE ITEMS]
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Level 50-99: Show all affected items with basic info
        if (improvedAILevel < 100) {
            return (
                <div style={{ padding: '10px' }}>
                    <div
                        style={{
                            fontSize: '1.2em',
                            fontWeight: 'bold',
                            color: '#00ff00',
                            marginBottom: '10px',
                            borderBottom: '1px solid #333',
                            paddingBottom: '8px',
                        }}
                    >
                        {displayEvent.name || 'UNKNOWN EVENT'}
                    </div>
                    <div
                        style={{
                            marginBottom: '15px',
                            lineHeight: '1.4',
                            color: '#aaa',
                            fontStyle: 'italic',
                        }}
                    >
                        {displayEvent.description || 'No description available'}
                    </div>
                    <div
                        style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            paddingRight: '5px',
                        }}
                    >
                        {topAffectedItems.map((item) => (
                            <div
                                key={item.itemId}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '4px',
                                    marginBottom: '5px',
                                }}
                            >
                                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                <div
                                    style={{
                                        color: item.priceMultiplier >= 1 ? '#4caf50' : '#f44336',
                                        fontWeight: 'bold',
                                        minWidth: '50px',
                                        textAlign: 'right',
                                    }}
                                >
                                    {formatMultiplier(item.priceMultiplier)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Level 100+: Show full details with trendlines
        return (
            <div style={{ padding: '10px' }}>
                <div
                    style={{
                        fontSize: '1.4em',
                        fontWeight: 'bold',
                        color: '#00ff00',
                        marginBottom: '10px',
                        borderBottom: '1px solid #333',
                        paddingBottom: '8px',
                        textTransform: 'uppercase',
                    }}
                >
                    {displayEvent.name}
                </div>

                <div
                    style={{
                        marginBottom: '15px',
                        lineHeight: '1.4',
                        color: '#aaa',
                        fontStyle: 'italic',
                    }}
                >
                    {displayEvent.description || 'No description available'}
                </div>

                <div
                    style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        paddingRight: '5px',
                    }}
                >
                    {topAffectedItems.map((item) => {
                        const trendData = getPriceTrendData(item.itemId);
                        return (
                            <div
                                key={item.itemId}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-evenly',
                                    alignItems: 'center',
                                    padding: '0.4269rem',
                                    background: 'rgba(255, 255, 255, 0.1337)',
                                }}
                            >
                                <div className="event-image item-image-wrapper">
                                    <span className="item-image-name">{item.name}</span>
                                    {(() => {
                                        if (item.itemId !== undefined) {
                                            try {
                                                const imageSrc = require(`../../images/item${item.itemId}.webp`);
                                                return (
                                                    <div
                                                        className="item-image-bg"
                                                        style={{
                                                            backgroundImage: `url(${imageSrc})`,
                                                        }}
                                                    />
                                                );
                                            } catch (e) {
                                                // Image failed to load, show fallback
                                            }
                                        }
                                        // fallback visual if image is missing
                                        return <div className="item-image-bg missing-image" />;
                                    })()}
                                </div>

                                <div>
                                    {trendData.length > 0 && (
                                        <div style={{ width: '80px', marginRight: '10px' }}>
                                            <Sparkline
                                                data={trendData}
                                                width={80}
                                                height={30}
                                                color={
                                                    item.priceMultiplier >= 1
                                                        ? '#4caf50'
                                                        : '#f44336'
                                                }
                                            />
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            color:
                                                item.priceMultiplier >= 1 ? '#4caf50' : '#f44336',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        PRICE: {formatMultiplier(item.priceMultiplier, true)}
                                    </div>
                                    <div
                                        style={{
                                            color:
                                                item.stockMultiplier >= 1 ? '#4caf50' : '#f44336',
                                            fontSize: '0.9em',
                                            opacity: 0.8,
                                        }}
                                    >
                                        STOCK: {formatMultiplier(item.stockMultiplier, true)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {improvedAILevel >= 500 && (
                        <div
                            style={{
                                marginTop: '15px',
                                padding: '10px',
                                background: 'rgba(0, 255, 0, 0.1)',
                                borderRadius: '4px',
                                borderLeft: '3px solid #00ff00',
                                fontSize: '0.9em',
                                color: '#8bc34a',
                                fontStyle: 'italic',
                            }}
                        >
                            {/* TODO: Implement with quantum setup to allow for auto trading */}
                            Quantum trading analysis available at AI Level 1000+
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const isGalaxy = displayEvent?.type === 'galaxy';

    if (isGalaxy) {
        // Full-screen modal for galaxy events
        return (
            <div
            // style={{
            //     position: 'fixed',
            //     inset: 0,
            //     background: 'rgba(0,0,0,0.85)',
            //     zIndex: 10000,
            //     display: 'flex',
            //     alignItems: 'center',
            //     justifyContent: 'center',
            //     padding: '20px',
            // }}
            >
                <div className={`event-container ${showEvent ? 'active' : ''}`}>
                    {renderContent()}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                        <button
                            onClick={() => {
                                setShowEvent(false);
                                if (typeof clearCurrentEvent === 'function') clearCurrentEvent();
                            }}
                            style={{
                                background: '#00aa00',
                                color: '#fff',
                                border: '1px solid #00ff00',
                                borderRadius: '4px',
                                padding: '10px 18px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            Acknowledge
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`event-container ${showEvent ? 'active' : ''}`}>
            <button
                className="close-button"
                onClick={() => {
                    setShowEvent(false);
                    if (typeof clearCurrentEvent === 'function') clearCurrentEvent();
                }}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(255, 0, 0, 0.7)',
                    border: '1px solid #ff4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: '1',
                    padding: 0,
                    transition: 'all 0.2s ease',
                    outline: 'none',
                }}
                onMouseOver={(e) => (e.target.style.background = 'rgba(255, 50, 50, 0.9)')}
                onMouseOut={(e) => (e.target.style.background = 'rgba(255, 0, 0, 0.7)')}
            >
                ×
            </button>
            {renderContent()}
        </div>
    );
};

export default Event;
