import React, { useState, useEffect, forwardRef } from 'react';
import {
    Sparklines,
    SparklinesLine,
    SparklinesCurve,
    SparklinesNormalBand,
    SparklinesText,
    SparklinesSpots,
    SparklinesBars,
    SparklinesReferenceLine,
} from 'react-sparklines';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import TieredMenu from './../Trading/TieredMenu';
import DeliveryBar from './../Reusable/DeliveryBar';
import galaxiesData from '../../data/galaxies.json';
import itemsData from '../../data/items.json';

// Use direct paths to public folder images
const galaxyImages = {
  'galaxy1.webp': '/images/galaxy1.webp',
  'galaxy2.webp': '/images/galaxy2.webp',
  'galaxy3.webp': '/images/galaxy3.webp',
  'galaxy4.webp': '/images/galaxy4.webp',
  'galaxy5.webp': '/images/galaxy5.webp',
  'galaxy6.webp': '/images/galaxy6.webp',
  'galaxy7.webp': '/images/galaxy7.webp',
  'galaxy8.webp': '/images/galaxy8.webp',
  'galaxy9.webp': '/images/galaxy9.webp',
  'galaxy10.webp': '/images/galaxy10.webp',
  'galaxy10-war.webp': '/images/galaxy10-war.webp',
  'galaxy11.webp': '/images/galaxy11.webp',
  'galaxy11-war.webp': '/images/galaxy11-war.webp',
  'galaxy14-war.webp': '/images/galaxy14-war.webp',
  'galaxy15.webp': '/images/galaxy15.webp',
  'galaxy222.webp': '/images/galaxy222.webp',
  'galaxy-notsure.webp': '/images/galaxy-notsure.webp',
};
const itemImages = {
  'item1.webp': '/images/item1.webp',
  'item2.webp': '/images/item2.webp',
  'item3.webp': '/images/item3.webp',
  'item4.webp': '/images/item4.webp',
  'item5.webp': '/images/item5.webp',
  'item6.webp': '/images/item6.webp',
  'item7.webp': '/images/item7.webp',
  'item8.webp': '/images/item8.webp',
  'item9.webp': '/images/item9.webp',
  'item10.webp': '/images/item10.webp',
  'item11.webp': '/images/item11.webp',
  'item12.webp': '/images/item12.webp',
  'item13.webp': '/images/item13.webp',
  'item14.webp': '/images/item14.webp',
  'item15.webp': '/images/item15.webp',
  'item16.webp': '/images/item16.webp',
  'item17.webp': '/images/item17.webp',
  'item18.webp': '/images/item18.webp',
  'item19.webp': '/images/item19.webp',
  'item20.webp': '/images/item20.webp',
  'item21.webp': '/images/item21.webp',
  'item22.webp': '/images/item22.webp',
  'item23.webp': '/images/item23.webp',
  'item24.webp': '/images/item24.webp',
  'item25.webp': '/images/item25.webp',
  'item26.webp': '/images/item26.webp',
  'item27.webp': '/images/item27.webp',
  'item28.webp': '/images/item28.webp',
  'item29.webp': '/images/item29.webp',
  'item30.webp': '/images/item30.webp',
  'item31.webp': '/images/item31.webp',
  'item32.webp': '/images/item32.webp',
  'item33.webp': '/images/item33.webp',
  'item34.webp': '/images/item34.webp',
  'item35.webp': '/images/item35.webp',
  'item36.webp': '/images/item36.webp',
};

// Helper function to get image URL
const getImageUrl = (imageMap, filename) => {
    return imageMap[filename] || null;
};

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
    const { improvedAILevel } = useAILevel();

    const [noticeMap, setNoticeMap] = useState({});
    const [bgImage, setBgImage] = useState(null);

    const showNotice = (idx, type, message) => {
        const level =
            improvedAILevel < 50
                ? 'none'
                : improvedAILevel < 75
                ? 'medium'
                : improvedAILevel < 100
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
        const filename = `galaxy${galaxyId}${war ? '-war' : ''}.webp`;
        imgSrc = getImageUrl(galaxyImages, filename);

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
                    const basePrice =
                        itemsData.items.find((item) => item.itemId === cell.itemId)?.basePrice ||
                        cell.basePrice;
                    const currentPrice = cell.price;

                    // Simple strategy recommendation based purely on price vs base price
                    let strategy = 'hold';
                    if (currentPrice < basePrice) {
                        strategy = 'buy';
                    } else if (currentPrice > basePrice) {
                        strategy = 'sell';
                    }

                    const showStrategy = improvedAILevel >= 500; // Show strategy for players who can understand market analysis

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
                        prices.length > 1 && improvedAILevel >= 5
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

                    // For AI levels below 5, show unknown
                    if (improvedAILevel < 5) {
                        dealTier = 'unknown';
                    }

                    // For AI levels 5-49, show deal tier label without color
                    // For level 50+, add the cell-- prefix for colored backgrounds
                    const dealClass =
                        improvedAILevel >= 5
                            ? improvedAILevel >= 50
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
                                improvedAILevel >= 5 && improvedAILevel < 50
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
                            <span className="owned">Owned: {ownedQty}</span>
                            {/* Item image as background with name overlay */}
                            <div className="item-image-wrapper">
                                <span className="item-image-name">{cell.name}</span>
                                <div
                                    className="item-image-bg"
                                    style={(() => {
                                        const filename = `item${cell.itemId}.webp`;
                                        const imgUrl = getImageUrl(itemImages, filename);
                                        return imgUrl
                                            ? { backgroundImage: `url(${imgUrl})` }
                                            : {};
                                    })()}
                                />
                            </div>
                            <div className="price-row">
                                <p className={priceTextClass}>
                                    Price: {displayPrice}
                                    {improvedAILevel >= 75 && avgCost ? ` (Avg: ${avgCost})` : ''}
                                </p>
                                {improvedAILevel >= 5 && improvedAILevel < 50 && (
                                    <span className="deal-tier-label">{dealTier}</span>
                                )}
                            </div>

                            {showStrategy && (
                                <>
                                    <p>Fair Price: {cell.basePrice}</p>
                                    <p>
                                        Strategy:{' '}
                                        {strategy === 'buy' ? (
                                            <span className="buy">BUY</span>
                                        ) : strategy === 'sell' ? (
                                            <span className="sell">SELL</span>
                                        ) : (
                                            <span className="hold">HOLD</span>
                                        )}
                                    </p>
                                </>
                            )}

                            {/* inline price history sparkline, only if advanced AI and valid price data */}
                            {improvedAILevel >= 100 &&
                                prices.length >= 1 &&
                                (() => {
                                    const basePrice =
                                        itemsData.items.find((item) => item.itemId === cell.itemId)
                                            ?.basePrice || cell.basePrice;
                                    const currentPrice = cell.price;
                                    const isAboveBase = currentPrice > basePrice;
                                    const isBelowBase = currentPrice < basePrice;

                                    // Red when above base price, Green when below base price
                                    const lineColor = isAboveBase
                                        ? '#ff0000'
                                        : isBelowBase
                                        ? '#00ff00'
                                        : '#0000ff';

                                    // Calculate base price position relative to current data range
                                    const dataMin = Math.min(...prices);
                                    const dataMax = Math.max(...prices);

                                    const halfBase = basePrice / 2;
                                    const doubleBase = basePrice * 2;

                                    // If base price is outside current data range, show it at the edge
                                    let referenceValue = basePrice;

                                    if (basePrice < dataMin) {
                                        referenceValue = dataMin;
                                    } else if (basePrice > dataMax) {
                                        referenceValue = dataMax;
                                    }

                                    return (
                                        <div
                                            className="price-sparkline"
                                            style={{
                                                backgroundColor: '#222',
                                                padding: '2px',
                                                borderRadius: '3px',
                                            }}
                                        >
                                            <Sparklines data={prices} width={200} height={60}>
                                                <SparklinesCurve
                                                    color={lineColor}
                                                    style={{ fill: 'none', strokeWidth: 1 }}
                                                />
                                                <SparklinesReferenceLine
                                                    value={referenceValue}
                                                    style={{
                                                        stroke: lineColor,
                                                        strokeWidth: 2,
                                                        strokeDasharray: '5, 5',
                                                    }}
                                                />
                                            </Sparklines>

                                            {/* Base price indicator when outside visible range */}

                                            {currentPrice > doubleBase && (
                                                <span className="overvalued">Overvalued</span>
                                            )}
                                            {currentPrice < halfBase && (
                                                <span className="undervalued">Undervalued</span>
                                            )}
                                        </div>
                                    );
                                })()}
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
