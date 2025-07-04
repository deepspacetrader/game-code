import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { randomFloatRange } from '../../utils/helpers';
import { zzfx } from 'zzfx';
import {
    faSearch,
    faMicrochip,
    faLock,
    faHandHoldingUsd,
    faArrowRight,
    faArrowLeft,
    faArrowUp,
    faArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import './QuantumSetup.scss';

const QuantumSetup = ({ setStatusEffects }) => {
    const {
        inventory,
        quantumInventory,
        subtractQuantumProcessor,
        quantumPower,
        setQuantumSlotsUsed,
        setQuantumPower,
        toggleQuantumAbilities,
        volumeRef,
        addQuantumAbility,
    } = useMarketplace();
    const quantumProcessor = inventory.find((i) => i.name === 'Quantum Processor');
    const quantumCount = quantumProcessor?.quantity || 0;
    const slotsCount = 6; // Increased from 5 to 6

    // Ability descriptions
    const ABILITY_DESCRIPTIONS = {
        QuantumHover: 'Reveals item details and trading recommendations on hover',
        QuantumScan: 'Scans the market grid in a specific direction to find profitable trades',
        QuantumMarket: 'Advanced trading system for bulk market operations',
    };

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
    // Initialize slots with random scan directions from standard abilities
    const [slots, setSlots] = useState(() => {
        // Standard abilities (5 unique abilities for 6 slots)
        const standardAbilities = [
            'QuantumScanLR',
            'QuantumScanTB',
            'QuantumScanRL',
            'QuantumScanBT',
            'QuantumHover',
        ];

        // Shuffle the standard abilities
        const shuffledAbilities = [...standardAbilities];
        for (let i = shuffledAbilities.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledAbilities[i], shuffledAbilities[j]] = [
                shuffledAbilities[j],
                shuffledAbilities[i],
            ];
        }

        // Create slots with unique abilities (one ability will be used twice)
        const initialSlots = [];
        for (let i = 0; i < slotsCount; i++) {
            // For the 6th slot, use a random ability from the first 5
            const abilityIndex =
                i < standardAbilities.length
                    ? i
                    : Math.floor(Math.random() * standardAbilities.length);
            initialSlots.push({
                active: false,
                ability: shuffledAbilities[abilityIndex],
                used: false,
            });
        }

        return initialSlots;
    });

    // Shuffle unused slots, ensuring no duplicates and the 6th becomes QuantumMarket when 5 slots are used
    const shuffleUnusedSlots = useCallback(() => {
        setSlots((prevSlots) => {
            const unusedSlots = prevSlots.filter((slot) => !slot.used);
            const usedSlots = prevSlots.filter((slot) => slot.used);

            // If we have 5 used slots and 1 unused, make it QuantumMarket
            if (usedSlots.length === 5 && unusedSlots.length === 1) {
                const newSlots = [...prevSlots];
                const lastUnusedIndex = newSlots.findIndex((slot) => !slot.used);
                if (lastUnusedIndex !== -1) {
                    newSlots[lastUnusedIndex] = {
                        ...newSlots[lastUnusedIndex],
                        ability: 'QuantumMarket',
                        active: true,
                        used: true,
                    };
                    return newSlots;
                }
                return prevSlots;
            }

            // Standard abilities (all except QuantumMarket)
            const standardAbilities = [
                'QuantumScanLR',
                'QuantumScanTB',
                'QuantumScanRL',
                'QuantumScanBT',
                'QuantumHover',
            ];

            // Get abilities that are currently used in standard slots
            const usedAbilities = new Set(usedSlots.map((slot) => slot.ability));

            // Filter out abilities that are already used from standard abilities
            const availableAbilities = standardAbilities.filter((a) => !usedAbilities.has(a));

            // If no available abilities, return current state
            if (availableAbilities.length === 0) {
                return prevSlots;
            }

            // Shuffle the available abilities
            const shuffledAbilities = [...availableAbilities];
            for (let i = shuffledAbilities.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledAbilities[i], shuffledAbilities[j]] = [
                    shuffledAbilities[j],
                    shuffledAbilities[i],
                ];
            }

            // Assign new abilities to unused slots
            let abilityIndex = 0;
            return prevSlots.map((slot) => {
                if (slot.used) return slot;

                // If we've used all unique abilities, start reusing them
                const ability =
                    abilityIndex < shuffledAbilities.length
                        ? shuffledAbilities[abilityIndex++]
                        : shuffledAbilities[Math.floor(Math.random() * shuffledAbilities.length)];

                return {
                    ...slot,
                    ability,
                };
            });
        });
    }, []);

    // Quantum ability definitions with icons and descriptions
    const QUANTUM_ABILITIES = {
        QuantumHover: {
            name: 'Quantum Hover',
            icon: faSearch,
            description: 'Reveals detailed item information on hover',
        },
        QuantumScanLR: {
            name: 'Quantum Scan Right',
            icon: faArrowRight,
            description: 'Scans the market from left to right',
        },
        QuantumScanTB: {
            name: 'Quantum Scan Down',
            icon: faArrowDown,
            description: 'Scans the market from top to bottom',
        },
        QuantumScanRL: {
            name: 'Quantum Scan Left',
            icon: faArrowLeft,
            description: 'Scans the market from right to left',
        },
        QuantumScanBT: {
            name: 'Quantum Scan Up',
            icon: faArrowUp,
            description: 'Scans the market from bottom to top',
        },
        QuantumMarket: {
            name: 'Quantum Market',
            icon: faHandHoldingUsd,
            description: 'Advanced market analysis and automation',
        },
    };

    // Activate a quantum slot (cannot deactivate once activated)
    const toggleSlotActivation = useCallback(
        async (index) => {
            // If slot is already active, do nothing and play a soft error sound
            if (slots[index]?.active) {
                zzfx(
                    volumeRef.current,
                    0.1,
                    220,
                    0.05,
                    0.05,
                    0.05,
                    1,
                    1,
                    -15,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0.1,
                    0.1,
                    0.1,
                    0,
                    0
                );
                return;
            }

            // Check if we have enough quantum processors
            if (quantumCount <= 0) {
                // Play error sound for insufficient quantum processors
                zzfx(
                    volumeRef.current,
                    0.1,
                    220,
                    0.1,
                    0.1,
                    0.1,
                    1,
                    1,
                    -15,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0.1,
                    0.1,
                    0.1,
                    0,
                    0
                );
                return;
            }

            // Try to consume a quantum processor
            const success = await subtractQuantumProcessor(1);
            if (!success) {
                console.warn('Failed to subtract quantum processor - insufficient quantity');
                zzfx(
                    volumeRef.current,
                    0.1,
                    220,
                    0.1,
                    0.1,
                    0.1,
                    1,
                    1,
                    -15,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0.1,
                    0.1,
                    0.1,
                    0,
                    0
                );
                return;
            }

            // Use functional update to ensure we have the latest state
            setSlots((prevSlots) => {
                // Double-check if slot is already active (in case of race condition)
                if (prevSlots[index]?.active) {
                    return prevSlots;
                }

                const newSlots = [...prevSlots];
                const currentActiveCount = prevSlots.filter((s) => s.active).length;
                const newActiveCount = currentActiveCount + 1; // We're activating one more slot

                // Get all standard abilities (excluding QuantumMarket)
                const standardAbilities = [
                    'QuantumScanLR',
                    'QuantumScanTB',
                    'QuantumScanRL',
                    'QuantumScanBT',
                    'QuantumHover',
                ];

                const usedSlots = newSlots.filter((s) => s.active);
                const usedAbilities = new Set(usedSlots.map((s) => s.ability));
                const availableAbilities = standardAbilities.filter((a) => !usedAbilities.has(a));

                // Determine the ability for the new slot
                let selectedAbility;
                if (availableAbilities.length === 0) {
                    selectedAbility = 'QuantumMarket';
                } else {
                    const randomIndex = Math.floor(Math.random() * availableAbilities.length);
                    selectedAbility = availableAbilities[randomIndex];
                }

                // Add the ability to quantumInventory
                addQuantumAbility(selectedAbility);

                // Update the slot
                newSlots[index] = {
                    ...newSlots[index],
                    ability: selectedAbility,
                    active: true,
                    used: true,
                };

                // Turn off quantum power when a slot is activated
                setQuantumPower(false);

                // Update quantum slots used count
                setQuantumSlotsUsed(newActiveCount);

                // Update status effects with the new active count
                setStatusEffects((prev) => ({
                    ...prev,
                    'Quantum Processor': {
                        ...prev['Quantum Processor'],
                        level: newActiveCount,
                        quantity: quantumCount - 1,
                        lastTradeTime: Date.now(),
                        active: newActiveCount > 0,
                    },
                }));

                // Play success sound after state updates
                setTimeout(() => {
                    zzfx(
                        ...[
                            volumeRef.current,
                            0,
                            200,
                            0.1,
                            0.1,
                            0.1,
                            0,
                            2,
                            0.2,
                            2,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0.1,
                            0.2,
                            0.1,
                        ]
                    );
                }, 0);

                return newSlots;
            });
        },
        [
            quantumCount,
            setStatusEffects,
            setQuantumSlotsUsed,
            setQuantumPower,
            subtractQuantumProcessor,
            slots,
            addQuantumAbility,
            volumeRef,
        ]
    );

    // Update quantumSlotsUsed when slots change
    useEffect(() => {
        const activeSlots = slots.filter((slot) => slot.active).length;
        setQuantumSlotsUsed(activeSlots);
        // console.log('Active slots updated:', activeSlots);
    }, [slots, setQuantumSlotsUsed]);

    // Use local state to track the power state for immediate UI updates
    const [localQuantumPower, setLocalQuantumPower] = useState(quantumPower);

    // Sync local state with context state
    useEffect(() => {
        // console.log('Quantum power state changed:', quantumPower);
        setLocalQuantumPower(quantumPower);
    }, [quantumPower]);

    // UI tier is always at least 'medium' for Quantum Setup to be visible
    const uiTier = 'medium';

    // Refs for tracking button hold state
    const isMouseDownRef = useRef(false);
    const soundTimeoutRef = useRef(null);

    // Handle mouse down for the quantum toggle button
    const handleMouseDown = useCallback(() => {
        const randomDecay = randomFloatRange(0.1337, 0.4269).toFixed(3);

        // Play initial sound
        zzfx(
            volumeRef.current,
            0.1,
            397,
            0.36,
            0.07,
            0.07,
            1,
            0.37,
            -16,
            -871,
            0,
            0,
            0,
            0,
            0,
            randomDecay,
            0.24,
            0.23,
            0.09,
            0,
            840
        );

        isMouseDownRef.current = true;

        // Get the current active slots count immediately
        const activeSlots = slots.filter((slot) => slot.active).length;
        // console.log('Active slots count:', activeSlots);

        soundTimeoutRef.current = setTimeout(() => {
            if (!isMouseDownRef.current) return;

            if (activeSlots > 0) {
                // console.log(
                //     'Toggling quantum power. Current state before toggle:',
                //     localQuantumPower
                // );

                // Update local state immediately for instant feedback
                const newState = !localQuantumPower;
                setLocalQuantumPower(newState);

                // Then update the context
                toggleQuantumAbilities();

                // Play success sound
                zzfx(volumeRef.current, 0, 392, 0.01, 0.05, 0.1, 1, 2, 0, 0, 0, 0, 0, 10);
            } else {
                // Play error sound for no active slots
                zzfx(
                    volumeRef.current,
                    0.1,
                    220,
                    0.1,
                    0.1,
                    0.1,
                    1,
                    1,
                    -15,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0.1,
                    0.1,
                    0.1,
                    0,
                    0
                );
            }
        }, 420); // Perfect delay so that when first sound ends 2nd sound begins
    }, [slots, toggleQuantumAbilities, volumeRef, localQuantumPower]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        isMouseDownRef.current = false;
        if (soundTimeoutRef.current) {
            clearTimeout(soundTimeoutRef.current);
            soundTimeoutRef.current = null;
        }
    }, []);

    // Handle mouse leave
    const handleMouseLeave = useCallback(() => {
        isMouseDownRef.current = false;
        if (soundTimeoutRef.current) {
            clearTimeout(soundTimeoutRef.current);
            soundTimeoutRef.current = null;
        }
    }, []);

    return (
        <div
            className={`quantum-setup ${uiTier} ${
                localQuantumPower ? 'quantum-power-enabled' : ''
            }`}
        >
            <div className="quantum-header">
                <h3>Quantum Processor</h3>
                <div className="quantum-toggle-container">
                    <div className={`quantum-status ${localQuantumPower ? 'active' : ''}`}>
                        <span className="status-indicator">
                            <span className={`pulse ${localQuantumPower ? 'active' : ''}`}></span>
                            {localQuantumPower ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <button
                            className={`quantum-toggle ${localQuantumPower ? 'enabled' : ''}`}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                            title={
                                localQuantumPower
                                    ? 'Disable all quantum abilities'
                                    : 'Enable all quantum abilities'
                            }
                        >
                            {localQuantumPower ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="slots">
                {slots.map((slot, idx) => {
                    const ability = slot.active ? QUANTUM_ABILITIES[slot.ability] : null;
                    const isUnlocked = slot.active;
                    const isQuantumHover = slot.ability === 'QuantumHover';

                    return (
                        <div
                            key={idx}
                            className={`slot ${slot.active ? 'active' : ''} ${
                                isUnlocked ? 'unlocked' : 'locked'
                            } ${isQuantumHover ? 'quantum-hover' : ''}`}
                            onClick={() => toggleSlotActivation(idx)}
                            title={ability?.description || 'Empty slot'}
                        >
                            <div className="slot-content">
                                {isUnlocked && ability ? (
                                    <>
                                        <div
                                            className="ability-icon"
                                            style={{
                                                color: ability?.color || '#fff',
                                                fontSize: '1.5em',
                                                marginBottom: '8px',
                                                filter: `drop-shadow(0 0 4px ${ability?.color}80)`,
                                            }}
                                        >
                                            <FontAwesomeIcon icon={ability?.icon || faMicrochip} />
                                        </div>
                                        <div
                                            className="ability-name"
                                            style={{
                                                fontSize: '0.8em',
                                                marginBottom: '4px',
                                                textShadow: '0 0 5px currentColor',
                                            }}
                                        >
                                            {ability?.name || 'Unknown Ability'}
                                        </div>
                                        <div
                                            className="slot-status"
                                            style={{
                                                position: 'absolute',
                                                bottom: '4px',
                                                right: '4px',
                                                fontSize: '0.7em',
                                                opacity: 0.7,
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faLock} />
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
