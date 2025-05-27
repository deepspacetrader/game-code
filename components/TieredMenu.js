import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useUI } from '../context/UIContext';
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
        sortMode,
        sortAsc,
        handleSort,
        toggleQuantumMode,
        quantumBuyEnabled,
        quantumSlotsUsed,
        setStatusEffects,
        quantumInventory = [],
        volumeRef,
        quantumAbilitiesEnabled,
        toggleQuantumAbilities,
    } = useMarketplace();
    const { improvedUILevel } = useUI();
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
    if (improvedUILevel < 5 && !hasQuantumAbilities) return null;

    // determine tier style
    let tierClass = 'tier-medium';
    if (improvedUILevel >= 75) tierClass = 'tier-high';
    if (improvedUILevel >= 100) tierClass = 'tier-ultra';

    return (
        <div className={`tiered-menu ${tierClass} ${open ? 'open' : ''}`}>
            <div className="menu-header">
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
                <div className="quantum-toggle-container">
                    <div className="quantum-status">
                        <span className="status-indicator">
                            <span
                                className={`pulse ${quantumAbilitiesEnabled ? 'active' : ''}`}
                            ></span>
                            Quantum {quantumAbilitiesEnabled ? 'Active' : 'Inactive'}
                        </span>
                        <button
                            className={`quantum-toggle ${
                                quantumAbilitiesEnabled ? 'enabled' : 'disabled'
                            }`}
                            onClick={() => {
                                zzfx(
                                    ...[
                                        2.05,
                                        volumeRef.current,
                                        392,
                                        0.01,
                                        0.05,
                                        0.1,
                                        1,
                                        2,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0,
                                        10,
                                    ]
                                );
                                // Use the callback form of setState to ensure we have the latest value
                                toggleQuantumAbilities((prev) => {
                                    console.log('Toggling quantum abilities. Current state:', prev);
                                    return !prev;
                                });
                            }}
                            title={
                                quantumAbilitiesEnabled
                                    ? 'Disable all quantum abilities'
                                    : 'Enable all quantum abilities'
                            }
                        >
                            {quantumAbilitiesEnabled ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                </div>
            </div>
            {open && (
                <div className="menu-items">
                    <button
                        onClick={() => {
                            zzfx(
                                ...[
                                    volumeRef.current,
                                    0,
                                    129,
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
                                ]
                            );
                            handleSort('alpha');
                        }}
                    >
                        Sort A→Z{sortMode === 'alpha' ? (sortAsc ? '↑' : '↓') : ''}
                    </button>
                    <button
                        onClick={() => {
                            zzfx(
                                ...[
                                    volumeRef.current,
                                    0,
                                    129,
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
                                ]
                            );
                            handleSort('price');
                        }}
                    >
                        Sort by Price{sortMode === 'price' ? (sortAsc ? '↑' : '↓') : ''}
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
            )}
        </div>
    );
};

export default TieredMenu;
