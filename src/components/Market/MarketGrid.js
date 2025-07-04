import React, { useState, useEffect, forwardRef } from 'react';
import { Sparklines, SparklinesLine, SparklinesReferenceLine } from 'react-sparklines';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import TieredMenu from './../Trading/TieredMenu';
import DeliveryBar from './../Reusable/DeliveryBar';
import galaxiesData from '../../data/galaxies.json';

// Dynamic import of galaxy images
const galaxyImages = require.context('../../images', false, /^\.\/galaxy\d+(-war)?\.webp$/);
const itemImages = require.context('../../images', false, /^\.\/item\d+\.webp$/);

const MarketGrid = forwardRef((props, ref) => {
    const {
        displayCells = [],
        statusEffects = {},
        inventory = [],
        purchaseHistory = {},
        priceHistory = {},
        currentTrader = '',
        deliveryQueue = [],
        handleBuyClick = () => {},
        handleSellClick = () => {},
    } = props || {};
    const { credits, galaxyName, inTravel } = useMarketplace();
    const { improvedUILevel } = useUI();

    const [noticeMap, setNoticeMap] = useState({});
    const [bgImage, setBgImage] = useState(null);

    const showNotice = (idx, type, message) => {
        const level =
            improvedUILevel < 50
                ? 'none'
                : improvedUILevel < 75
                ? 'medium'
                : improvedUILevel < 100
                ? 'high'
                : 'elite';
        if (level === 'none') return;
        setNoticeMap((m) => ({ ...m, [idx]: { type, message, level } }));
        const timeout = level === 'elite' ? 1500 : level === 'high' ? 1000 : 500;
        setTimeout(
            () =>
                setNoticeMap((m) => {
                    const c = { ...m };
                    delete c[idx];
                    return c;
                }),
            timeout
        );
    };

    useEffect(() => {
        // get galaxy id and war flag
        const info = galaxiesData.galaxies.find((g) => g.name === galaxyName) || {};
        const { galaxyId, war = false } = info;
        let imgSrc = null;
        const key = `./galaxy${galaxyId}${war ? '-war' : ''}.webp`;
        if (galaxyImages.keys().includes(key)) imgSrc = galaxyImages(key);

        setBgImage(imgSrc);
    }, [galaxyName]);

    return (
        <div
            ref={ref}
            className="grid"
            style={{
                backgroundImage: bgImage ? `url(${bgImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'bottom right',
            }}
        >
            <TieredMenu />

            {displayCells &&
                displayCells.map((cell, idx) => {
                    if (!cell) return null;
                    const ownedQty = inventory.find((i) => i.name === cell.name)?.quantity || 0;
                    const history = priceHistory[`${currentTrader}-${idx}`] || [];
                    const recommended = cell.basePrice > cell.price ? 'buy' : 'sell';
                    const showStrategy =
                        improvedUILevel >= 500 &&
                        !(recommended === 'buy' && credits < cell.price) &&
                        !(recommended === 'sell' && improvedUILevel >= 1000 && ownedQty === 0);

                    const quantumClass =
                        statusEffects['Quantum Processor'] &&
                        inventory.some((i) => i.name === cell.name)
                            ? cell.price <
                              (purchaseHistory[cell.name] || []).reduce((a, v) => a + v, 0) /
                                  ((purchaseHistory[cell.name] || []).length || 1)
                                ? 'quantum-good'
                                : 'quantum-bad'
                            : '';
                    const prices = history
                        .map((h) => (typeof h.p === 'number' && !isNaN(h.p) ? h.p : null))
                        .filter((p) => p !== null);
                    const trendClass =
                        prices.length > 1 && improvedUILevel >= 5
                            ? prices[prices.length - 1] >= prices[0]
                                ? 'cell--up'
                                : 'cell--down'
                            : '';
                    const soldOut = cell.stock === 0;
                    const soldOutClass = soldOut ? 'cell--soldout' : '';
                    const diff = cell.price - cell.basePrice;
                    const percentDiff = cell.basePrice === 0 ? 0 : diff / cell.basePrice;
                    let dealTier = 'normal';

                    // Determine deal tier based on price difference
                    if (percentDiff <= -0.3) {
                        dealTier = 'cheap'; // 30% or more below base
                    } else if (percentDiff <= -0.15) {
                        dealTier = 'deal'; // 15-30% below base
                    } else if (percentDiff <= 0.1) {
                        dealTier = 'normal'; // within 10% of base
                    } else if (percentDiff <= 0.15) {
                        dealTier = 'expensive'; // 10-15% above base
                    } else {
                        dealTier = 'avoid'; // more than 15% above base
                    }

                    // For UI levels below 5, show unknown
                    if (improvedUILevel < 5) {
                        dealTier = 'unknown';
                    }

                    // For UI levels 5-49, show deal tier label without color
                    // For level 50+, add the cell-- prefix for colored backgrounds
                    const dealClass =
                        improvedUILevel >= 5
                            ? improvedUILevel >= 50
                                ? `cell--${dealTier}`
                                : `deal-tier-${dealTier}`
                            : '';
                    // classify price relative to base for dynamic styling
                    const priceTrend = cell.price > cell.basePrice ? 'high' : 'low';
                    const cellPriceClass = `cell--price-${priceTrend}`;
                    const priceTextClass = `price-text price-${priceTrend}`;
                    // average purchase cost
                    const avgCost = purchaseHistory[cell.name]
                        ? (
                              purchaseHistory[cell.name].reduce((a, v) => a + v, 0) /
                              purchaseHistory[cell.name].length
                          ).toFixed(2)
                        : null;
                    const displayPrice = cell.price;
                    return (
                        <div
                            key={idx}
                            className={`cell market-item ${cellPriceClass} ${quantumClass} ${trendClass} ${soldOutClass} ${dealClass} ${
                                improvedUILevel >= 5 && improvedUILevel < 50
                                    ? `deal-tier-${dealTier}`
                                    : ''
                            }`}
                            data-item-id={cell.itemId}
                            onClick={() => {
                                if (soldOut) {
                                    showNotice(idx, 'buy', 'Out of stock');
                                } else if (credits < displayPrice) {
                                    showNotice(idx, 'buy', 'Insufficient credits');
                                } else if (!inTravel || statusEffects.tool_receiver?.active) {
                                    handleBuyClick(cell); // Pass the cell object instead of just the name
                                } else {
                                    showNotice(
                                        idx,
                                        'buy',
                                        'Requires Particle Beam Receiver to buy during travel'
                                    );
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                if (ownedQty === 0) {
                                    showNotice(idx, 'sell', 'Nothing to sell');
                                } else if (!inTravel || statusEffects.tool_reverter?.active) {
                                    handleSellClick(cell); // Pass the cell object instead of just the name
                                } else {
                                    showNotice(
                                        idx,
                                        'sell',
                                        'Requires Particle Beam Reverter to sell during travel'
                                    );
                                }
                            }}
                            style={{ cursor: soldOut ? 'not-allowed' : 'pointer' }}
                        >
                            <span className={`owned ${ownedQty > 0 ? 'sell' : ''}`}>
                                Owned: {ownedQty}
                            </span>
                            {/* Item image as background with name overlay */}
                            <div className="item-image-wrapper">
                                <span className="item-image-name">{cell.name}</span>
                                <div
                                    className="item-image-bg"
                                    style={(() => {
                                        const key = `./item${cell.itemId}.webp`;
                                        return itemImages.keys().includes(key)
                                            ? { backgroundImage: `url(${itemImages(key)})` }
                                            : {};
                                    })()}
                                />
                            </div>
                            <div className="price-row">
                                <p className={priceTextClass}>
                                    Price: {displayPrice}
                                    {improvedUILevel >= 75 && avgCost ? ` (Avg: ${avgCost})` : ''}
                                </p>
                                {improvedUILevel >= 5 && improvedUILevel < 50 && (
                                    <span className="deal-tier-label">{dealTier}</span>
                                )}
                            </div>

                            {showStrategy && (
                                <>
                                    <p>Fair Price: {cell.basePrice}</p>
                                    <p>
                                        Strategy:{' '}
                                        {recommended === 'buy' ? (
                                            <span className="buy">BUY</span>
                                        ) : (
                                            <span className="sell">SELL</span>
                                        )}
                                    </p>
                                </>
                            )}

                            {/* inline price history sparkline, only if advanced UI and valid price data */}
                            {improvedUILevel > 50 && prices.length > 1 && (
                                <div className="price-sparkline">
                                    <Sparklines
                                        data={prices}
                                        width={100}
                                        height={20}
                                        min={Math.min(...prices) * 0.95} // Add 5% padding
                                        max={Math.max(...prices) * 1.05} // Add 5% padding
                                    >
                                        <SparklinesLine
                                            color="cyan"
                                            style={{ fill: 'none', strokeWidth: 1 }}
                                        />
                                        {improvedUILevel >= 75 && (
                                            <SparklinesReferenceLine
                                                type="avg"
                                                style={{
                                                    stroke: 'yellow',
                                                    strokeWidth: 1,
                                                    strokeDasharray: '2, 2',
                                                }}
                                            />
                                        )}
                                    </Sparklines>
                                </div>
                            )}
                            {/* delivery timers under price chart */}
                            {deliveryQueue &&
                                deliveryQueue
                                    .filter((q) => q && q.name === cell.name)
                                    .map((q, index) => (
                                        <DeliveryBar
                                            key={`${q.id}-${index}`}
                                            timeLeft={q.timeLeft}
                                            totalTime={q.totalTime}
                                        />
                                    ))}

                            {cell.illegal && <span className="illegal-item"></span>}

                            <p>
                                Stock:{' '}
                                {cell.stock > 0 ? (
                                    cell.stock
                                ) : (
                                    <span className="sold-out">SOLD OUT</span>
                                )}
                            </p>

                            {noticeMap[idx] && (
                                <div
                                    className={`cell-notice cell-notice--${noticeMap[idx].type} cell-notice--${noticeMap[idx].level}`}
                                    style={{
                                        animationDuration: `${
                                            noticeMap[idx].level === 'elite'
                                                ? '1.5s'
                                                : noticeMap[idx].level === 'high'
                                                ? '1s'
                                                : '0.5s'
                                        }`,
                                    }}
                                >
                                    {noticeMap[idx].message}
                                </div>
                            )}
                        </div>
                    );
                })}
        </div>
    );
});

MarketGrid.displayName = 'MarketGrid';

export default MarketGrid;
