import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import './QuantumHover.scss';

const calculateVolatility = (prices) => {
    if (prices.length < 2) return 0;
    const avg = prices.reduce((a, v) => a + v, 0) / prices.length;
    const variance = prices.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / prices.length;
    return Math.sqrt(variance);
};

const calculateTrend = (prices) => {
    if (prices.length < 2) return 'neutral';
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 5) return 'strong up';
    if (change > 2) return 'up';
    if (change < -5) return 'strong down';
    if (change < -2) return 'down';
    return 'neutral';
};

const calculatePotentialProfit = (item, avgCost) => {
    if (!avgCost) return 0;
    const currentPrice = item.price;
    const basePrice = item.basePrice || 1; // Prevent division by zero
    const priceDiff = currentPrice - basePrice;
    const potentialProfit = (priceDiff / basePrice) * 100;
    return potentialProfit;
};

const getRecommendation = (volatility, trend, potentialProfit) => {
    // First check volatility risk
    if (volatility > 20) return 'High Risk';

    // Use deal tier thresholds similar to MarketGrid
    if (potentialProfit <= -30) {
        // 30% or more below base price - Strong Buy
        return 'Strong Buy';
    } else if (potentialProfit <= -15) {
        // -15% below base price - Buy
        return 'Buy';
    } else if (potentialProfit <= 1) {
        // 1% above base price - Hold
        return 'Hold';
    } else if (potentialProfit <= 5) {
        // 5% above base price - Sell
        return 'Sell';
    } else {
        return 'Strong Sell';
    }
};

const QuantumHover = (props) => {
    // Get context values first
    const marketplaceContext = useMarketplace();
    const { quantumInventory = [] } = useUI();

    // Debug log
    // console.log('QuantumHover mounted with props and context:', {
    //     props: {
    //         hasMarket: !!props.market,
    //         statusEffects: !!props.statusEffects,
    //         displayCells: props.displayCells?.length,
    //         inventory: props.inventory?.length,
    //     },
    //     context: {
    //         hasMarketplace: !!marketplaceContext,
    //         hasStatusEffects: !!marketplaceContext?.statusEffects,
    //         quantumInventory: quantumInventory.length,
    //     },
    // });

    // Destructure props with defaults
    const {
        market: MarketGrid,
        displayCells = [],
        numCellsX = 5,
        inventory = [],
        purchaseHistory = [],
        priceHistory = {},
        currentTrader = null,
        deliveryQueue = [],
        credits = 0,
        // Default handlers that do nothing
        handleBuyClick = () => {},
        handleSellClick = () => {},
        handleSellAll = () => {},
        checkQuantumTradeDelay = () => true,
        updateLastQuantumTradeTime = () => {
            console.log('updateLastQuantumTradeTime called (default no-op)');
            if (marketplaceContext?.updateLastQuantumTradeTime) {
                marketplaceContext.updateLastQuantumTradeTime();
            }
        },
        // Allow statusEffects to be overridden by props, otherwise use from context
        statusEffects = marketplaceContext?.statusEffects || {},
    } = props;

    const containerRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [quantumAnalysis, setQuantumAnalysis] = useState({});
    const hoverLag = 100;
    const hoverAreaSize = 200; // Slightly smaller for better precision
    const hoverTriggerRadius = 100;

    // Add mount/unmount logging
    useEffect(() => {
        console.log('QuantumHover mounted');
        return () => console.log('QuantumHover unmounted');
    }, []);

    // Only update status effects when quantum processor count changes
    useEffect(() => {
        const { setStatusEffects, statusEffects: contextStatusEffects } = marketplaceContext || {};
        if (!setStatusEffects) return;

        const processorCount = quantumInventory.filter(
            (item) => item === 'Quantum Processor'
        ).length;
        const currentLevel = contextStatusEffects?.['Quantum Processor']?.level || 0;

        // Only update if the count has actually changed
        if (processorCount > 0 && processorCount !== currentLevel) {
            setStatusEffects((prev) => ({
                ...prev,
                'Quantum Processor': {
                    ...prev?.['Quantum Processor'],
                    level: processorCount,
                },
            }));
        } else if (processorCount === 0 && currentLevel > 0) {
            // Only update if we need to remove the processor
            setStatusEffects((prev) => {
                const newStatusEffects = { ...prev };
                delete newStatusEffects['Quantum Processor'];
                return newStatusEffects;
            });
        }
    }, [marketplaceContext, quantumInventory]);

    const analyzeItem = useCallback(
        (item) => {
            if (!statusEffects['Quantum Processor']) return null;

            // Check if player owns this item
            const ownedQty = inventory.find((i) => i.name === item.name)?.quantity || 0;
            const isOwned = ownedQty > 0;

            const avgCost =
                purchaseHistory[item.name]?.length > 0
                    ? (
                          purchaseHistory[item.name].reduce((a, v) => a + v, 0) /
                          purchaseHistory[item.name].length
                      ).toFixed(2)
                    : item.price;

            const priceHistoryKey = `${currentTrader}-${displayCells.findIndex(
                (c) => c?.itemId === item.itemId
            )}`;
            const history = priceHistory[priceHistoryKey] || [];
            const prices = history.map((h) => h.p);

            const volatility = calculateVolatility(prices);
            const trend = calculateTrend(prices);
            const potentialProfit = calculatePotentialProfit(item, avgCost);

            // Get base recommendation
            let recommendation = getRecommendation(volatility, trend, potentialProfit);

            // Calculate actual profit
            const actualProfit = item.price - parseFloat(avgCost);
            const profitPercent = (actualProfit / parseFloat(avgCost)) * 100;

            // First handle owned items (selling logic)
            if (isOwned) {
                // Priority 1: Take profit when available
                if (actualProfit > 0) {
                    // Sell all if profit is significant
                    if (profitPercent >= 2) {
                        recommendation = 'Sell All';
                    } else {
                        recommendation = 'Sell';
                    }
                }
                // Priority 2: Strong Sell if overpriced
                else if (potentialProfit > 10) {
                    recommendation = 'Strong Sell';
                }
                // Priority 3: Sell if slightly overpriced
                else if (potentialProfit > 0) {
                    recommendation = 'Sell';
                }
                // Priority 4: Hold if underpriced
                else {
                    recommendation = 'Hold';
                }
            }
            // Then handle buying logic for items not owned
            else {
                // Priority 1: Buy if very underpriced
                if (potentialProfit <= -30) {
                    recommendation = 'Strong Buy';
                }
                // Priority 2: Buy if underpriced
                else if (potentialProfit <= -15) {
                    recommendation = 'Buy';
                }
                // Priority 3: Hold if fairly priced
                else if (potentialProfit > -15 && potentialProfit < 15) {
                    recommendation = 'Hold';
                }
            }

            return {
                itemId: item.itemId, // Add itemId to the analysis object
                volatility,
                trend,
                potentialProfit,
                avgCost: parseFloat(avgCost),
                recommendation,
                ownedQty,
                actualProfit,
            };
        },
        [statusEffects, priceHistory, currentTrader, displayCells, inventory, purchaseHistory]
    );

    // Track trade state
    const lastTradeTimeRef = useRef(0);
    const tradeCooldown = 1000; // 1 second cooldown between trades
    const lastTradeActionRef = useRef(''); // Track the last action type
    const tradeExecutedRef = useRef(false); // Track if we've executed a trade this cycle
    const marketplace = useMarketplace();

    // Handle quantum trades with delay and proper state management
    const handleQuantumTrade = useCallback(
        (item, action, quantity = 1) => {
            if (!statusEffects['Quantum Processor']) return false;

            const { traders, traderIds, currentTrader, handleBuyClick, handleSellClick } =
                marketplace;

            // Check if enough time has passed since last trade
            const now = Date.now();
            if (now - lastTradeTimeRef.current < tradeCooldown) {
                console.log('Trade on cooldown, skipping');
                return false;
            }
            // Check if we're allowed to trade via the game's trade delay system
            if (checkQuantumTradeDelay && !checkQuantumTradeDelay()) {
                console.log('Trade delay active, skipping');
                return false;
            }
            // Skip if we've already executed a trade this cycle
            if (tradeExecutedRef.current) {
                console.log('Trade already executed this cycle');
                return false;
            }
            let tradeExecuted = false;
            console.log(`Attempting ${action} on ${item.name}`);

            switch (action) {
                case 'buy':
                    if (credits >= item.price * quantity) {
                        // Find the item's index in the current trader's items
                        const traderIdx = traderIds.findIndex((tid) => tid === currentTrader);
                        const itemIndex = traders[traderIdx]?.findIndex(
                            (cell) => cell?.name === item.name
                        );

                        if (itemIndex !== -1) {
                            console.log(`Buying ${item.name} at index ${itemIndex}`);
                            tradeExecuted = handleBuyClick(itemIndex);
                            console.log('Buy attempt:', tradeExecuted ? 'success' : 'failed');
                        } else {
                            console.error('Item not found in current trader:', item.name);
                        }
                    } else {
                        console.log('Not enough credits to buy');
                    }
                    break;

                case 'sell':
                    const ownedItem = inventory.find((i) => i.name === item.name);
                    const sellQty = Math.min(quantity, ownedItem?.quantity || 0);
                    if (sellQty > 0) {
                        tradeExecuted = handleSellClick(item, sellQty);
                        console.log('Sell attempt:', tradeExecuted ? 'success' : 'failed');
                    } else {
                        console.log('No items to sell');
                    }
                    break;

                case 'sellAll':
                    if (inventory.some((i) => i.name === item.name)) {
                        handleSellAll(item.name);
                        tradeExecuted = true;
                        console.log('Sell all executed');
                    } else {
                        console.log('No items to sell all');
                    }
                    break;

                default:
                    console.warn('Unknown trade action:', action);
                    return false;
            }

            if (tradeExecuted) {
                console.log(`Trade executed: ${action} ${item.name}`);
                lastTradeTimeRef.current = now;
                lastTradeActionRef.current = action;
                tradeExecutedRef.current = true;
                updateLastQuantumTradeTime();
            }

            return tradeExecuted;
        },
        [
            statusEffects,
            checkQuantumTradeDelay,
            inventory,
            credits,
            updateLastQuantumTradeTime,
            marketplace,
            handleSellAll,
        ]
    );

    // Throttle mouse move events to improve performance
    const lastMouseMoveRef = useRef(0);
    const mouseMoveThrottle = 50; // ms between mouse move updates

    const handleMouseMove = useCallback(
        (e) => {
            const container = containerRef.current;
            if (!container) return;

            // Get mouse position relative to the container
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Throttle mouse move events
            const now = Date.now();
            if (now - lastMouseMoveRef.current < mouseMoveThrottle) {
                return; // Skip this update if we've updated too recently
            }
            lastMouseMoveRef.current = now;

            // Update mouse position and reset trade executed flag if moved significantly
            setMousePosition((prev) => {
                const dx = prev.x - x;
                const dy = prev.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 5) {
                    tradeExecutedRef.current = false;
                }
                return { x, y };
            });

            // Get all market items in the container
            const marketItems = container.querySelectorAll('.market-item');
            let closestItem = null;
            let closestDistance = hoverTriggerRadius;
            let tradeExecuted = false;

            // Find the closest market item to the cursor
            marketItems.forEach((marketItem) => {
                const itemId = marketItem.dataset.itemId;
                if (!itemId) return;

                const item = displayCells.find((c) => c?.itemId === Number(itemId));
                if (!item) return;

                // Calculate distance from cursor to item center
                const marketItemRect = marketItem.getBoundingClientRect();
                const marketItemCenterX = marketItemRect.left + marketItemRect.width / 2;
                const marketItemCenterY = marketItemRect.top + marketItemRect.height / 2;
                const distanceX = marketItemCenterX - e.clientX;
                const distanceY = marketItemCenterY - e.clientY;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                // Track the closest item within hover radius
                if (distance <= hoverTriggerRadius && distance < closestDistance) {
                    closestDistance = distance;
                    closestItem = { item, element: marketItem, distance };
                }
            });

            // If we found a close enough item, analyze it
            if (closestItem) {
                const analysis = analyzeItem(closestItem.item);
                if (analysis) {
                    // Only update if the analysis has changed significantly
                    setQuantumAnalysis((prev) => {
                        const prevAnalysis = prev[closestItem.item.itemId];
                        if (
                            !prevAnalysis ||
                            prevAnalysis.recommendation !== analysis.recommendation ||
                            Math.abs(
                                (prevAnalysis.potentialProfit || 0) -
                                    (analysis.potentialProfit || 0)
                            ) > 0.1
                        ) {
                            // Only keep the analysis for the current item
                            return { [closestItem.item.itemId]: analysis };
                        }
                        return prev;
                    });

                    // Handle trades based on recommendation
                    if (!tradeExecuted && analysis.recommendation) {
                        const { item } = closestItem;
                        const itemInInventory = inventory.some((i) => i.name === item.name);

                        if (
                            (analysis.recommendation === 'Sell All' ||
                                analysis.recommendation === 'Strong Sell') &&
                            itemInInventory
                        ) {
                            // For selling, make sure we own the item
                            tradeExecuted = handleQuantumTrade(item, 'sellAll');
                        } else if (analysis.recommendation === 'Sell' && itemInInventory) {
                            tradeExecuted = handleQuantumTrade(item, 'sell');
                        } else if (
                            analysis.recommendation === 'Strong Buy' ||
                            analysis.recommendation === 'Buy'
                        ) {
                            // For buying, make sure we don't own the item and have enough credits
                            if (!itemInInventory) {
                                console.log('Checking buy conditions for', item.name, {
                                    credits,
                                    itemPrice: item.price,
                                    canAfford: credits >= item.price,
                                    recommendation: analysis.recommendation,
                                });
                                if (credits >= item.price) {
                                    tradeExecuted = handleQuantumTrade(item, 'buy');
                                    console.log('Buy trade executed:', tradeExecuted);
                                }
                            }
                        }
                    }
                }
            } else {
                // Clear analysis when not hovering over any item
                setQuantumAnalysis({});
            }

            // Update hover effects
            requestAnimationFrame(() => {
                const marketItems = container.querySelectorAll('.market-item');
                marketItems.forEach((marketItem) => {
                    const marketItemRect = marketItem.getBoundingClientRect();
                    const marketItemCenterX = marketItemRect.left + marketItemRect.width / 2;
                    const marketItemCenterY = marketItemRect.top + marketItemRect.height / 2;
                    const distanceX = marketItemCenterX - e.clientX;
                    const distanceY = marketItemCenterY - e.clientY;
                    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                    // Apply hover state based on distance
                    if (distance <= hoverTriggerRadius) {
                        if (!marketItem.classList.contains('hovered')) {
                            marketItem.style.transition = 'all 0.3s ease';
                            marketItem.style.opacity = '1';
                            marketItem.style.transform = 'scale(1.05)';
                            marketItem.classList.add('hovered');
                        }
                    } else if (marketItem.classList.contains('hovered')) {
                        marketItem.style.transition = 'all 0.3s ease';
                        marketItem.style.opacity = '0.8';
                        marketItem.style.transform = 'scale(1)';
                        marketItem.classList.remove('hovered');
                    }
                });
            });
        },
        [analyzeItem, displayCells, handleQuantumTrade, credits, hoverTriggerRadius, inventory]
    );

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Add mousemove event listener to the container
        container.addEventListener('mousemove', handleMouseMove);

        // Cleanup function
        return () => {
            if (container) {
                container.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [handleMouseMove]);

    // Alias MarketGrid to market for backward compatibility
    const market = useMemo(() => MarketGrid, [MarketGrid]);

    // Log render with mouse position
    useEffect(() => {
        console.log('QuantumHover render:', { mousePosition });
    }, [mousePosition]);

    return (
        <div
            ref={containerRef}
            className="quantum-hover-container"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999,
                border: '2px solid red', // Debug border
                boxSizing: 'border-box',
            }}
        >
            <div
                className={`quantum-hover-overlay ${
                    (statusEffects['Quantum Processor']?.level || 0) <= 0 ? 'quantum-disabled' : ''
                }`}
                style={{
                    position: 'absolute',
                    left: `${mousePosition.x}px`,
                    top: `${mousePosition.y}px`,
                    width: `${hoverAreaSize}px`,
                    height: `${hoverAreaSize / 2}px`,
                    backgroundColor: 'rgba(0, 255, 0, 0.2)',
                    border: '2px solid rgba(0, 255, 0, 0.8)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    transform: 'translate(-50%, -50%)',
                    transition: `all ${hoverLag}ms ease-out`,
                    opacity: (statusEffects['Quantum Processor']?.level || 0) > 0 ? 0.7 : 0,
                    zIndex: 10000,
                    mixBlendMode: 'screen',
                    boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
                }}
            />
            <div
                className={`quantum-analysis-panel ${
                    (statusEffects['Quantum Processor']?.level || 0) <= 0 ? 'quantum-disabled' : ''
                }`}
            >
                {Object.entries(quantumAnalysis).length > 0 ? (
                    Object.entries(quantumAnalysis).map(([itemId, analysis]) => (
                        <div key={itemId} className="analysis-item">
                            <span className="item-name">
                                {displayCells.find((c) => c.itemId === Number(itemId))?.name}
                            </span>
                            <span
                                className={`recommendation ${analysis.recommendation.toLowerCase()}`}
                            >
                                {analysis.recommendation}
                            </span>
                            <span className="potential-profit">
                                {analysis.potentialProfit.toFixed(1)}%
                            </span>
                            {analysis.ownedQty > 0 && (
                                <span className="owned-qty">Owned: {analysis.ownedQty}</span>
                            )}
                            {analysis.actualProfit > 0 && (
                                <span className="actual-profit">
                                    Profit: +{analysis.actualProfit.toFixed(2)} credits
                                </span>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="no-analysis-message">
                        <p>
                            Quantum Processors Online:{' '}
                            {statusEffects['Quantum Processor']?.level || 0}
                        </p>
                    </div>
                )}
            </div>
            {market &&
                React.createElement(market, {
                    displayCells,
                    numCellsX,
                    statusEffects,
                    inventory,
                    purchaseHistory,
                    priceHistory,
                    currentTrader,
                    deliveryQueue,
                    handleBuyClick,
                    handleSellClick,
                    handleSellAll,
                })}
        </div>
    );
};

export default QuantumHover;
