import React, { useState, useEffect, useMemo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import './QuantumTradePredictor.scss';

const PREDICTION_TYPES = {
    SHORT_TERM: 'Short Term (1-2 cycles)',
    MEDIUM_TERM: 'Medium Term (3-5 cycles)',
    LONG_TERM: 'Long Term (5+ cycles)',
};

const QuantumTradePredictor = () => {
    const { marketHistory, currentCycle, galaxyName } = useMarketplace();
    const { theme } = useUI();
    const [predictionType, setPredictionType] = useState(PREDICTION_TYPES.SHORT_TERM);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [predictions, setPredictions] = useState([]);

    // Analyze market data to generate predictions
    const analyzeMarket = useMemo(() => {
        if (!marketHistory?.length) return [];

        // Get the most recent market data
        const currentMarket = marketHistory[marketHistory.length - 1];

        return currentMarket.items
            .map((item) => {
                // Calculate price momentum
                const priceHistory = marketHistory
                    .slice(-10) // Last 10 cycles
                    .map(
                        (market) => market.items.find((i) => i.id === item.id)?.price || item.price
                    );

                const priceChanges = [];
                for (let i = 1; i < priceHistory.length; i++) {
                    priceChanges.push(
                        ((priceHistory[i] - priceHistory[i - 1]) / priceHistory[i - 1]) * 100
                    );
                }

                const avgChange =
                    priceChanges.reduce((a, b) => a + b, 0) / (priceChanges.length || 1);
                const volatility = Math.sqrt(
                    priceChanges.reduce((a, b) => a + Math.pow(b - avgChange, 2), 0) /
                        (priceChanges.length || 1)
                );

                // Generate prediction based on prediction type
                let predictedChange, confidence;
                const baseVolatility = Math.max(1, volatility);

                switch (predictionType) {
                    case PREDICTION_TYPES.SHORT_TERM:
                        predictedChange = avgChange * (0.8 + Math.random() * 0.4);
                        confidence = Math.max(0.5, 0.9 - volatility * 0.01);
                        break;
                    case PREDICTION_TYPES.MEDIUM_TERM:
                        predictedChange = avgChange * (0.6 + Math.random() * 0.8);
                        confidence = Math.max(0.3, 0.7 - volatility * 0.008);
                        break;
                    case PREDICTION_TYPES.LONG_TERM:
                        predictedChange = avgChange * (0.4 + Math.random() * 1.2);
                        confidence = Math.max(0.1, 0.5 - volatility * 0.005);
                        break;
                    default:
                        predictedChange = 0;
                        confidence = 0;
                }

                // Cap the prediction to reasonable values
                predictedChange = Math.max(-50, Math.min(50, predictedChange));
                confidence = Math.max(0.1, Math.min(0.99, confidence));

                return {
                    id: item.id,
                    name: item.name,
                    currentPrice: item.price,
                    predictedChange,
                    confidence,
                    volatility,
                    recommendation: getRecommendation(predictedChange, confidence, volatility),
                };
            })
            .sort((a, b) => {
                // Sort by potential profit * confidence
                const scoreA = (a.predictedChange * a.confidence) / Math.max(1, a.volatility);
                const scoreB = (b.predictedChange * b.confidence) / Math.max(1, b.volatility);
                return scoreB - scoreA;
            });
    }, [marketHistory, predictionType]);

    const getRecommendation = (change, confidence, volatility) => {
        if (confidence < 0.3) return 'Uncertain';

        const riskAdjustedChange = (change * confidence) / Math.max(1, volatility * 0.5);

        if (riskAdjustedChange > 10) return 'Strong Buy';
        if (riskAdjustedChange > 5) return 'Buy';
        if (riskAdjustedChange > 0) return 'Hold';
        if (riskAdjustedChange > -5) return 'Slight Sell';
        if (riskAdjustedChange > -10) return 'Sell';
        return 'Strong Sell';
    };

    const getRecommendationColor = (recommendation) => {
        switch (recommendation) {
            case 'Strong Buy':
                return '#4caf50';
            case 'Buy':
                return '#8bc34a';
            case 'Hold':
                return '#ffc107';
            case 'Slight Sell':
                return '#ff9800';
            case 'Sell':
                return '#ff5722';
            case 'Strong Sell':
                return '#f44336';
            default:
                return '#9e9e9e';
        }
    };

    const formatNumber = (num, decimals = 2) => {
        return num >= 0 ? `+${num.toFixed(decimals)}%` : `${num.toFixed(decimals)}%`;
    };

    return (
        <div className={`quantum-trade-predictor ${theme}`}>
            <div className="predictor-header">
                <h3>Quantum Trade Predictor</h3>
                <div className="prediction-type-selector">
                    {Object.values(PREDICTION_TYPES).map((type) => (
                        <button
                            key={type}
                            className={predictionType === type ? 'active' : ''}
                            onClick={() => setPredictionType(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="predictor-info">
                <p>Analyzing market patterns in {galaxyName}...</p>
                <p>
                    Cycle: {currentCycle} | Prediction Confidence:{' '}
                    {Math.round(
                        (analyzeMarket.reduce((a, b) => a + b.confidence, 0) /
                            Math.max(1, analyzeMarket.length)) *
                            100
                    )}
                    %
                </p>
            </div>

            <div className="predictions-grid">
                <div className="prediction-header">
                    <span>Item</span>
                    <span>Current</span>
                    <span>Prediction</span>
                    <span>Confidence</span>
                    <span>Action</span>
                </div>

                {analyzeMarket.map((item) => (
                    <div key={item.id} className="prediction-row">
                        <span className="item-name">{item.name}</span>
                        <span className="current-price">{item.currentPrice.toFixed(2)}</span>
                        <span
                            className={`predicted-change ${
                                item.predictedChange >= 0 ? 'positive' : 'negative'
                            }`}
                        >
                            {formatNumber(item.predictedChange)}
                        </span>
                        <span className="confidence">
                            <div
                                className="confidence-bar"
                                style={{
                                    width: `${item.confidence * 100}%`,
                                    backgroundColor: `rgba(${
                                        item.predictedChange >= 0 ? '76, 175, 80' : '244, 67, 54'
                                    }, ${0.3 + item.confidence * 0.7})`,
                                }}
                            />
                            {Math.round(item.confidence * 100)}%
                        </span>
                        <span
                            className="recommendation"
                            style={{ color: getRecommendationColor(item.recommendation) }}
                        >
                            {item.recommendation}
                        </span>
                    </div>
                ))}
            </div>

            <div className="predictor-footer">
                <p>
                    Predictions update automatically with market changes. Higher confidence
                    indicates more reliable predictions.
                </p>
            </div>
        </div>
    );
};

export default QuantumTradePredictor;
