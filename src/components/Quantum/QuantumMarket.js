import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import './QuantumMarket.scss';

// Helper to calculate auto-trade interval based on AI level
const getIntervalMs = (aiLevel) => {
    if (aiLevel < 100) return 1000;
    if (aiLevel < 200) return 900;
    if (aiLevel < 300) return 800;
    if (aiLevel < 400) return 700;
    if (aiLevel < 500) return 600;
    if (aiLevel < 600) return 500;
    if (aiLevel < 700) return 400;
    if (aiLevel < 800) return 300;
    if (aiLevel < 900) return 200;
    return 100;
};

const QuantumMarket = ({
    credits: creditsProp,
    displayCells: displayCellsProp,
    inventory: inventoryProp,
    purchaseHistory: purchaseHistoryProp,
    handleBuyClick: handleBuyClickProp,
    handleSellAll: handleSellAllProp,
    quantumInventory: quantumInventoryProp,
    improvedAILevel: improvedAILevelProp,
    quantumPower,
    statusEffects = {},
} = {}) => {
    const {
        credits: creditsCtx,
        displayCells: displayCellsCtx = [],
        inventory: inventoryCtx,
        purchaseHistory: purchaseHistoryCtx,
        handleBuyClick: handleBuyClickCtx,
        handleSellAll: handleSellAllCtx,
        quantumInventory: quantumInventoryCtx = [],
        courierDrones: courierDronesCtx,
        items: itemsCtx,
    } = useMarketplace();

    const { improvedAILevel: improvedAILevelCtx } = useAILevel();

    const credits = creditsProp !== undefined ? creditsProp : creditsCtx;
    const displayCells = displayCellsProp !== undefined ? displayCellsProp : displayCellsCtx;
    const inventory = inventoryProp !== undefined ? inventoryProp : inventoryCtx;
    const purchaseHistory =
        purchaseHistoryProp !== undefined ? purchaseHistoryProp : purchaseHistoryCtx;
    const handleBuyClick =
        handleBuyClickProp !== undefined ? handleBuyClickProp : handleBuyClickCtx;
    const handleSellAll = handleSellAllProp !== undefined ? handleSellAllProp : handleSellAllCtx;
    const quantumInventory =
        quantumInventoryProp !== undefined ? quantumInventoryProp : quantumInventoryCtx;
    const improvedAILevel =
        improvedAILevelProp !== undefined ? improvedAILevelProp : improvedAILevelCtx;

    // Get courierDrones (delivery speed boost) from context
    const courierDrones = typeof courierDronesCtx === 'number' ? courierDronesCtx : 0;
    const itemsList = itemsCtx || [];

    // Check if QuantumMarket is unlocked and quantumPower is enabled
    const isUnlocked = quantumInventory.includes('QuantumMarket') && quantumPower;

    // Determine AI tier for styling
    let aiTier = 'zero';
    if (improvedAILevel >= 10000) aiTier = 'legendary';
    else if (improvedAILevel >= 5000) aiTier = 'elite';
    else if (improvedAILevel >= 1500) aiTier = 'skilled';
    else if (improvedAILevel >= 1000) aiTier = 'expert';
    else if (improvedAILevel >= 500) aiTier = 'explorer';
    else if (improvedAILevel >= 300) aiTier = 'adventurer';
    else if (improvedAILevel >= 200) aiTier = 'apprentice';
    else if (improvedAILevel >= 100) aiTier = 'ultra';
    else if (improvedAILevel >= 75) aiTier = 'high';
    else if (improvedAILevel >= 50) aiTier = 'medium';
    else if (improvedAILevel >= 25) aiTier = 'low';

    // State for buy percentage and minimum take profit (credit value)
    const [buyPercentage, setBuyPercentage] = useState(10); // Default 10% of credits
    const [minTakeProfit, setMinTakeProfit] = useState(10); // Default 10 credits
    const [isAutoTrading, setIsAutoTrading] = useState(false);
    const [autoTradeInterval, setAutoTradeInterval] = useState(null);

    // Refs to always have latest inventory, displayCells, credits, and minTakeProfit for auto-trading
    const inventoryRef = useRef(inventory);
    const displayCellsRef = useRef(displayCells);
    const creditsRef = useRef(credits);
    const minTakeProfitRef = useRef(minTakeProfit);
    useEffect(() => {
        inventoryRef.current = inventory;
    }, [inventory]);
    useEffect(() => {
        displayCellsRef.current = displayCells;
    }, [displayCells]);
    useEffect(() => {
        creditsRef.current = credits;
    }, [credits]);
    useEffect(() => {
        minTakeProfitRef.current = minTakeProfit;
    }, [minTakeProfit]);

    // Calculate total value of inventory (defensive)
    const totalInventoryValue = Array.isArray(inventory)
        ? inventory.reduce((total, item) => {
              const price = typeof item.price === 'number' ? item.price : 0;
              const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
              return total + price * quantity;
          }, 0)
        : 0;

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

    // Aggressive, profit-seeking auto-trader logic with local state simulation
    const executeSell = useCallback(() => {
        if (!isUnlocked) return;
        let localInventory = Array.isArray(inventory) ? inventory.map((i) => ({ ...i })) : [];
        let localCredits = credits;
        localInventory.forEach((item, idx) => {
            const marketItem = displayCells.find((cell) => cell && cell.name === item.name);
            if (!marketItem) return;
            const marketPrice = marketItem.price;
            const avgPrice = getAveragePurchasePrice(item.name);
            const profitPerItem = marketPrice - avgPrice;
            const totalProfit = profitPerItem * item.quantity;
            if (profitPerItem > 0 && totalProfit >= minTakeProfit && item.quantity > 0) {
                handleSellAll(marketItem, item.quantity);
                localInventory[idx].quantity = 0;
                localCredits += item.quantity * marketPrice;
            }
        });
    }, [
        handleSellAll,
        inventory,
        isUnlocked,
        minTakeProfit,
        getAveragePurchasePrice,
        displayCells,
        credits,
    ]);

    const executeBuy = useCallback(() => {
        if (!isUnlocked) return;
        // Make a local copy of credits and inventory
        let localCredits = credits;
        let localInventory = Array.isArray(inventory) ? inventory.map((i) => ({ ...i })) : [];
        const creditsToSpend = (localCredits * buyPercentage) / 100;
        // Only buy items if price is at least 5% below base/avg
        const itemsToBuy = displayCells
            .filter((item) => {
                if (!item) return false;
                const itemDef = itemsList.find((i) => i.name === item.name);
                const avgPrice = getAveragePurchasePrice(item.name);
                const basePrice = itemDef?.basePrice || avgPrice || item.price;
                // Only buy if price is at least 5% below base/avg
                return item.price < basePrice * 0.95;
            })
            .sort((a, b) => a.price - b.price); // Prefer cheapest
        const creditsPerItem = creditsToSpend / Math.max(1, itemsToBuy.length);
        itemsToBuy.forEach((item) => {
            if (localCredits <= 0) return;
            const maxAffordableQty = Math.floor(localCredits / item.price);
            const quantity = Math.floor(creditsPerItem / item.price);
            const buyQty = Math.max(0, Math.min(quantity, maxAffordableQty));
            if (buyQty > 0) {
                handleBuyClick(item, buyQty);
                // Update local state
                localCredits -= buyQty * item.price;
                // Update local inventory (add or update)
                const invIdx = localInventory.findIndex((i) => i.name === item.name);
                if (invIdx !== -1) {
                    localInventory[invIdx].quantity += buyQty;
                } else {
                    localInventory.push({ name: item.name, quantity: buyQty, price: item.price });
                }
            }
        });
    }, [
        buyPercentage,
        credits,
        displayCells,
        handleBuyClick,
        isUnlocked,
        getAveragePurchasePrice,
        itemsList,
        inventory,
    ]);

    // Q-Buy: improved logic using base price and deal tiers
    const qBuy = useCallback(() => {
        if (!isUnlocked) return;
        const creditsToSpend = (creditsRef.current * buyPercentage) / 100;
        const getBasePrice = (itemName) => {
            const def = itemsList.find((i) => i.name === itemName);
            return def?.basePrice || 1;
        };
        let bestItem = null;
        let bestQty = 0;
        let bestGain = 0;
        displayCells.forEach((item) => {
            if (!item || !item.price) return;
            const basePrice = getBasePrice(item.name);
            if (item.price >= basePrice) return; // Only consider deals
            const maxQty = Math.floor(creditsToSpend / item.price);
            if (maxQty < 1) return;
            const potentialGain = (basePrice - item.price) * maxQty;
            if (potentialGain > bestGain) {
                bestGain = potentialGain;
                bestItem = item;
                bestQty = maxQty;
            }
        });
        if (bestItem && bestQty > 0 && bestGain > 0) {
            handleBuyClick(bestItem, bestQty);
        }
    }, [buyPercentage, displayCells, handleBuyClick, isUnlocked, itemsList]);

    // Q-Sell: manual sell logic (liquidate only enough to meet minTakeProfit)
    const qSell = useCallback(() => {
        if (!isUnlocked) return;
        const currentInventory = Array.isArray(inventory)
            ? inventory.filter((i) => i.quantity >= 1)
            : [];
        currentInventory.forEach((item) => {
            const marketItem = displayCells.find((cell) => cell && cell.name === item.name);
            if (!marketItem) return;
            const marketPrice = marketItem.price;
            let avgPrice = getAveragePurchasePrice(item.name);
            if (!avgPrice || isNaN(avgPrice)) avgPrice = item.price || marketPrice;
            const profitPerItem = marketPrice - avgPrice;
            if (profitPerItem <= 0) return;
            // Calculate minimum quantity needed to meet minTakeProfit
            const minQty = Math.ceil(minTakeProfit / profitPerItem);
            const sellQty = Math.max(0, Math.min(item.quantity, minQty));
            if (sellQty > 0 && profitPerItem * sellQty >= minTakeProfit) {
                for (let i = 0; i < sellQty; i++) {
                    handleSellAll(item.name); // Sells one at a time (if you want to sell all at once, update context to accept qty)
                }
            }
        });
        setTimeout(() => {}, 100);
    }, [
        handleSellAll,
        inventory,
        isUnlocked,
        getAveragePurchasePrice,
        displayCells,
        minTakeProfit,
    ]);

    // Q-Sell: pure function for auto-trader (liquidate only enough to meet minTakeProfit)
    const qSellAuto = useCallback(
        (
            isUnlockedArg,
            inventoryArg,
            displayCellsArg,
            getAveragePurchasePriceArg,
            handleSellAllArg,
            minTakeProfitArg
        ) => {
            if (!isUnlockedArg) return false;
            const currentInventory = Array.isArray(inventoryArg)
                ? inventoryArg.filter((i) => i.quantity >= 1)
                : [];
            let sold = false;
            currentInventory.forEach((item) => {
                const marketItem = displayCellsArg.find((cell) => cell && cell.name === item.name);
                if (!marketItem) return;
                const marketPrice = marketItem.price;
                let avgPrice = getAveragePurchasePriceArg(item.name);
                if (!avgPrice || isNaN(avgPrice)) avgPrice = item.price || marketPrice;
                const profitPerItem = marketPrice - avgPrice;
                if (profitPerItem <= 0) return;
                // Calculate minimum quantity needed to meet minTakeProfit
                const minQty = Math.ceil(minTakeProfitArg / profitPerItem);
                const sellQty = Math.max(0, Math.min(item.quantity, minQty));
                if (sellQty > 0 && profitPerItem * sellQty >= minTakeProfitArg) {
                    for (let i = 0; i < sellQty; i++) {
                        handleSellAllArg(item.name);
                        sold = true;
                    }
                }
            });
            return sold;
        },
        []
    );

    // Q-Buy: pure function for auto-trader (maximize gain)
    const qBuyAuto = useCallback(
        (
            isUnlockedArg,
            creditsArg,
            buyPercentageArg,
            displayCellsArg,
            itemsListArg,
            handleBuyClickArg
        ) => {
            if (!isUnlockedArg) return;
            const creditsToSpend = (creditsArg * buyPercentageArg) / 100;
            const getBasePrice = (itemName) => {
                const def = itemsListArg.find((i) => i.name === itemName);
                return def?.basePrice || 1;
            };
            let bestItem = null;
            let bestQty = 0;
            let bestGain = 0;
            displayCellsArg.forEach((item) => {
                if (!item || !item.price) return;
                const basePrice = getBasePrice(item.name);
                if (item.price >= basePrice) return;
                const maxQty = Math.floor(creditsToSpend / item.price);
                if (maxQty < 1) return;
                const potentialGain = (basePrice - item.price) * maxQty;
                if (potentialGain > bestGain) {
                    bestGain = potentialGain;
                    bestItem = item;
                    bestQty = maxQty;
                }
            });
            if (bestItem && bestQty > 0 && bestGain > 0) {
                handleBuyClickArg(bestItem, bestQty);
            }
        },
        []
    );

    // Auto-trading: setInterval, always uses latest refs and state
    useEffect(() => {
        if (!isAutoTrading) return;
        // Run immediately on enable
        const runAutoTrade = () => {
            const sold = qSellAuto(
                isUnlocked,
                inventoryRef.current,
                displayCellsRef.current,
                getAveragePurchasePrice,
                handleSellAll,
                minTakeProfitRef.current
            );
            if (!sold) {
                qBuyAuto(
                    isUnlocked,
                    creditsRef.current,
                    buyPercentage,
                    displayCellsRef.current,
                    itemsList,
                    handleBuyClick
                );
            }
        };
        runAutoTrade();
        const intervalMs = getIntervalMs(improvedAILevel);
        const interval = setInterval(() => {
            runAutoTrade();
        }, intervalMs);
        return () => {
            clearInterval(interval);
        };
    }, [isAutoTrading, improvedAILevel]);

    // Refactored auto-trading: useEffect-based, always uses latest state
    useEffect(() => {
        if (!isAutoTrading) return;
        const intervalMs = getIntervalMs(improvedAILevel);
        const timeout = setTimeout(() => {}, intervalMs);
        return () => clearTimeout(timeout);
    }, [isAutoTrading, improvedAILevel]);

    // Toggle auto-trading: just set the flag
    const toggleAutoTrading = useCallback(() => {
        setIsAutoTrading((prev) => {
            const next = !prev;
            return next;
        });
    }, []);

    // Determine if there is anything to sell at or above minTakeProfit (credit value)
    const canSell = inventory.some((item) => {
        const marketItem = displayCells.find((cell) => cell && cell.name === item.name);
        if (!marketItem) return false;
        const marketPrice = marketItem.price;
        const avgPrice = getAveragePurchasePrice(item.name);
        const profitPerItem = marketPrice - avgPrice;
        const totalProfit = profitPerItem * item.quantity;
        return profitPerItem > 0 && totalProfit >= minTakeProfit && item.quantity > 0;
    });

    // For progress bar: 2000ms (slowest) = 0%, 420ms (fastest) = 100%
    const minInterval = 100;
    const maxInterval = 1000;
    const intervalMs = getIntervalMs(improvedAILevel);
    const progressPercent = Math.round(
        ((maxInterval - intervalMs) / (maxInterval - minInterval)) * 100
    );

    // Clean up interval on unmount
    useEffect(() => {
        return () => {
            if (autoTradeInterval) {
                clearInterval(autoTradeInterval);
            }
        };
    }, [autoTradeInterval]);

    if (!isUnlocked) return null;

    return (
        <div className={`quantum-market ai-tier-${aiTier}`}>
            <h3>Quantum Market</h3>

            <div className="auto-trade-speed-bar" style={{ marginBottom: '1em' }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Auto Trade Speed</label>
                <div
                    style={{
                        background: '#222',
                        borderRadius: 6,
                        height: 18,
                        width: 220,
                        position: 'relative',
                        boxShadow: '0 1px 4px #222a',
                        marginBottom: 2,
                    }}
                >
                    <div
                        style={{
                            background: 'linear-gradient(90deg, #6af, #8cf 80%)',
                            width: `${progressPercent}%`,
                            height: '100%',
                            borderRadius: 6,
                            transition: 'width 0.3s',
                        }}
                    />
                    <span
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 500,
                        }}
                    >
                        {intervalMs} ms
                    </span>
                </div>
                <div style={{ fontSize: 12, color: '#bff', marginTop: 2 }}>
                    Faster speed with higher AI Level
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
                        className={`ai-tier-${aiTier}`}
                    />
                    <span>{buyPercentage}%</span>
                </div>

                <div className="control-group">
                    <label>Min Take Profit</label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={minTakeProfit}
                        onChange={(e) => setMinTakeProfit(parseInt(e.target.value))}
                        disabled={isAutoTrading}
                        className={`ai-tier-${aiTier}`}
                    />
                    <span>{minTakeProfit}c</span>
                </div>

                <button
                    className={`trade-button ai-tier-${aiTier} ${isAutoTrading ? 'active' : ''}`}
                    onClick={toggleAutoTrading}
                >
                    {isAutoTrading ? 'Stop Auto-Trading' : 'Start Auto-Trading'}
                </button>

                <div className="manual-controls">
                    <button
                        className={`ai-tier-${aiTier} quantum-btn${
                            isAutoTrading ? ' q-disabled' : ''
                        }`}
                        onClick={qBuy}
                        disabled={isAutoTrading}
                    >
                        Q-Buy
                    </button>
                    <button
                        className={`ai-tier-${aiTier} quantum-btn${
                            isAutoTrading || !canSell ? ' q-disabled' : ''
                        }`}
                        onClick={qSell}
                        disabled={isAutoTrading || !canSell}
                    >
                        Q-Sell
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
