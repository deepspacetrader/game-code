import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
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

    // Destructure props with defaults
    const {
        displayCells = [],
        inventory = [],
        purchaseHistory = [],
        priceHistory = {},
        currentTrader = null,
        handleSellAll = () => {},
        checkQuantumTradeDelay = () => true,
        updateLastQuantumTradeTime = () => {
            if (marketplaceContext?.updateLastQuantumTradeTime) {
                marketplaceContext.updateLastQuantumTradeTime();
            }
        },
    } = props;

    // Get credits directly from context to ensure it's always up to date
    const credits = marketplaceContext?.credits || 0;

    const containerRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [quantumAnalysis, setQuantumAnalysis] = useState({});

    // --- Hover box sizing ---
    const [hoverBox, setHoverBox] = useState({ width: 100, height: 100 });

    // Dynamically size the hover box to fit 2 items
    useEffect(() => {
        const updateHoverBox = () => {
            // Try to find a .market-item to measure
            const marketItem = document.querySelector('.market-item');
            if (marketItem) {
                const rect = marketItem.getBoundingClientRect();
                // Box should fit 2 items horizontally or vertically
                setHoverBox({
                    width: rect.width * 2 + 8, // 8px gap for margin
                    height: rect.height + 4, // 4px gap for margin
                });
            }
        };
        updateHoverBox();
        window.addEventListener('resize', updateHoverBox);
        return () => window.removeEventListener('resize', updateHoverBox);
    }, []);

    const analyzeItem = useCallback(
        (item) => {
            // Check if quantum hover is active (quantum power + quantum inventory)
            if (!props.quantumPower || !props.quantumInventory?.includes('QuantumHover')) {
                console.log('Quantum hover not active:', {
                    quantumPower: props.quantumPower,
                    hasQuantumHover: props.quantumInventory?.includes('QuantumHover'),
                });
                return null;
            }

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

            const result = {
                itemId: item.itemId,
                volatility,
                trend,
                potentialProfit,
                avgCost: parseFloat(avgCost),
                recommendation,
                ownedQty,
                actualProfit,
            };
            return result;
        },
        [
            props.quantumPower,
            props.quantumInventory,
            priceHistory,
            currentTrader,
            displayCells,
            inventory,
            purchaseHistory,
        ]
    );

    // Track trade state
    const lastTradeTimeRef = useRef(0);
    const tradeCooldown = 1000; // 1 second cooldown between trades
    const tradeExecutedRef = useRef(false); // Track if we've executed a trade this cycle
    const marketplace = useMarketplace();

    // Handle quantum trades with delay and proper state management
    const handleQuantumTrade = useCallback(
        (item, action, quantity = 1) => {
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
                    console.log(
                        `Buy attempt for ${item.name}: credits=${credits}, price=${item.price}, quantity=${quantity}`
                    );
                    if (credits >= item.price * quantity) {
                        // Find the item's index in the displayCells (processed trader items)
                        const itemIndex = displayCells.findIndex(
                            (cell) => cell?.itemId === item.itemId
                        );

                        console.log(
                            `Found item ${item.name} at index ${itemIndex} in displayCells`
                        );
                        if (itemIndex !== -1) {
                            console.log(`Buying ${item.name} at index ${itemIndex}`);
                            tradeExecuted = handleBuyClick(itemIndex);
                            console.log('Buy attempt:', tradeExecuted ? 'success' : 'failed');
                        } else {
                            console.error('Item not found in displayCells:', item.name);
                            console.log(
                                'Available items in displayCells:',
                                displayCells.map((c) => ({ name: c?.name, itemId: c?.itemId }))
                            );
                        }
                    } else {
                        console.log(
                            `Not enough credits to buy: need ${
                                item.price * quantity
                            }, have ${credits}`
                        );
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
                tradeExecutedRef.current = true;
                updateLastQuantumTradeTime();
            }

            return tradeExecuted;
        },
        [
            checkQuantumTradeDelay,
            inventory,
            credits,
            updateLastQuantumTradeTime,
            marketplace,
            handleSellAll,
            displayCells,
        ]
    );

    // Throttle mouse move events to improve performance
    const lastMouseMoveRef = useRef(0);
    const mouseMoveThrottle = 50; // ms between mouse move updates

    const handleMouseMove = useCallback(
        (e) => {
            const container = containerRef.current;
            if (!container) return;

            // Get mouse position relative to the QuantumHover container
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Throttle mouse move events
            const now = Date.now();
            if (now - lastMouseMoveRef.current < mouseMoveThrottle) {
                return;
            }
            lastMouseMoveRef.current = now;

            setMousePosition({ x, y });

            // Get all market items in the parent container (market grid)
            const marketItems = container.parentElement?.querySelectorAll('.market-item') || [];
            const hoveredItems = [];
            // Calculate hover box bounds
            const boxLeft = e.clientX - hoverBox.width / 2;
            const boxRight = e.clientX + hoverBox.width / 2;
            const boxTop = e.clientY - hoverBox.height / 2;
            const boxBottom = e.clientY + hoverBox.height / 2;

            marketItems.forEach((marketItem) => {
                const itemRect = marketItem.getBoundingClientRect();
                const itemCenterX = itemRect.left + itemRect.width / 2;
                const itemCenterY = itemRect.top + itemRect.height / 2;
                if (
                    itemCenterX >= boxLeft &&
                    itemCenterX <= boxRight &&
                    itemCenterY >= boxTop &&
                    itemCenterY <= boxBottom
                ) {
                    const itemId = marketItem.dataset.itemId;
                    const item = displayCells.find((c) => c?.itemId === Number(itemId));
                    if (item) {
                        hoveredItems.push(item);
                    }
                }
            });

            // Only keep up to 2 items
            const itemsToAnalyze = hoveredItems.slice(0, 2);

            const newAnalysis = {};
            itemsToAnalyze.forEach((item) => {
                const analysis = analyzeItem(item);
                if (analysis) {
                    newAnalysis[item.itemId] = analysis;
                    // Auto-trade logic only if quantum hover is active
                    if (props.quantumPower && props.quantumInventory?.includes('QuantumHover')) {
                        const itemInInventory = inventory.some((i) => i.name === item.name);

                        if (
                            (analysis.recommendation === 'Sell All' ||
                                analysis.recommendation === 'Strong Sell') &&
                            itemInInventory
                        ) {
                            handleQuantumTrade(item, 'sellAll');
                        } else if (analysis.recommendation === 'Sell' && itemInInventory) {
                            handleQuantumTrade(item, 'sell');
                        } else if (
                            (analysis.recommendation === 'Strong Buy' ||
                                analysis.recommendation === 'Buy') &&
                            !itemInInventory &&
                            credits >= item.price
                        ) {
                            handleQuantumTrade(item, 'buy');
                        }
                    }
                }
            });
            setQuantumAnalysis(newAnalysis);
            tradeExecutedRef.current = false;
        },
        [
            analyzeItem,
            displayCells,
            handleQuantumTrade,
            credits,
            hoverBox,
            inventory,
            props.quantumPower,
            props.quantumInventory,
        ]
    );

    // Mouse event handlers for React
    const handleMouseEnter = useCallback(() => setIsMouseInMarket(true), []);
    const handleMouseLeave = useCallback(() => setIsMouseInMarket(false), []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Find the market grid container to attach events to
        const marketGridContainer = container.parentElement;
        if (!marketGridContainer) return;

        // Add mousemove event listener to the market grid container
        marketGridContainer.addEventListener('mousemove', handleMouseMove, { passive: true });
        marketGridContainer.addEventListener('mouseenter', handleMouseEnter, { passive: true });
        marketGridContainer.addEventListener('mouseleave', handleMouseLeave, { passive: true });

        // Cleanup function
        return () => {
            if (marketGridContainer) {
                marketGridContainer.removeEventListener('mousemove', handleMouseMove);
                marketGridContainer.removeEventListener('mouseenter', handleMouseEnter);
                marketGridContainer.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, [handleMouseMove, handleMouseEnter, handleMouseLeave]);

    // Track if mouse is inside the market area
    const [isMouseInMarket, setIsMouseInMarket] = useState(false);
    // For lag effect
    const [laggedMouse, setLaggedMouse] = useState({ x: 0, y: 0 });

    // Animate lagged mouse position
    useEffect(() => {
        if (!isMouseInMarket) return;
        const lag = 0.18;
        let frame;
        function animate() {
            setLaggedMouse((prev) => ({
                x: prev.x + (mousePosition.x - prev.x) * lag,
                y: prev.y + (mousePosition.y - prev.y) * lag,
            }));
            frame = requestAnimationFrame(animate);
        }
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [mousePosition, isMouseInMarket]);

    // Determine if quantum hover is enabled
    const isQuantumHoverActive =
        props.quantumPower && props.quantumInventory?.includes('QuantumHover');

    return (
        <div
            ref={containerRef}
            className="quantum-hover-container"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                zIndex: 9999,
                pointerEvents: 'none', // allow clicks to pass through
            }}
        >
            {isMouseInMarket && isQuantumHoverActive && (
                <div
                    className="quantum-hover-overlay"
                    style={{
                        left: `${laggedMouse.x}px`,
                        top: `${laggedMouse.y}px`,
                        width: `${hoverBox.width}px`,
                        height: `${hoverBox.height}px`,
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0,255,0,0.35)',
                        border: '2px solid #00ff00',
                        boxShadow: '0 0 24px 6px #00ff00',
                    }}
                />
            )}
            {/* Only show analysis panel if quantum hover is active */}
            {isMouseInMarket && isQuantumHoverActive && (
                <div className="quantum-analysis-panel">
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
                            <p>Quantum Hover Active: {props.quantumPower ? 'Yes' : 'No'}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuantumHover;
