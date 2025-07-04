import React, { useState, useRef, useEffect } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import galaxiesData from '../../data/galaxies.json';
import StarMapMid from '../Travel/StarMaps/StarMapMid';
import StarMapHigh from '../Travel/StarMaps/StarMapHigh';
// import StarMapLow from '../Travel/StarMaps/StarMapLow';
import SignalAnimation from '../Travel/SignalAnimation';
import TraderInfo from './TraderInfo';
import './TraderNav.scss';
import TraderMessage from './TraderMessage';
import tradersData from '../../data/traders.json';
import FloatingMessage from '../Reusable/FloatingMessage';
import TravelOverlay from '../Travel/TravelOverlay';
import { zzfx } from 'zzfx';

const traderImages = require.context('../../images', false, /\.\/trader\d+\.webp$/);

const TraderNav = () => {
    const traderNavRef = useRef(null);

    const {
        buyFuel,
        credits,
        fuel,
        fuelPrices,
        handlePrevTrader,
        handleNextTrader,
        travelToGalaxy,
        traderNames,
        galaxyName,
        traderIds,
        currentTrader,
        traderMessage,
        traderMessages,
        statusEffects,
        nextGalaxyName,
        nextGalaxyWar,
        shieldActive,
        stealthActive,
        toggleShield,
        toggleStealth,
        inventory,
        inTravel,
        travelTimeLeft,
        fuelCostReductions,
        totalFuelCostReduction,
        volumeRef,
        addFloatingMessage,
    } = useMarketplace();

    // console.log(addFloatingMessage);

    const { improvedUILevel } = useUI();

    // Determine UI tier class based on improvedUILevel
    const getUITierClass = () => {
        // For levels 50+, we'll use a specific class to enable animations
        if (improvedUILevel >= 50) return `ui-tier-50`;

        // For levels below 50, we'll use a class that indicates no animations
        return 'ui-tier-basic';
    };

    const uiTierClass = getUITierClass();
    // Add default value for currentGalaxy
    // only enable toggles if item exists in inventory
    const hasShield = inventory.some((item) => item.name === 'Shield' && item.quantity > 0);
    const hasStealth = inventory.some((item) => item.name === 'Stealth' && item.quantity > 0);
    const showPreview = improvedUILevel >= 75;
    const warnWar = showPreview && nextGalaxyWar;

    // resolve trader data
    const traderData = tradersData.traders.find((t) => t.traderId === currentTrader);
    const key = traderData?.traderId ? `./trader${traderData?.traderId}.webp` : null;
    const imgSrc = key && traderImages.keys().includes(key) ? traderImages(key) : null;
    const [showMap, setShowMap] = useState(false);
    const [showTraderInfo, setShowTraderInfo] = useState(false);

    const handleSelect = (name) => {
        travelToGalaxy(name);
        setShowMap(false);
    };

    const handleInsufficientFuel = () => {
        zzfx(
            volumeRef.current, //Volume
            2.02,
            691,
            0.01,
            0.27,
            0.5,
            1,
            4.1,
            0,
            -36,
            -63,
            0.09,
            0.04,
            0,
            3.1,
            0,
            0.13,
            0.82,
            0.21,
            0.03,
            171
        );
    };

    const handleNextGalaxyClick = () => {
        // Get all possible indices
        const availableIndices = [...Array(tradersData.traders.length).keys()];

        // Select a random index that's not in the current galaxy
        let nextIdx;
        do {
            nextIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        } while (
            galaxyName === tradersData.traders[nextIdx].homeGalaxy &&
            availableIndices.length > 1
        );

        const cost = fuelPrices[nextIdx] || 0;
        if (fuel < cost) {
            handleInsufficientFuel();
            console.log('cant travel now');
            return;
        }

        // NEXT GALAXY SOUND
        if (improvedUILevel <= 50) {
            zzfx(
                volumeRef.current, //Volume
                0,
                925, //Freq
                0.04,
                0.04, //Attack
                0.3,
                0, //Sustain
                0.6,
                0.3, //Release
                1, //Wave Shape (0,1,2,3,4)
                0.3, //Shape curve
                0, //Slide
                6.27, //Delta Slide
                -184, //Pitch Jump
                0.09, //Pitch Jump Time
                0.17 //Repeat Time
            );
        } else if (improvedUILevel <= 100) {
            zzfx(
                0.5,
                0.05,
                496,
                0.02,
                0.16,
                0.15,
                0,
                1.1,
                0,
                0,
                -165,
                0.07,
                0.01,
                0,
                0,
                0,
                0,
                0.65,
                0.23,
                0.23,
                216
            );
        } else if (improvedUILevel <= 200) {
            zzfx(
                2.4,
                0.05,
                13,
                0.03,
                0.02,
                0.13,
                2,
                0.8,
                -0.1,
                0,
                -100,
                0,
                0.02,
                0,
                1,
                0.1,
                0.01,
                0.5,
                0,
                0.24,
                0
            ); // Random 63 - Mutation 13
        } else if (improvedUILevel <= 300) {
            zzfx(
                0.5,
                0.05,
                167,
                0.24,
                0.02,
                0.13,
                2,
                3.3,
                0,
                -8,
                0,
                0,
                0.12,
                0,
                0,
                0,
                0,
                0.81,
                0.24,
                0.01,
                160
            );
            // Random 64
        } else if (improvedUILevel <= 400) {
            zzfx(
                0.5,
                0.05,
                166,
                0.22,
                0.03,
                0.11,
                4,
                3.3,
                0,
                -7.9,
                -50,
                0.02,
                0.14,
                -0.2,
                3,
                -0.1,
                0.01,
                1.21,
                0.21,
                0.01,
                163
            );
            // Random 64 - Mutation 24
        } else if (improvedUILevel <= 500) {
            zzfx(
                0.5,
                0.05,
                166,
                0.23,
                0.03,
                0.12,
                0,
                3.3,
                0,
                -7.9,
                -150,
                0.02,
                0.12,
                -0.1,
                0,
                -0.2,
                0.01,
                1.21,
                0.22,
                0.01,
                163
            );
            // Random 64 - Mutation 15
        }

        // Powerup 61 - Mutation 1
        // zzfx(
        //     volumeRef.current,
        //     925,
        //     0.04,
        //     0.3,
        //     0.6,
        //     1,
        //     0.3,
        //     0,
        //     6.27,
        //     -184,
        //     0.09,
        //     0.17,
        //     0,
        //     0,
        //     0,
        //     0,
        //     0,
        //     0,
        //     0,
        //     0
        // );

        // Always travel to the selected galaxy
        travelToGalaxy(tradersData.traders[nextIdx].homeGalaxy);

        // Only show high-detail star map if UI level is 501 or higher
        if (improvedUILevel >= 501) {
            setShowMap(true);
        }
    };

    // Determine index of current trader within this galaxy
    const traderIndex = traderIds ? traderIds.findIndex((tid) => tid === currentTrader) : -1;
    const traderCount = traderIds ? traderIds.length : 0;
    const prevIndex = traderIndex >= 0 ? (traderIndex - 1 + traderCount) % traderCount : -1;
    const nextIndex = traderIndex >= 0 ? (traderIndex + 1) % traderCount : -1;
    const fuelCostReduction = statusEffects.fuel_cost?.value || 0;

    return (
        <div ref={traderNavRef} className={`main-trader ${uiTierClass} `}>
            <div className="trader-nav">
                <div className="trader-buttons">
                    {!inTravel && traderCount > 1 && (
                        <div className="button-container prev-trader">
                            <button
                                className="btn--travel btn--travel__prev"
                                onClick={() => {
                                    const currentIdx = traderIds.findIndex(
                                        (tid) => tid === currentTrader
                                    );
                                    const prevIdx =
                                        (currentIdx - 1 + traderIds.length) % traderIds.length;
                                    const cost = fuelPrices[prevIdx] || 0;
                                    if (fuel < cost) {
                                        handleInsufficientFuel();
                                        return;
                                    }
                                    handlePrevTrader();
                                }}
                            >
                                Previous Trader
                                {prevIndex >= 0 && fuelPrices[prevIndex] ? (
                                    <p className="fuel-cost">{` (cost ${fuelPrices[prevIndex]} fuel)`}</p>
                                ) : (
                                    ''
                                )}
                            </button>

                            {improvedUILevel >= 25 && prevIndex >= 0 && (
                                <p className="center">{` ${traderNames[prevIndex]}`}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="trader-card">
                    {inTravel ? (
                        <>
                            <div className="signal-animation">
                                <SignalAnimation
                                    duration={travelTimeLeft}
                                    onClose={() => setShowMap(false)}
                                />
                            </div>
                            <div className="traveling-message">
                                <TraderMessage
                                    key={`goodbye-${currentTrader}`} // Force re-render with new trader
                                    messageText={traderMessage}
                                    traderMessages={traderMessages}
                                    lastTrader={currentTrader} // This is a goodbye message
                                    statusEffects={statusEffects}
                                    improvedUILevel={improvedUILevel}
                                />
                            </div>
                        </>
                    ) : (
                        imgSrc && (
                            <div className="trader-image-container">
                                <div
                                    className="trader-image"
                                    style={{ backgroundImage: `url(${imgSrc})` }}
                                >
                                    <div className="trader-name">{traderData?.name}</div>
                                    <TraderMessage
                                        messageText={traderMessage}
                                        traderMessages={traderMessages}
                                        currentTrader={currentTrader} // This is a greeting message
                                        statusEffects={statusEffects}
                                        improvedUILevel={improvedUILevel}
                                    />
                                </div>
                            </div>
                        )
                    )}

                    {!inTravel && traderData && (
                        <div
                            className="trader-info-trigger"
                            onMouseEnter={() => setShowTraderInfo(true)}
                            onMouseLeave={() => setShowTraderInfo(false)}
                        >
                            <svg className="info-icon" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                        </div>
                    )}

                    <div className="trader-count">
                        Trader {traderIndex + 1} of {traderCount}
                        {improvedUILevel >= 25 && ` - ${traderData?.name}`}
                    </div>

                    {showTraderInfo && traderData && (
                        <div className="trader-info-container">
                            <TraderInfo trader={traderData} improvedUILevel={improvedUILevel} />
                        </div>
                    )}
                    <div className="status-card">
                        <button
                            className={`shield-button${shieldActive ? ' active' : ''}`}
                            onClick={() => {
                                zzfx(
                                    volumeRef.current,
                                    0.925,
                                    0.04,
                                    0.3,
                                    0.6,
                                    1,
                                    0.3,
                                    0,
                                    6.27,
                                    -184,
                                    0.09,
                                    0.17,
                                    0,
                                    0,
                                    0,
                                    0,
                                    0,
                                    0,
                                    0,
                                    0
                                );
                                toggleShield();
                            }}
                            disabled={!hasShield}
                        >
                            {shieldActive ? 'Shield On' : 'Shield Off'}
                        </button>
                        <button
                            className={`stealth-button${stealthActive ? ' active' : ''}`}
                            onClick={() => {
                                // zzfx(volumeRef.current, .42, 799, .4, .01, .58, 0, 0, 100, 42, 452, 2, 0, .4, 4.269, -0.08, 0, .8, .3, .12, 1337);
                                toggleStealth();
                            }}
                            disabled={!hasStealth}
                        >
                            {stealthActive ? 'Stealth On' : 'Stealth Off'}
                        </button>

                        <div
                            className="hud-tools-grid"
                            style={{
                                opacity: 1,
                                background: '#000',
                                color: '#fff',
                                padding: '0.1rem',
                                margin: '0.5rem 0',
                                display: 'inline-block',
                                border: 'none',
                                borderRadius: 0,
                                textAlign: 'center',
                                width: 'fit-content',
                            }}
                        >
                            <h4
                                style={{
                                    margin: '0 0 0.2rem 0',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    color: '#fff',
                                }}
                            >
                                Tools
                            </h4>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '0.1rem',
                                }}
                            >
                                <div
                                    style={{
                                        padding: '0.1rem',
                                        opacity: statusEffects.tool_receiver?.active ? 1 : 0.5,
                                    }}
                                >
                                    {statusEffects.tool_receiver?.active ? '↩️🆗' : '↩️⏹️'}
                                </div>
                                <div
                                    style={{
                                        padding: '0.1rem',
                                        opacity: statusEffects.tool_reverter?.active ? 1 : 0.5,
                                    }}
                                >
                                    {statusEffects.tool_reverter?.active ? '↪️🆗' : '↪️⏹️'}
                                </div>
                                <div
                                    id="translate-chik-en"
                                    style={{
                                        padding: '0.1rem',
                                        opacity: statusEffects.translate_CHIK?.active ? 1 : 0.5,
                                    }}
                                >
                                    👾🌎
                                </div>
                                <div
                                    id="translate-lay-en"
                                    style={{
                                        padding: '0.1rem',
                                        opacity: statusEffects.translate_LAY?.active ? 1 : 0.5,
                                    }}
                                >
                                    👽🌎
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="trader-buttons">
                    {!inTravel && traderCount > 1 && (
                        <div className="button-container next-trader">
                            <button
                                className="btn--travel btn--travel__next"
                                onClick={() => {
                                    const currentIdx = traderIds.findIndex(
                                        (tid) => tid === currentTrader
                                    );
                                    const nextIdx = (currentIdx + 1) % traderIds.length;
                                    const cost = fuelPrices[nextIdx] || 0;
                                    if (fuel < cost) {
                                        handleInsufficientFuel();
                                        return;
                                    }
                                    handleNextTrader(nextIndex, cost);
                                }}
                            >
                                Next Trader
                                {nextIndex >= 0 && fuelPrices[nextIndex] ? (
                                    <p className="fuel-cost">{` (cost ${fuelPrices[nextIndex]} fuel)`}</p>
                                ) : (
                                    ''
                                )}
                            </button>
                            {improvedUILevel >= 25 && nextIndex >= 0 && (
                                <p className="center">{`${traderNames[nextIndex]}`}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="trader-actions">
                {!inTravel && (
                    <>
                        {fuelCostReductions && fuelCostReductions.length > 0 && (
                            <div style={{ marginBottom: 8, textAlign: 'center' }}>
                                {fuelCostReductions.map((r, i) => (
                                    <FloatingMessage
                                        key={r.name}
                                        text={`-${Math.abs(r.value)} fuel (${r.name})`}
                                        color="red"
                                        animation="floatUp 1.5s ease-out forwards"
                                        style={{
                                            position: 'absolute',
                                            top: '-20px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        <div className="action-fuel action-container">
                            {(() => {
                                const traderIdx = traderIds
                                    ? traderIds.findIndex((tid) => tid === currentTrader)
                                    : -1;
                                const basePrice = traderIdx >= 0 ? fuelPrices[traderIdx] : 0;
                                const effectivePrice = Math.max(
                                    basePrice - (totalFuelCostReduction || 0),
                                    0
                                );
                                return (
                                    <div className="fuel-button" style={{ position: 'relative' }}>
                                        <p className="fuel-cost-info info">
                                            {improvedUILevel >= 25
                                                ? `(5 units @ ${effectivePrice.toFixed(
                                                      2
                                                  )} each = ${(effectivePrice * 5).toFixed(
                                                      2
                                                  )} credits)`
                                                : `(5 units @ ${effectivePrice.toFixed(2)} each)`}
                                        </p>
                                        <button
                                            ref={(el) => {
                                                // Store the button element in a variable that can be accessed in the click handler
                                                const buttonElement = el;
                                                return () => {
                                                    // This is a no-op, but it satisfies the ref requirement
                                                };
                                            }}
                                            onClick={(event) => {
                                                const traderIdx = traderIds.findIndex(
                                                    (tid) => tid === currentTrader
                                                );
                                                const basePrice =
                                                    traderIdx >= 0 ? fuelPrices[traderIdx] : 0;
                                                const effectivePrice = Math.max(
                                                    basePrice - (totalFuelCostReduction || 0),
                                                    0
                                                );
                                                const totalCost = effectivePrice * 5;
                                                const buttonElement = event.currentTarget;

                                                if (credits < totalCost) {
                                                    handleInsufficientFuel();
                                                    return;
                                                }

                                                zzfx(
                                                    volumeRef.current,
                                                    0.129,
                                                    0.01,
                                                    0,
                                                    0.15,
                                                    0,
                                                    0,
                                                    0,
                                                    0,
                                                    0,
                                                    0,
                                                    0,
                                                    5,
                                                    0,
                                                    0,
                                                    0,
                                                    0,
                                                    0,
                                                    0,
                                                    0
                                                );
                                                buyFuel(5, totalCost);
                                            }}
                                        >
                                            <p>Buy Fuel</p>
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="action-galaxy action-container">
                            <div className="galaxy-button" style={{ position: 'relative' }}>
                                <p className="galaxy-info info">
                                    Current: {galaxyName ? `${galaxyName}` : 'Traveling...'}
                                </p>
                                <button
                                    className={`next-galaxy-button ${
                                        warnWar ? ' highlight-war' : ''
                                    }`}
                                    onClick={handleNextGalaxyClick}
                                >
                                    <p>
                                        {showPreview ? `Next: ${nextGalaxyName}` : 'Next Galaxy'}{' '}
                                        {improvedUILevel < 50 ? `(Random)` : `(StarMap)`}
                                    </p>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {showMap && (
                <div className="star-map-container">
                    {improvedUILevel < 50 ? (
                        <TravelOverlay />
                    ) : improvedUILevel < 100 ? (
                        <StarMapMid
                            galaxies={galaxiesData.galaxies}
                            currentGalaxyId={galaxyName}
                            onSelect={handleSelect}
                            improvedUILevel={improvedUILevel}
                        />
                    ) : improvedUILevel > 100 ? (
                        <StarMapHigh
                            galaxies={galaxiesData.galaxies}
                            currentGalaxyId={galaxyName}
                            onSelect={handleSelect}
                            improvedUILevel={improvedUILevel}
                        />
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default TraderNav;
