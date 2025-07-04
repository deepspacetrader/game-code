import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useStatusEffects } from '../context/StatusEffectsContext';
import './PlayerHUD.scss';
import FloatingMessage from './Reusable/FloatingMessage';
import { useUI } from '../context/UIContext';
import { decryptData } from '../utils/encryption';

const PlayerHUD = () => {
    const {
        credits,
        health,
        fuel,
        stealthActive,
        shieldActive,
        isCheater: contextIsCheater,
    } = useMarketplace();
    const { uiTier, improvedUILevel, courierDrones } = useUI();

    const { statEffects, addStatEffect } = useStatusEffects();
    const prevCredits = React.useRef(credits);
    const prevHealth = React.useRef(health);
    const prevFuel = React.useRef(fuel);
    const prevUI = React.useRef(improvedUILevel);
    const prevDeliverySpeed = React.useRef(courierDrones);

    // compute fuel meter percent and visibility
    const fillPercent = Math.min(100, (fuel / 1000) * 100);
    const showFuelMeter = improvedUILevel >= 25;
    const [isCheater, setIsCheater] = useState(false);

    // Check for cheater status in both localStorage and context
    useEffect(() => {
        // Update from context first (most up-to-date)
        if (contextIsCheater) {
            setIsCheater(true);
            return;
        }

        // Fall back to checking localStorage
        const savedGame = localStorage.getItem('scifiMarketSave');
        if (savedGame) {
            try {
                const gameState = decryptData(savedGame);
                if (gameState?.isCheater) {
                    setIsCheater(true);
                }
            } catch (e) {
                console.error('Error checking cheater status from localStorage:', e);
            }
        } else {
            // If no saved game, ensure we're in sync with context
            setIsCheater(!!contextIsCheater);
        }
    }, [contextIsCheater]);

    React.useEffect(() => {
        const delta = credits - prevCredits.current;
        if (delta !== 0) addStatEffect('credits', delta);
        prevCredits.current = credits;
    }, [credits, addStatEffect]);

    React.useEffect(() => {
        const delta = health - prevHealth.current;
        if (delta !== 0) addStatEffect('health', delta);
        prevHealth.current = health;
    }, [health, addStatEffect]);

    React.useEffect(() => {
        const delta = fuel - prevFuel.current;
        if (delta !== 0) addStatEffect('fuel', delta);
        prevFuel.current = fuel;
    }, [fuel, addStatEffect]);

    React.useEffect(() => {
        const delta = improvedUILevel - prevUI.current;
        if (delta !== 0) {
            addStatEffect('ui', delta);
        }
        prevUI.current = improvedUILevel;
    }, [improvedUILevel, addStatEffect]);

    React.useEffect(() => {
        const delta = courierDrones - prevDeliverySpeed.current;
        if (delta !== 0) addStatEffect('delivery_speed', delta);
        prevDeliverySpeed.current = courierDrones;
    }, [courierDrones, addStatEffect]);

    return (
        <div className="sticky-hud">
            <div className="spaceship-hud">
                <div className="hud-item hud-item--health">
                    {statEffects
                        .filter((e) => e.name === 'heal_player')
                        .map((e) => (
                            <FloatingMessage
                                key={`heal-${e.id}`}
                                text={`+${e.delta}`}
                                color="green"
                                animation="floatUp 1.5s ease-out forwards"
                                style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                }}
                            />
                        ))}
                    {statEffects
                        .filter((e) => e.name === 'damage_player')
                        .map((e) => (
                            <FloatingMessage
                                key={`damage-${e.id}`}
                                text={`-${e.delta}`}
                                color="red"
                                animation="floatDown 1.5s ease-out forwards"
                                style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                }}
                            />
                        ))}
                    Health: {health}
                </div>

                <div className="hud-item hud-item--fuel fuel-level">
                    {statEffects
                        .filter((e) => e.name === 'fuel')
                        .map((e) => (
                            <FloatingMessage
                                key={`fuel-${e.id}`}
                                text={e.delta > 0 ? `+${e.delta}` : `${e.delta}`}
                                color={e.delta > 0 ? 'orange' : 'black'}
                                animation={
                                    e.delta > 0
                                        ? 'floatUp 1.5s ease-out forwards'
                                        : 'floatDown 1.5s ease-out forwards'
                                }
                                style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                }}
                            />
                        ))}
                    <span
                        className="fuel-level"
                        style={
                            showFuelMeter
                                ? {
                                      background: `linear-gradient(to right, var(--accent) ${fillPercent}%, transparent ${fillPercent}% )`,
                                  }
                                : {}
                        }
                    >
                        Fuel: {fuel}
                    </span>
                </div>

                <div className={`hud-item hud-item--credit ${isCheater ? 'cheater' : ''}`}>
                    {statEffects
                        .filter((e) => e.name === 'credits')
                        .map((e) => (
                            <FloatingMessage
                                key={e.id}
                                text={e.delta > 0 ? `+${e.delta}` : `${e.delta}`}
                                color={e.delta > 0 ? 'green' : 'red'}
                                animation={
                                    e.delta > 0
                                        ? 'floatUp 1.5s ease-out forwards'
                                        : 'floatDown 1.5s ease-out forwards'
                                }
                                style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                }}
                            />
                        ))}
                    Credits: {credits}
                </div>

                <div className="hud-item hud-item--ui-level">
                    {statEffects
                        .filter((e) => e.name === 'ui')
                        .map((e) => (
                            <FloatingMessage
                                key={`ui-${e.id}`}
                                text={e.delta > 0 ? `+${e.delta}` : `${e.delta}`}
                                color={e.delta > 0 ? 'white' : 'red'}
                                animation={
                                    e.delta > 0
                                        ? 'hudFloatUpFade 1.5s ease-out forwards'
                                        : 'floatDown 1.5s ease-out forwards'
                                }
                                style={{
                                    position: 'absolute',
                                    top: e.delta > 0 ? '10px' : '-20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                }}
                            />
                        ))}
                    UI Level: {improvedUILevel}
                    {improvedUILevel >= 100 && <div className="ui-tier-label">Tier: {uiTier}</div>}
                </div>
                <div className="hud-item hud-item--speed">
                    {statEffects &&
                        statEffects
                            .filter((e) => e.name === 'delivery_speed')
                            .map((e) => (
                                <>
                                    <FloatingMessage
                                        key={`ui-${e.id}`}
                                        text={
                                            e.delta > 0
                                                ? `+${(e.delta * 100).toFixed(1)}`
                                                : `${(e.delta * 100).toFixed(1)}`
                                        }
                                        color={e.delta > 0 ? 'white' : 'red'}
                                        animation={
                                            e.delta > 0
                                                ? 'floatUp 1.5s ease-out forwards'
                                                : 'floatDown 1.5s ease-out forwards'
                                        }
                                        style={{
                                            position: 'absolute',
                                            top: '-20px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                        }}
                                    />
                                    <div className="speed-effect-timer">
                                        <div
                                            className="speed-effect-timer-bar"
                                            style={{
                                                width: `${(e.remainingTime / e.duration) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </>
                            ))}
                    Delivery Speed: + {(courierDrones * 100).toFixed(1)}%
                </div>
            </div>
            {/* 
            <div className="hud-item hud-item--stealth">
        {statEffects.filter(e => e.name === 'stealth').map(e => (
          <FloatingMessage
            key={e.id}
            text={e.delta > 0 ? `+${e.delta}` : `${e.delta}`}
            color="purple"
            animation={e.delta > 0 ? 'floatUp 1.5s ease-out forwards' : 'floatDown 1.5s ease-out forwards'}
        </div>
            style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)' }}
          />
        ))}
        Stealth: {stealthActive ? 'ON' : 'OFF'}
      </div> 
      */}
            {/*
             <div className="hud-item hud-item--shield">
        {statEffects.filter(e => e.name === 'shield').map(e => (
          <FloatingMessage
            key={e.id}
            text={e.delta > 0 ? `+${e.delta}` : `${e.delta}`}
            color="blue"
            animation={e.delta > 0 ? 'floatUp 1.5s ease-out forwards' : 'floatDown 1.5s ease-out forwards'}
            style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)' }}
          />
        ))}
        Shield: {shieldActive ? 'ON' : 'OFF'}
      </div> 
      */}
        </div>
    );
};

export default PlayerHUD;
