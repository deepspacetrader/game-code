import React, { useState, useEffect, useCallback } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import './QuantumMarket.scss';

const QuantumMarket = () => {
    const {
        credits,
        displayCells = [],
        inventory,
        purchaseHistory,
        handleBuyClick,
        handleSellAll,
        quantumInventory = [],
    } = useMarketplace();

    const { improvedUILevel } = useUI();

    // Check if QuantumMarket is unlocked
    const isUnlocked = quantumInventory.includes('QuantumMarket');

    // State for buy/sell percentages
    const [buyPercentage, setBuyPercentage] = useState(10); // Default 10% of credits
    const [sellPercentage, setSellPercentage] = useState(50); // Default 50% of inventory
    const [isAutoTrading, setIsAutoTrading] = useState(false);
    const [autoTradeInterval, setAutoTradeInterval] = useState(null);

    // Calculate total value of inventory
    const totalInventoryValue = inventory.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);

    // Calculate average purchase price for an item
    const getAveragePurchasePrice = useCallback(
        (itemName) => {
            const purchases = purchaseHistory[itemName] || [];
            if (purchases.length === 0) return 0;
            return purchases.reduce((sum, price) => sum + price, 0) / purchases.length;
        },
        [purchaseHistory]
    );

    // Calculate potential profit for an item
    const calculatePotentialProfit = useCallback(
        (item) => {
            const avgPrice = getAveragePurchasePrice(item.name);
            if (!avgPrice) return 0;
            return ((item.price - avgPrice) / avgPrice) * 100;
        },
        [getAveragePurchasePrice]
    );

    // Buy items based on the set percentage
    const executeBuy = useCallback(() => {
        if (!isUnlocked) return;

        const creditsToSpend = (credits * buyPercentage) / 100;

        // Find items that are good to buy (e.g., below base price or good deal)
        const itemsToBuy = displayCells.filter((item) => {
            if (!item) return false;
            const profit = calculatePotentialProfit(item);
            return profit <= 0; // Buy if price is at or below average purchase price
        });

        // Distribute credits among items
        const creditsPerItem = creditsToSpend / Math.max(1, itemsToBuy.length);

        // Execute buys
        itemsToBuy.forEach((item) => {
            if (item && item.price > 0) {
                const quantity = Math.floor(creditsPerItem / item.price);
                if (quantity > 0) {
                    handleBuyClick(item, quantity);
                }
            }
        });
    }, [
        buyPercentage,
        credits,
        displayCells,
        handleBuyClick,
        isUnlocked,
        calculatePotentialProfit,
    ]);

    // Sell items based on the set percentage
    const executeSell = useCallback(() => {
        if (!isUnlocked) return;

        inventory.forEach((item) => {
            const profit = calculatePotentialProfit(item);
            // Sell if profit is positive or item is overpriced
            if (profit > 5) {
                // At least 5% profit
                const quantityToSell = Math.ceil((item.quantity * sellPercentage) / 100);
                if (quantityToSell > 0) {
                    handleSellAll(item, quantityToSell);
                }
            }
        });
    }, [handleSellAll, inventory, isUnlocked, sellPercentage, calculatePotentialProfit]);

    // Toggle auto-trading
    const toggleAutoTrading = useCallback(() => {
        if (isAutoTrading) {
            if (autoTradeInterval) {
                clearInterval(autoTradeInterval);
                setAutoTradeInterval(null);
            }
        } else {
            // Execute immediately
            executeBuy();
            executeSell();

            // Then set up interval (every 30 seconds)
            const interval = setInterval(() => {
                executeBuy();
                executeSell();
            }, 30000);

            setAutoTradeInterval(interval);
        }

        setIsAutoTrading(!isAutoTrading);
    }, [isAutoTrading, autoTradeInterval, executeBuy, executeSell]);

    // Clean up interval on unmount
    useEffect(() => {
        return () => {
            if (autoTradeInterval) {
                clearInterval(autoTradeInterval);
            }
        };
    }, [autoTradeInterval]);

    if (!isUnlocked || improvedUILevel < 100) return null;

    return (
        <div className="quantum-market">
            <h3>Quantum Market</h3>

            <div className="market-stats">
                <div className="stat">
                    <span className="label">Credits:</span>
                    <span className="value">${credits.toFixed(2)}</span>
                </div>
                <div className="stat">
                    <span className="label">Inventory Value:</span>
                    <span className="value">${totalInventoryValue.toFixed(2)}</span>
                </div>
            </div>

            <div className="trading-controls">
                <div className="control-group">
                    <label>Buy % of Credits:</label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={buyPercentage}
                        onChange={(e) => setBuyPercentage(parseInt(e.target.value))}
                        disabled={isAutoTrading}
                    />
                    <span>{buyPercentage}%</span>
                </div>

                <div className="control-group">
                    <label>Sell % of Inventory:</label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={sellPercentage}
                        onChange={(e) => setSellPercentage(parseInt(e.target.value))}
                        disabled={isAutoTrading}
                    />
                    <span>{sellPercentage}%</span>
                </div>

                <button
                    className={`trade-button ${isAutoTrading ? 'active' : ''}`}
                    onClick={toggleAutoTrading}
                >
                    {isAutoTrading ? 'Stop Auto-Trading' : 'Start Auto-Trading'}
                </button>

                <div className="manual-controls">
                    <button onClick={executeBuy} disabled={isAutoTrading}>
                        Buy Now
                    </button>
                    <button onClick={executeSell} disabled={isAutoTrading}>
                        Sell Now
                    </button>
                </div>
            </div>

            <div className="trading-log">
                <h4>Trading Activity</h4>
                <div className="log-entries">
                    <div className="log-entry info">
                        {isAutoTrading
                            ? 'Auto-trading is active. The system will automatically buy and sell based on your settings.'
                            : 'Auto-trading is inactive. Use the controls above to manage your trades.'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuantumMarket;
