import { useEffect, useRef, useState } from 'react';
import './QuantumScan.scss';
import { createPortal } from 'react-dom';
import { useMarketplace } from '../../context/MarketplaceContext';

// Map scan slot names to directions
const DIRECTION_MAP = {
    QuantumScanLR: 'left-to-right',
    QuantumScanRL: 'right-to-left',
    QuantumScanTB: 'top-to-bottom',
    QuantumScanBT: 'bottom-to-top',
};

// Helper: dealTier logic from MarketGrid.js
function getDealTier(cell) {
    if (!cell || typeof cell.price !== 'number' || typeof cell.basePrice !== 'number')
        return 'unknown';
    const diff = cell.price - cell.basePrice;
    const percentDiff = cell.basePrice === 0 ? 0 : diff / cell.basePrice;
    if (percentDiff <= -0.3) return 'cheap';
    if (percentDiff <= -0.15) return 'deal';
    if (percentDiff <= 0.1) return 'normal';
    if (percentDiff <= 0.15) return 'expensive';
    return 'avoid';
}

const QuantumScan = ({
    marketRef,
    quantumPower,
    quantumInventory = [],
    displayCells = [],
    inventory = [],
    handleBuyClick,
    handleSellAll,
}) => {
    // Track scanline state for each direction
    const [activeScans, setActiveScans] = useState([]); // [{direction, key, running, progress}]
    const scanTimers = useRef({});
    const scanIntervals = useRef({});
    const scanTimeouts = useRef({});
    const tradingLock = useRef(false);

    // Get enabled scan directions from quantumInventory
    const scanDirections = quantumInventory
        .filter((q) => DIRECTION_MAP[q])
        .map((q) => DIRECTION_MAP[q]);

    const marketplace = useMarketplace();
    const { canQuantumBuy, canQuantumSell, inTravel, isJumping, purchaseHistory, credits } =
        marketplace;

    const displayCellsRef = useRef(displayCells);
    const inventoryRef = useRef(inventory);
    const creditsRef = useRef(credits);
    const purchaseHistoryRef = useRef(purchaseHistory);

    // Always update refs on every render to avoid stale data
    displayCellsRef.current = displayCells;
    inventoryRef.current = inventory;
    creditsRef.current = credits;
    purchaseHistoryRef.current = purchaseHistory;

    // Add a hash of the key data to force effect rerun
    const scanDataHash = JSON.stringify({
        displayCells: displayCells.map((c) => c && c.name),
        inventory: inventory.map((i) => ({ name: i.name, quantity: i.quantity })),
        credits,
        purchaseHistory: Object.keys(purchaseHistory).reduce((acc, k) => {
            acc[k] = purchaseHistory[k].length;
            return acc;
        }, {}),
    });

    // Helper: Run scan logic for a direction
    const runScan = (direction) => {
        if (tradingLock.current) return;
        tradingLock.current = true;
        // Debug: Log scan state at start of scan
        const inventoryWithAvg = inventoryRef.current.map((item) => {
            const history = purchaseHistoryRef.current?.[item.name] || [];
            const avgPurchase =
                history.length > 0
                    ? (history.reduce((a, b) => a + b, 0) / history.length).toFixed(2)
                    : null;
            return { ...item, avgPurchase };
        });

        // 1. Animate scanline
        setActiveScans((prev) => [
            ...prev.filter((s) => s.direction !== direction),
            { direction, key: `${direction}-${Date.now()}`, running: true },
        ]);

        setTimeout(() => {
            if (!canQuantumSell) {
                tradingLock.current = false;
                return;
            }
            let didSell = false;
            const invMap = Object.fromEntries(
                inventoryRef.current.map((i) => [i.name, i.quantity])
            );
            // Sell if profit can be made (current price > average purchase price)
            const sellCandidates = displayCellsRef.current
                .map((cell) => {
                    const history = purchaseHistoryRef.current?.[cell.name] || [];
                    const avgPurchase =
                        history.length > 0
                            ? history.reduce((a, b) => a + b, 0) / history.length
                            : 0;
                    return { ...cell, avgPurchase };
                })
                .filter(
                    (cell) =>
                        invMap[cell.name] > 0 && cell.price > 0 && cell.price > cell.avgPurchase // sell if profit
                )
                .sort((a, b) => b.price - a.price); // Most profitable first
            const soldNames = new Set();
            sellCandidates.forEach((cell) => {
                if (typeof handleSellAll === 'function') {
                    const invItem = inventoryRef.current.find((i) => i.name === cell.name);
                    if (invItem && invItem.quantity > 0) {
                        didSell = true;
                        soldNames.add(cell.name);
                        handleSellAll(cell.name);
                    }
                }
            });
            if (didSell && typeof window !== 'undefined' && window.zzfx) {
                window.zzfx(
                    0.05,
                    60,
                    0,
                    0,
                    0.02,
                    0.23,
                    4,
                    1.6,
                    0,
                    4,
                    0,
                    0,
                    0,
                    0,
                    19,
                    0,
                    0.41,
                    0.96,
                    0.18,
                    0,
                    235
                );
            }

            // If we sold anything, skip buying in this scan
            if (didSell) {
                tradingLock.current = false;
                return;
            }

            if (!canQuantumBuy) {
                tradingLock.current = false;
                return;
            }
            let creditsLeft = creditsRef.current;
            let didBuy = false;
            const buyCandidates = displayCellsRef.current
                .map((cell, idx) => ({ ...cell, idx, dealTier: getDealTier(cell) }))
                .filter(
                    (cell) =>
                        (cell.dealTier === 'cheap' || cell.dealTier === 'deal') &&
                        cell.stock > 0 &&
                        !soldNames.has(cell.name) // Don't buy what was just sold
                )
                .sort((a, b) => {
                    const priceDiffA =
                        a.basePrice === 0 ? 0 : (a.basePrice - a.price) / a.basePrice;
                    const priceDiffB =
                        b.basePrice === 0 ? 0 : (b.basePrice - b.price) / b.basePrice;
                    if (b.price !== a.price) return b.price - a.price;
                    return priceDiffB - priceDiffA;
                });
            for (const cell of buyCandidates) {
                if (typeof handleBuyClick === 'function') {
                    if (creditsLeft >= cell.price) {
                        const result = handleBuyClick(cell);
                        if (result) {
                            creditsLeft -= cell.price;
                            didBuy = true;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }
            if (didBuy && typeof window !== 'undefined' && window.zzfx) {
                window.zzfx(
                    1,
                    69,
                    13.37,
                    0.02,
                    0,
                    0.01,
                    0,
                    1.25,
                    1,
                    0,
                    475,
                    0.01,
                    1,
                    0.5,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0
                );
            }
            tradingLock.current = false;
        }, 200);

        // 3. Remove scanline after 1s
        scanTimeouts.current[direction] = setTimeout(() => {
            setActiveScans((prev) => prev.filter((s) => s.direction !== direction));
        }, 1000);
    };

    // Get grid dimensions for scanline overlay
    const [gridRect, setGridRect] = useState(null);
    const [gridContainer, setGridContainer] = useState(null);
    useEffect(() => {
        if (marketRef?.current) {
            const rect = marketRef.current.getBoundingClientRect();
            setGridRect({
                width: rect.width,
                height: rect.height,
            });
            setGridContainer(marketRef.current);
        }
    }, [marketRef]);

    // Set up scan intervals for each direction (now depends on gridRect)
    useEffect(() => {
        // Cleanup all intervals/timeouts first
        Object.values(scanIntervals.current).forEach(clearInterval);
        Object.values(scanTimeouts.current).forEach(clearTimeout);
        scanIntervals.current = {};
        scanTimeouts.current = {};
        scanTimers.current = {};
        setActiveScans([]);

        if (!quantumPower || !gridRect || scanDirections.length === 0) {
            return;
        }

        // For each direction, set up a scan interval with a random offset
        scanDirections.forEach((direction) => {
            // Random offset between 0.25s and 0.75s
            const offset = 250 + Math.random() * 500;
            // Start first scan after offset
            scanTimers.current[direction] = setTimeout(() => {
                runScan(direction);
                // Then repeat every 4s
                scanIntervals.current[direction] = setInterval(() => {
                    runScan(direction);
                }, 4000);
            }, offset);
        });

        // Cleanup on unmount or power off
        return () => {
            Object.values(scanIntervals.current).forEach(clearInterval);
            Object.values(scanTimeouts.current).forEach(clearTimeout);
            Object.values(scanTimers.current).forEach(clearTimeout);
            scanIntervals.current = {};
            scanTimeouts.current = {};
            scanTimers.current = {};
            setActiveScans([]);
        };
        // eslint-disable-next-line
    }, [quantumPower, gridRect, scanDirections.join(), scanDataHash]);

    // Render scanline overlays
    const overlays = (
        <>
            {quantumPower &&
                gridRect &&
                activeScans.map((scan) => {
                    // Animate scanline in the correct direction
                    const style = (() => {
                        const base = {
                            position: 'absolute',
                            pointerEvents: 'none',
                            zIndex: 1000,
                            width: gridRect.width,
                            height: gridRect.height,
                            top: 0,
                            left: 0,
                        };
                        switch (scan.direction) {
                            case 'left-to-right':
                                return {
                                    ...base,
                                    borderLeft: '4px solid #00ff80',
                                    width: '4px',
                                    height: gridRect.height,
                                    left: 0,
                                    top: 0,
                                    animation: 'scan-lr 1s linear',
                                };
                            case 'right-to-left':
                                return {
                                    ...base,
                                    borderRight: '4px solid #ff6b6b',
                                    width: '4px',
                                    height: gridRect.height,
                                    left: gridRect.width - 4,
                                    top: 0,
                                    animation: 'scan-rl 1s linear',
                                };
                            case 'top-to-bottom':
                                return {
                                    ...base,
                                    borderTop: '4px solid #4cc9f0',
                                    width: gridRect.width,
                                    height: '4px',
                                    left: 0,
                                    top: 0,
                                    animation: 'scan-tb 1s linear',
                                };
                            case 'bottom-to-top':
                                return {
                                    ...base,
                                    borderBottom: '4px solid #f72585',
                                    width: gridRect.width,
                                    height: '4px',
                                    left: 0,
                                    top: gridRect.height - 4,
                                    animation: 'scan-bt 1s linear',
                                };
                            default:
                                return base;
                        }
                    })();
                    // Add direction as data attribute for styling
                    return (
                        <div
                            key={scan.key}
                            className={`scan-overlay scanning`}
                            data-direction={scan.direction}
                            style={style}
                        />
                    );
                })}
        </>
    );
    return gridContainer ? createPortal(overlays, gridContainer) : null;
};

export default QuantumScan;
