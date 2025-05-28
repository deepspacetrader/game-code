import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import './TieredMenu.scss';
import { zzfx } from 'zzfx';

// Ability descriptions
const ABILITY_DESCRIPTIONS = {
    QuantumHover: 'Reveals item details and trading recommendations on hover',
    QuantumScan: 'Scans the market grid in a specific direction to find profitable trades',
    QuantumMarket: 'Advanced trading system for bulk market operations',
};

const TieredMenu = () => {
    const {
        toggleQuantumMode,
        quantumBuyEnabled,
        quantumSlotsUsed,
        setStatusEffects,
        quantumInventory = [],
        volumeRef,
    } = useMarketplace();
    const { improvedUILevel, sortMode, sortAsc, handleSort } = useUI();
    // initialize menu open state for all renders
    const [open, setOpen] = useState(false);
    const [activeAbility, setActiveAbility] = useState(null);

    // Set first ability as active by default if available
    useEffect(() => {
        if (quantumInventory.length > 0 && !activeAbility) {
            setActiveAbility(quantumInventory[0]);
        }
    }, [quantumInventory, activeAbility]);

    // Always show the menu if there are quantum abilities, regardless of UI level
    const hasQuantumAbilities = quantumInventory.length > 0;
    // Only hide the menu if UI level is too low and no abilities are unlocked
    // if (improvedUILevel < 5 && !hasQuantumAbilities) return null;

    // determine tier style
    let tierClass = 'tier-medium';
    if (improvedUILevel >= 75) tierClass = 'tier-high';
    if (improvedUILevel >= 100) tierClass = 'tier-ultra';

    return (
        <div className={`tiered-menu ${tierClass} ${open ? 'open' : ''}`}>
            {/* <div className="menu-header">
                <button
                    className="menu-toggle"
                    onClick={() => {
                        zzfx(
                            ...[volumeRef.current, 0, 537, 0.02, 0.02, 0.22, 1, 1.59, -6.98, 4.97]
                        );
                        setOpen((o) => !o);
                    }}
                >
                    Menu {open ? '▴' : '▾'}
                </button>
            </div> */}

            <div className="menu-items">
                <button
                    onClick={() => {
                        // zzfx(
                        //     ...[volumeRef.current, 0, 500, 0.01, 0, 0.15, 10, 1, 5, 0, 1, 0, 0, 5]
                        // );

                        zzfx(
                            ...[
                                volumeRef.current,
                                1,
                                378,
                                0.24,
                                0.28,
                                0.69,
                                1,
                                4.8,
                                0,
                                -87,
                                193,
                                0.06,
                                0.06,
                                0,
                                236,
                                0.01337,
                                0,
                                0.2,
                                0.32,
                                0.34,
                                0,
                            ]
                        ); // Random 69
                        handleSort('alpha');

                        // zzfx(1,0,378,.24,.28,.69,1,4.8,0,-87,123,.06,.06,0,236,.01337,0,.2,.32,.34,0); // Random 69

                        // zzfx(1,0,123,.24,.28,.69,1,4.8,0,-87,378,.06,.06,0,236,.01337,0,.2,.32,.34,0); // Random 69
                    }}
                >
                    Sort A-Z{sortMode === 'alpha' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
                <button
                    onClick={() => {
                        zzfx(...[volumeRef.current, 0, 500, 0.01, 0, 0.15, 0, 1, 5, 0, 1, 0, 0, 5]);
                        handleSort('price');
                    }}
                >
                    Sort by Price{sortMode === 'price' ? (sortAsc ? '↑' : '↓') : ''}
                </button>

                <button
                    onClick={() => {
                        zzfx(...[volumeRef.current, 0, 500, 0.01, 0, 0.15, 0, 0, 0, 0, 0, 0, 0, 5]);
                        handleSort('stock');
                    }}
                >
                    Sort by Stock{sortMode === 'stock' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
                {/* Quantum Abilities Section */}
                {quantumInventory.length > 0 && improvedUILevel >= 75 && (
                    <div className="quantum-abilities">
                        <div className="ability-selector">
                            {quantumInventory.map((ability) => (
                                <button
                                    key={ability}
                                    className={`ability-tab ${
                                        activeAbility === ability ? 'active' : ''
                                    }`}
                                    onClick={() => setActiveAbility(ability)}
                                >
                                    {ability.replace('Quantum', '')}
                                </button>
                            ))}
                        </div>

                        <div className="quantum-market-controls">
                            <button
                                onClick={() => {
                                    zzfx(
                                        ...[
                                            volumeRef.current,
                                            0.8,
                                            270,
                                            0,
                                            0.1,
                                            0,
                                            1,
                                            1.5,
                                            0,
                                            0,
                                            0,
                                            0,
                                            0,
                                            0,
                                            0,
                                            0.1,
                                            0.01,
                                        ]
                                    );
                                    toggleQuantumMode();
                                    setStatusEffects((prev) => ({
                                        ...prev,
                                        'Quantum Processor': {
                                            ...prev['Quantum Processor'],
                                            level: quantumInventory.length,
                                        },
                                    }));
                                }}
                                disabled={quantumSlotsUsed < 5}
                            >
                                Quantum Auto-Buy: {quantumBuyEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        {activeAbility && (
                            <div className="ability-details">
                                <h4>{activeAbility}</h4>
                                <p>
                                    {ABILITY_DESCRIPTIONS[activeAbility] ||
                                        'No description available.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TieredMenu;
