import React, { useState, useEffect } from 'react';
import './TraderInfo.scss';
import tradersData from '../../data/traders.json';

const getPriceMultiplierDescription = (range, showNumbers = false) => {
    const avg = (range[0] + range[1]) / 2;
    let text = '';
    if (avg < 0.6) text = 'Very Cheap';
    else if (avg < 0.85) text = 'Cheap';
    else if (avg < 1.15) text = 'Fair';
    else if (avg < 1.4) text = 'Expensive';
    else text = 'Very Expensive';

    return showNumbers ? `${text} (${range[0].toFixed(2)}-${range[1].toFixed(2)}x)` : text;
};

const getVolatilityDescription = (range, showNumbers = false) => {
    const volatility = ((range[1] - range[0]) / range[0]) * 100;
    let text = '';
    if (volatility < 5) text = 'Very Stable';
    else if (volatility < 15) text = 'Stable';
    else if (volatility < 30) text = 'Volatile';
    else if (volatility < 50) text = 'Very Volatile';
    else text = 'Extremely Volatile';

    return showNumbers ? `${text} (${volatility.toFixed(1)}% range)` : text;
};

const formatLanguages = (languages, showAll = false) => {
    const languageNames = {
        EN: 'English',
        CHIK: 'Chikruta',
        LAY: 'Laylelor',
    };

    if (!showAll) {
        return languages.length > 1
            ? `${languageNames[languages[0]]} +${languages.length - 1} more`
            : languageNames[languages[0]] || languages[0];
    }

    return languages.map((lang) => languageNames[lang] || lang).join(', ');
};

const formatRecordTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatStockRange = (range) => {
    return `${range[0]}–${range[1]} items`;
};

const getRarityColor = (value, max = 1.5) => {
    const percentage = Math.min(value / max, 1);
    const hue = (1 - percentage) * 120; // Green (120) to Red (0)
    return `hsl(${hue}, 70%, 60%)`;
};

const TraderInfo = ({ trader, improvedAILevel = 0, itemsData = tradersData.items || [] }) => {
    const [glowIntensity, setGlowIntensity] = useState(0);

    // Subtle pulsing effect for premium levels
    useEffect(() => {
        if (improvedAILevel >= 75) {
            const interval = setInterval(() => {
                setGlowIntensity(0.5 + Math.random() * 0.5);
            }, 2000 + Math.random() * 3000);
            return () => clearInterval(interval);
        }
    }, [improvedAILevel]);

    if (!trader) return null;

    // AI Level thresholds for different features
    const showBasicInfo = improvedAILevel >= 0; // Always show basic info
    const showStats = improvedAILevel >= 50; // Show basic stats at level 25
    const showEnhanced = improvedAILevel >= 10; // Enhanced visuals at level 50
    const showAdvanced = improvedAILevel >= 500; // Advanced info at level 100
    const showPremium = improvedAILevel >= 1500; // Premium effects at level 150
    const showEndGame = improvedAILevel >= 100000; // Shows the record time

    const containerClass = ['trader-info', showEnhanced && 'enhanced', showPremium && 'premium']
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={containerClass}
            style={{
                '--glow-intensity': glowIntensity,
                '--ai-level': Math.min(improvedAILevel / 100, 1),
            }}
        >
            <div className="trader-header">
                <div className="trader-title-row">
                    {showBasicInfo && <h3 className="trader-info-name">{trader.name}</h3>}
                    {showEndGame && (
                        <div className="endgame-badge">
                            <span>Record: {formatRecordTime(trader.recordTime)}</span>
                        </div>
                    )}
                </div>

                {showStats && (
                    <div className="trader-meta">
                        <span className="meta-item">Home: {trader.homeGalaxy}</span>
                        <span className="meta-divider">•</span>
                        <span className="meta-item">
                            {formatLanguages(trader.languageRange, showAdvanced)}
                        </span>
                        {showAdvanced && (
                            <>
                                <span className="meta-divider">•</span>
                                <span className="meta-item">
                                    Stock: {formatStockRange(trader.stockRange)}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="trader-content">
                <p className="trader-description">
                    {trader.description}
                    {showAdvanced && trader.secretInfo && (
                        <span className="secret-info"> {trader.secretInfo}</span>
                    )}
                </p>

                {showStats && (
                    <div className="trader-stats">
                        <div className="stat">
                            <span className="stat-label">Pricing:</span>
                            <span
                                className="stat-value"
                                style={{
                                    color: getRarityColor(
                                        (trader.priceMult[0] + trader.priceMult[1]) / 2,
                                        1.5
                                    ),
                                }}
                            >
                                {getPriceMultiplierDescription(trader.priceMult, showAdvanced)}
                            </span>
                        </div>

                        <div className="stat">
                            <span className="stat-label">Market:</span>
                            <span
                                className="stat-value"
                                style={{
                                    color: getRarityColor(
                                        ((trader.volatilityRange[1] - trader.volatilityRange[0]) /
                                            trader.volatilityRange[0]) *
                                            100,
                                        50
                                    ),
                                }}
                            >
                                {getVolatilityDescription(trader.volatilityRange, showAdvanced)}
                            </span>
                        </div>

                        <div className="stat">
                            <span className="stat-label">Items:</span>
                            <span className="stat-value">
                                {trader.numberOfItems[0] === trader.numberOfItems[1]
                                    ? trader.numberOfItems[0]
                                    : `${trader.numberOfItems[0]}-${trader.numberOfItems[1]}`}
                            </span>
                        </div>

                        {showAdvanced && trader.rareItems && trader.rareItems.length > 0 && (
                            <div className="stat">
                                <span className="stat-label">Rare Items:</span>
                                <span className="stat-value">
                                    {trader.rareItems.length} available
                                </span>
                            </div>
                        )}

                        {showAdvanced &&
                            trader.reliableItems &&
                            trader.reliableItems.length > 0 && (
                                <div className="stat">
                                    <span className="stat-label">Reliable Stock:</span>
                                    <span className="stat-value">
                                        {trader.reliableItems.length} items
                                    </span>
                                </div>
                            )}
                    </div>
                )}
            </div>

            {showPremium && trader.recordTime < 136 && (
                <div className="record-badge">
                    <span>Fast Trader</span>
                </div>
            )}
        </div>
    );
};

export default TraderInfo;
