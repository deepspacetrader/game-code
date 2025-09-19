import React, { createContext, useCallback, useEffect, useMemo, useState, useContext } from 'react';
import { useMarketplace } from './MarketplaceContext';
import { zzfx } from 'zzfx';

const QuantumContext = createContext();

export const QuantumProvider = ({ children }) => {
    const { inventory, setInventory } = useMarketplace() || {};
    const { marketplace } = useMarketplace() || {};
    const { isJumping } = marketplace || {};

    // Quantum state
    const [quantumPower, setQuantumPower] = useState(false);
    const [quantumSlotsUsed, setQuantumSlotsUsed] = useState(0);
    const [quantumProcessors, setQuantumProcessors] = useState(0);
    const [quantumInventory, setQuantumInventory] = useState([]);
    const [isQuantumHoverEnabled, setIsQuantumHoverEnabled] = useState(false);
    const [isQuantumScanActive, setIsQuantumScanActive] = useState(false);
    const [lastQuantumTradeTime, setLastQuantumTradeTime] = useState(0);

    // Get total quantum processors (inventory + quantumSlotsUsed)
    const getTotalQPs = useCallback(
        (inv = inventory, slots = quantumSlotsUsed) => {
            const qp = inv?.find((i) => i?.name === 'Quantum Processor');
            return (qp ? qp.quantity : 0) + (slots || 0);
        },
        [inventory, quantumSlotsUsed]
    );

    // Alias for getTotalQPs to maintain backward compatibility
    const getTotalQuantumProcessors = getTotalQPs;
    
    // Update quantum processors count
    const updateQuantumProcessorsCount = useCallback((inventoryToCheck) => {
        if (!inventoryToCheck) return;
        
        const qp = inventoryToCheck.find((i) => i?.name === 'Quantum Processor');
        const qpCount = qp?.quantity || 0;
        const newQuantumProcessors = Math.min(
            qpCount,
            getTotalQuantumProcessors(inventoryToCheck, quantumSlotsUsed)
        );
        setQuantumProcessors(newQuantumProcessors);
    }, [getTotalQuantumProcessors, quantumSlotsUsed]);
    
    // Initialize quantum processors count when inventory changes
    useEffect(() => {
        if (inventory) {
            updateQuantumProcessorsCount(inventory);
        }
    }, [inventory, updateQuantumProcessorsCount]);

    // Add a quantum ability to the inventory
    const addQuantumAbility = useCallback(
        (ability) => {
            setQuantumInventory?.((prev) => [...new Set([...prev, ability])]); // Use Set to avoid duplicates
        },
        [setQuantumInventory]
    );

    // Remove a quantum ability from the inventory
    const removeQuantumAbility = useCallback(
        (ability) => {
            setQuantumInventory?.((prev) => prev.filter((a) => a !== ability));
        },
        [setQuantumInventory]
    );

    // Toggle quantum scan
    const toggleQuantumScan = useCallback(() => {
        if (isJumping) return;
        setIsQuantumScanActive((prev) => !prev);
    }, [isJumping]);

    // Toggle quantum power
    const toggleQuantumAbilities = useCallback(
        (enabled) => {
            if (isJumping) return;
            // If enabled is not provided, toggle the current state
            const newState = enabled !== undefined ? enabled : !quantumPower;
            // console.log('Toggling quantum power to:', newState);
            setQuantumPower?.(newState);
            return newState;
        },
        [isJumping, quantumPower, setQuantumPower]
    );

    // Check if quantum trade can be performed (commented out as it's not currently used)
    // const checkQuantumTradeDelay = useCallback(() => {
    //     const currentTime = Date.now();
    //     const timeSinceLastTrade = currentTime - lastQuantumTradeTime;
    //     return timeSinceLastTrade >= MIN_QUANTUM_TRADE_DELAY;
    // }, [lastQuantumTradeTime]);

    // Update last quantum trade time
    const updateLastQuantumTradeTime = useCallback(() => {
        setLastQuantumTradeTime(Date.now());
    }, []);

    // Check quantum trade delay convenience helper
    const checkQuantumTradeDelay = useCallback((minDelayMs = 1000) => {
        const currentTime = Date.now();
        return currentTime - lastQuantumTradeTime >= minDelayMs;
    }, [lastQuantumTradeTime]);

    // Add quantum processors
    const addQuantumProcessors = useCallback((count, inv = inventory) => {
        if (!inv) return;

        const newInventory = [...inv];
        const qpIndex = newInventory.findIndex((i) => i.name === 'Quantum Processor');

        if (qpIndex >= 0) {
            newInventory[qpIndex] = {
                ...newInventory[qpIndex],
                quantity: newInventory[qpIndex].quantity + count,
            };
        } else {
            newInventory.push({
                name: 'Quantum Processor',
                quantity: count,
            });
        }

        // Update the inventory through setInventory if available
        if (setInventory) {
            setInventory(newInventory);
        }

        return newInventory;
    }, [inventory, setInventory]);

    // Remove quantum processors from inventory
    const subtractQuantumProcessor = useCallback(
        async (amount, inv = inventory) => {
            if (!inv) return false;

            const qpIndex = inv.findIndex((i) => i && i.name === 'Quantum Processor');
            if (qpIndex < 0) return false; // No quantum processors found

            const currentQPs = inv[qpIndex].quantity;
            if (currentQPs < amount) return false; // Not enough quantum processors

            const newQuantity = Math.max(0, currentQPs - amount);

            // Update the main inventory through setInventory
            if (setInventory) {
                setInventory(prevInv => {
                    const updatedInv = [...prevInv];
                    const qpIndex = updatedInv.findIndex(i => i && i.name === 'Quantum Processor');
                    
                    if (qpIndex >= 0) {
                        if (newQuantity > 0) {
                            updatedInv[qpIndex] = {
                                ...updatedInv[qpIndex],
                                quantity: newQuantity,
                            };
                        } else {
                            // Remove the quantum processor entry if quantity reaches 0
                            updatedInv.splice(qpIndex, 1);
                        }
                    }
                    
                    return updatedInv;
                });
            }

            // Update the quantum processors count
            setQuantumProcessors?.(Math.max(0, currentQPs - amount));
            return true;
        },
        [inventory, setInventory, setQuantumProcessors]
    );

    // Reset quantum processors
    const resetQuantumProcessors = useCallback(() => {
        setQuantumProcessors?.(0);
        setQuantumSlotsUsed?.(0);
    }, [setQuantumProcessors, setQuantumSlotsUsed]);

    // Keep quantum processors count in sync with inventory changes only
    // (quantumInventory holds ability names, not items)
    useEffect(() => {
        if (inventory && updateQuantumProcessorsCount) {
            updateQuantumProcessorsCount(inventory);
        }
    }, [inventory, updateQuantumProcessorsCount]);

    // Check if quantum buy is allowed
    const canQuantumBuy = useCallback(() => {
        return true;
    }, []);

    // Check if quantum sell is allowed
    const canQuantumSell = useCallback(() => {
        return true;
    }, []);

    // Effect to handle quantum trading when quantum power is active
    useEffect(() => {
        if (!quantumPower) {
            console.log('Quantum power is off, stopping trading');
            return;
        }
        
        // Only proceed if we have quantum processors in slots
        if (quantumSlotsUsed <= 0) {
            console.log('No quantum processors in slots, stopping trading');
            return;
        }
        
        console.log('Starting quantum trading with', quantumSlotsUsed, 'processors');
        
        // Function to execute a single trade sequence
        const executeTradeSequence = () => {
            if (!quantumPower) {
                console.log('Quantum power turned off during trade sequence');
                return;
            }
            
            // Get fresh references to the buttons each time
            const quantumMarket = document.querySelector('.quantum-market');
            if (!quantumMarket) {
                console.log('Quantum market not found');
                return;
            }
            
            const executeSellBtn = quantumMarket.querySelector('[data-testid="q-sell-button"]');
            const executeBuyBtn = quantumMarket.querySelector('[data-testid="q-buy-button"]');
            const executeTradeBtn = quantumMarket.querySelector('.execute-trade');
            
            if (!executeSellBtn || !executeBuyBtn || !executeTradeBtn) {
                console.log('One or more trade buttons not found');
                return;
            }
            
            console.log('Executing trade sequence');
            
            // Execute a sequence of trades with delays between them
            const tradeActions = [
                { button: executeSellBtn, name: 'Sell' },
                { button: executeBuyBtn, name: 'Buy' },
                { button: executeTradeBtn, name: 'Trade' }
            ];
            
            // Execute each action with a small delay between them
            tradeActions.forEach((action, index) => {
                setTimeout(() => {
                    if (!quantumPower) return; // Stop if power was turned off
                    
                    console.log('Executing', action.name, 'action');
                    action.button.click();
                    
                    // Play a subtle sound to indicate a trade
                    zzfx(
                        0.3,    // volume
                        0,      // frequency
                        0.05,   // attack
                        0.1,    // decay
                        0.1,    // sustain
                        0.1,    // release
                        1,      // shape (sine)
                        0,      // pan
                        0,      // vibrato
                        0,      // vibrato speed
                        0,      // vibrato depth
                        0,      // delay
                        0,      // reverb
                        0,      // noise
                        0.1,    // filter frequency
                        0.1,    // filter resonance
                        0,      // filter type
                        0       // filter delay
                    );
                }, index * 500); // 500ms delay between actions
            });
        };
        
        // Set up the trading interval
        const interval = setInterval(() => {
            if (!quantumPower) {
                console.log('Quantum power turned off, stopping trading');
                clearInterval(interval);
                return;
            }
            
            executeTradeSequence();
            
        }, 5000); // Run the full trade cycle every 5 seconds
        
        // Clean up the interval on component unmount or when dependencies change
        return () => {
            console.log('Cleaning up quantum trading interval');
            clearInterval(interval);
        };
    }, [quantumPower, quantumSlotsUsed]);

    // Context value
    const value = useMemo(
        () => ({
            // State
            quantumInventory,
            quantumPower,
            quantumProcessors,
            quantumSlotsUsed,
            isQuantumHoverEnabled,
            isQuantumScanActive,
            lastQuantumTradeTime,

            // Setters
            setQuantumInventory,
            setQuantumPower,
            setQuantumProcessors,
            setQuantumSlotsUsed,
            setIsQuantumHoverEnabled,
            setIsQuantumScanActive,
            setLastQuantumTradeTime,

            // Methods
            addQuantumAbility,
            removeQuantumAbility,
            toggleQuantumScan,
            toggleQuantumAbilities,
            addQuantumProcessors,
            subtractQuantumProcessor,
            resetQuantumProcessors,
            getTotalQuantumProcessors,
            // Back-compat and helpers
            updateQuantumProcessors: updateQuantumProcessorsCount,
            updateLastQuantumTradeTime,
            checkQuantumTradeDelay,
            canQuantumBuy,
            canQuantumSell,
        }),
        [
            quantumInventory,
            quantumPower,
            quantumProcessors,
            quantumSlotsUsed,
            isQuantumHoverEnabled,
            isQuantumScanActive,
            lastQuantumTradeTime,
            addQuantumAbility,
            removeQuantumAbility,
            toggleQuantumScan,
            toggleQuantumAbilities,
            addQuantumProcessors,
            subtractQuantumProcessor,
            resetQuantumProcessors,
            getTotalQuantumProcessors,
            updateQuantumProcessorsCount,
            updateLastQuantumTradeTime,
            checkQuantumTradeDelay,
            canQuantumBuy,
            canQuantumSell,
        ]
    );

    return <QuantumContext.Provider value={value}>{children}</QuantumContext.Provider>;
};

export const useQuantum = () => {
    const context = useContext(QuantumContext);
    if (!context) {
        throw new Error('useQuantum must be used within a QuantumProvider');
    }
    return context;
};

export default QuantumContext;
