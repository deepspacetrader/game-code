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
        toggleQuantumAbilities,
        volumeRef,
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
            name: 'Quantum Scan LR',
            icon: faArrowRight,
            description: 'Scans the market from left to right',
        },
        QuantumScanTB: {
            name: 'Quantum Scan TB',
            icon: faArrowDown,
            description: 'Scans the market from top to bottom',
        },
        QuantumScanRL: {
            name: 'Quantum Scan RL',
            icon: faArrowLeft,
            description: 'Scans the market from right to left',
        },
        QuantumScanBT: {
            name: 'Quantum Scan BT',
            icon: faArrowUp,
            description: 'Scans the market from bottom to top',
        },
        QuantumMarket: {
            name: 'Quantum Market',
            icon: faHandHoldingUsd,
            description: 'Advanced market analysis and automation',
        },
    };

    // Toggle slot activation
    const toggleSlotActivation = useCallback(
        async (index) => {
            // If slot is already active, return early
            if (slots[index]?.active) {
                return;
            }

            // Try to consume a quantum processor
            try {
                // Try to subtract a quantum processor
                const success = await subtractQuantumProcessor(1);

                if (!success) {
                    console.warn('Failed to subtract quantum processor - insufficient quantity');
                    // Play error sound
                    zzfx(1, 0, 100, 0.1, 0.1, 0.1, 0, 1.5, 0.2, 2, 0, 0, 0, 0, 0, 0, 0.1, 0.2, 0.1);
                    return; // Not enough quantum processors
                }

                // Play success sound
                zzfx(1, 0, 200, 0.1, 0.1, 0.1, 0, 2, 0.2, 2, 0, 0, 0, 0, 0, 0, 0.1, 0.2, 0.1);
            } catch (error) {
                console.error('Error consuming quantum processor:', error);
                // Play error sound
                zzfx(1, 0, 100, 0.1, 0.1, 0.1, 0, 1.5, 0.2, 2, 0, 0, 0, 0, 0, 0, 0.1, 0.2, 0.1);
                return; // Prevent further execution if there was an error
            }

            // Use functional update to ensure we have the latest state
            setSlots((prevSlots) => {
                // Check if slot is already active
                if (prevSlots[index]?.active) {
                    return prevSlots;
                }

                const newSlots = [...prevSlots];

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

                // Filter out used abilities from standard abilities
                const availableAbilities = standardAbilities.filter((a) => !usedAbilities.has(a));

                // If this is the last available slot, make it QuantumMarket
                if (availableAbilities.length === 0) {
                    newSlots[index] = {
                        ...newSlots[index],
                        ability: 'QuantumMarket',
                        active: true,
                        used: true,
                    };
                } else {
                    // Randomly select an available ability
                    const randomIndex = Math.floor(Math.random() * availableAbilities.length);
                    const selectedAbility = availableAbilities[randomIndex];

                    newSlots[index] = {
                        ...newSlots[index],
                        ability: selectedAbility,
                        active: true,
                        used: true,
                    };
                }

                // Calculate new active count (count all active slots)
                const activeCount = newSlots.filter((s) => s.active).length;

                // Update quantum slots used count
                setQuantumSlotsUsed(activeCount);

                // Update status effects to reflect the new active count
                setStatusEffects((prev) => ({
                    ...prev,
                    'Quantum Processor': {
                        ...prev['Quantum Processor'],
                        level: activeCount,
                        quantity: quantumCount - 1, // subtract one processor
                        lastTradeTime: Date.now(),
                        active: activeCount > 0,
                    },
                }));

                return newSlots;
            });
        },
        [quantumCount, setStatusEffects, setQuantumSlotsUsed, subtractQuantumProcessor, slots]
    );

    // Update quantumSlotsUsed when slots change
    useEffect(() => {
        const activeSlots = slots.filter((slot) => slot.active).length;
        setQuantumSlotsUsed(activeSlots);
    }, [slots, setQuantumSlotsUsed]);

    // UI tier is always at least 'medium' for Quantum Setup to be visible
    const uiTier = 'medium';

    // Refs for tracking button hold state
    const isMouseDownRef = useRef(false);
    const soundTimeoutRef = useRef(null);

    return (
        <div className={`quantum-setup ${uiTier}`}>
            <div className="quantum-header">
                <h3>Quantum Processor</h3>
            </div>
            <div className="quantum-toggle-container">
                <div className={`quantum-status ${!quantumPower ? 'status-inactive' : ''}`}>
                    <span className="status-indicator">
                        <span className={`pulse ${quantumPower ? 'active' : ''}`}></span>
                        Quantum {quantumPower ? 'Active' : 'Inactive'}
                    </span>
                    <button
                        className={`quantum-toggle ${quantumPower ? 'enabled' : 'disabled'}`}
                        onMouseDown={() => {
                            let randomDecay = randomFloatRange(0.1337, 0.4269).toFixed(3);
                            // console.log(randomDecay);
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
                                randomDecay, //decay
                                0.24,
                                0.23,
                                0.09,
                                0,
                                840
                            );

                            isMouseDownRef.current = true;
                            soundTimeoutRef.current = setTimeout(() => {
                                if (isMouseDownRef.current) {
                                    // Check if there's at least one active slot before toggling
                                    const activeSlots = slots.filter((slot) => slot.active).length;
                                    if (activeSlots > 0) {
                                        // Only toggle quantum abilities if button was held down long enough and there are active slots
                                        toggleQuantumAbilities((prev) => {
                                            console.log(
                                                'Toggling quantum abilities. Current state:',
                                                prev
                                            );
                                            return !prev;
                                        });

                                        zzfx(
                                            ...[
                                                volumeRef.current,
                                                0,
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
                                    } else {
                                        // Play error sound or provide feedback that no slots are active
                                        zzfx(
                                            ...[
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
                                                0,
                                            ]
                                        );
                                    }
                                }
                            }, 420); // 420ms delay before sound and toggle
                        }}
                        onMouseUp={() => {
                            isMouseDownRef.current = false;
                            if (soundTimeoutRef.current) {
                                clearTimeout(soundTimeoutRef.current);
                                soundTimeoutRef.current = null;
                            }
                        }}
                        onMouseLeave={() => {
                            isMouseDownRef.current = false;
                            if (soundTimeoutRef.current) {
                                clearTimeout(soundTimeoutRef.current);
                                soundTimeoutRef.current = null;
                            }
                        }}
                        title={
                            quantumPower
                                ? 'Disable all quantum abilities'
                                : 'Enable all quantum abilities'
                        }
                    >
                        {quantumPower ? 'Disable' : 'Enable'}
                    </button>
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
