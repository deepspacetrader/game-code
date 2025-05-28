import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zzfx } from 'zzfx';
import {
    faLock,
    faLockOpen,
    faBolt,
    faSearch,
    faHandHoldingUsd,
    faMicrochip,
    faArrowRight,
    faArrowLeft,
    faArrowUp,
    faArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import './QuantumSetup.scss';

const QuantumSetup = ({ setQuantumSlotsUsed, setStatusEffects }) => {
    const {
        inventory,
        subtractQuantumProcessor,
        quantumAbilitiesEnabled,
        toggleQuantumAbilities,
        volumeRef,
    } = useMarketplace();
    const quantumProcessor = inventory.find((i) => i.name === 'Quantum Processor');
    const quantumCount = quantumProcessor?.quantity || 0;
    const slotsCount = 5;

    // Initialize slots with random scan directions and ensure last is always Quantum Market
    const [slots, setSlots] = useState(() => {
        const initialSlots = Array(slotsCount)
            .fill(null)
            .map((_, index) => {
                if (index === slotsCount - 1) {
                    return { active: false, ability: 'QuantumMarket' };
                }

                // Randomly assign a scan direction
                const scanTypes = [
                    'QuantumScanLR',
                    'QuantumScanTB',
                    'QuantumScanRL',
                    'QuantumScanBT',
                ];
                const randomScan = scanTypes[Math.floor(Math.random() * scanTypes.length)];

                return {
                    active: false,
                    ability: Math.random() < 0.3 ? 'QuantumHover' : randomScan,
                };
            });
        return initialSlots;
    });

    // Quantum ability definitions with icons and descriptions
    const QUANTUM_ABILITIES = {
        QuantumHover: {
            name: 'Quantum Hover',
            icon: faSearch,
            description: 'Reveals detailed item information on hover',
            color: '#4fc3f7',
            power: 1,
            uiLevelRequired: 5,
        },
        QuantumScanLR: {
            name: 'Quantum Scan LR',
            icon: faArrowRight,
            description: 'Scans the market from left to right',
            color: '#69f0ae',
            power: 2,
            uiLevelRequired: 15,
        },
        QuantumScanTB: {
            name: 'Quantum Scan TB',
            icon: faArrowDown,
            description: 'Scans the market from top to bottom',
            color: '#69f0ae',
            power: 2,
            uiLevelRequired: 15,
        },
        QuantumScanRL: {
            name: 'Quantum Scan RL',
            icon: faArrowLeft,
            description: 'Scans the market from right to left',
            color: '#69f0ae',
            power: 2,
            uiLevelRequired: 15,
        },
        QuantumScanBT: {
            name: 'Quantum Scan BT',
            icon: faArrowUp,
            description: 'Scans the market from bottom to top',
            color: '#69f0ae',
            power: 2,
            uiLevelRequired: 15,
        },
        QuantumMarket: {
            name: 'Quantum Market',
            icon: faHandHoldingUsd,
            description: 'Advanced market analysis and automation',
            color: '#ff8a65',
            power: 3,
            uiLevelRequired: 30,
        },
    };

    // Calculate total power based on active slots
    const totalPower = useMemo(() => {
        return slots.reduce((sum, slot) => {
            return slot.active ? sum + (QUANTUM_ABILITIES[slot.ability]?.power || 0) : sum;
        }, 0);
    }, [slots]);

    // Generate power indicators
    const renderPowerIndicators = (power) => {
        return Array(3)
            .fill(0)
            .map((_, i) => (
                <FontAwesomeIcon
                    key={i}
                    icon={faBolt}
                    className={`power-indicator ${i < power ? 'active' : ''}`}
                    style={{
                        color: i < power ? QUANTUM_ABILITIES[slots[i]]?.color || '#fff' : '#555',
                    }}
                />
            ));
    };

    // Toggle slot activation
    const toggleSlotActivation = useCallback(
        async (index) => {
            // Don't allow toggling if no quantum processors available
            if (quantumCount <= 0) {
                return;
            }

            const slot = slots[index];

            // If slot is active, deactivate it
            if (slot.active) {
                setSlots((prev) => {
                    const newSlots = [...prev];
                    newSlots[index] = { ...slot, active: false };
                    return newSlots;
                });
                return;
            }

            // If slot is inactive, try to activate it
            try {
                // Deduct quantum processor
                await subtractQuantumProcessor(1);

                // Update the specific slot that was clicked
                setSlots((prev) => {
                    const newSlots = [...prev];
                    newSlots[index] = {
                        ...slot,
                        active: true,
                    };
                    return newSlots;
                });

                // Update status effects
                setStatusEffects((prev) => ({
                    ...prev,
                    'Quantum Processor': {
                        ...prev['Quantum Processor'],
                        level: slots.filter((s) => s.active).length + 1,
                        quantity: quantumProcessor.quantity - 1,
                        lastTradeTime: Date.now(),
                        active: true,
                    },
                }));

                setQuantumSlotsUsed((prev) => prev + 1);
            } catch (error) {
                console.error('Error in toggleSlotActivation:', error);
            }
        },
        [
            quantumCount,
            quantumProcessor,
            subtractQuantumProcessor,
            setStatusEffects,
            setQuantumSlotsUsed,
            slots,
        ]
    );

    // Update quantumSlotsUsed when slots change
    useEffect(() => {
        const activeSlots = slots.filter((slot) => slot.active).length;
        setQuantumSlotsUsed(activeSlots);
    }, [slots, setQuantumSlotsUsed]);

    // UI tier is always at least 'medium' for Quantum Setup to be visible
    const uiTier = 'medium';

    return (
        <div className={`quantum-setup ${uiTier}`}>
            <div className="quantum-header">
                <h3>Quantum Processor</h3>
                <div className="power-level">
                    <span>Power:</span>
                    <div className="power-indicators">{renderPowerIndicators(totalPower)}</div>
                </div>

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
            <div className="slots">
                {slots.map((slot, idx) => {
                    const ability = slot.active ? QUANTUM_ABILITIES[slot.ability] : null;
                    const isUnlocked = slot.active;

                    return (
                        <div
                            key={idx}
                            className={`slot ${slot.active ? 'active' : ''} ${
                                isUnlocked ? 'unlocked' : 'locked'
                            }`}
                            onClick={() => toggleSlotActivation(idx)}
                            title={ability?.description || 'Empty slot'}
                        >
                            <div className="slot-content">
                                {isUnlocked && ability ? (
                                    <>
                                        <div
                                            className="ability-icon"
                                            style={{ color: ability?.color || '#fff' }}
                                        >
                                            <FontAwesomeIcon icon={ability?.icon || faMicrochip} />
                                        </div>
                                        <div className="ability-name">
                                            {ability?.name || 'Unknown Ability'}
                                        </div>
                                        <div className="slot-status">
                                            <FontAwesomeIcon
                                                icon={slot.active ? faLockOpen : faLock}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-slot">
                                        <FontAwesomeIcon icon={faMicrochip} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="quantum-info">
                <p>
                    Available Processors: <span className="highlight">{quantumCount}</span>
                </p>
                <p>
                    Active Slots:{' '}
                    <span className="highlight">
                        {slots.filter((s) => s.active).length}/{slots.length}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default QuantumSetup;
