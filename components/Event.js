import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { randomFloatRange } from '../utils/helpers';
import itemsData from '../data/items.json';
import './Event.scss';

const Event = () => {
    const { currentGameEvent } = useMarketplace();
    const [showEvent, setShowEvent] = useState(false);

    useEffect(() => {
        if (currentGameEvent) {
            setShowEvent(true);
            // Auto-hide after 10 seconds
            const timer = setTimeout(() => setShowEvent(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [currentGameEvent]);

    if (!showEvent || !currentGameEvent) return null;

    const formatMultiplier = (multiplier) => {
        if (multiplier >= 1) {
            return `+${(multiplier - 1) * 100}%`;
        }
        return `-${(1 - multiplier) * 100}%`;
    };

    return (
        <div className={`event-container ${showEvent ? 'active' : ''}`}>
            <button className="close-button" onClick={() => setShowEvent(false)}>
                ×
            </button>
            <div className="event-header">{currentGameEvent.name}</div>
            <div className="event-description">{currentGameEvent.description}</div>
            <div className="event-effects">
                {currentGameEvent.effect.affectedItems.map((itemId) => {
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
                                            currentGameEvent.effect.priceMultiplierRange[0],
                                            currentGameEvent.effect.priceMultiplierRange[1]
                                        )
                                    )}
                                </span>
                                <span className="stock-change">
                                    Stock:{' '}
                                    {formatMultiplier(
                                        randomFloatRange(
                                            currentGameEvent.effect.stockMultiplierRange[0],
                                            currentGameEvent.effect.stockMultiplierRange[1]
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
