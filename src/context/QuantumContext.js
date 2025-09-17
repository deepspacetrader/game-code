import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { MIN_QUANTUM_TRADE_DELAY } from '../utils/constants';

const QuantumContext = createContext();

// Helper: Count Quantum Processors (inventory + quantumSlotsUsed)
const getTotalQuantumProcessors = (inventory, quantumSlotsUsed) => {
    const qp = inventory?.find((i) => i.name === 'Quantum Processor');
    return (qp ? qp.quantity : 0) + (quantumSlotsUsed || 0);
};

export const QuantumProvider = ({ children, setInventory }) => {
    // Quantum system state
    const [quantumInventory, setQuantumInventory] = useState([]);
    const [quantumPower, setQuantumPower] = useState(false);
    const [isQuantumHoverEnabled, setIsQuantumHoverEnabled] = useState(false);
    const [isQuantumScanActive, setIsQuantumScanActive] = useState(false);
    const [quantumSlotsUsed, setQuantumSlotsUsed] = useState(0);
    const [lastQuantumTradeTime, setLastQuantumTradeTime] = useState(0);
    const [quantumProcessors, setQuantumProcessors] = useState(0);

    // Add a quantum ability to the inventory
    const addQuantumAbility = useCallback((ability) => {
        setQuantumInventory((prev) => [...new Set([...prev, ability])]); // Use Set to avoid duplicates
    }, []);

    // Remove a quantum ability from the inventory
    const removeQuantumAbility = useCallback((ability) => {
        setQuantumInventory((prev) => prev.filter((a) => a !== ability));
    }, []);

    // Toggle quantum scan
    const toggleQuantumScan = useCallback(() => {
        setIsQuantumScanActive((prev) => !prev);
    }, []);

    // Toggle all quantum abilities
    const toggleQuantumAbilities = useCallback(() => {
        if (quantumSlotsUsed >= 1) {
            setQuantumPower((prev) => {
                let newState = false;
                if (typeof prev === 'undefined') {
                    newState = true;
                } else {
                    newState = !prev;
                }
                return newState;
            });
        }
    }, [quantumSlotsUsed]);

    // Check if quantum trade can be performed
    const checkQuantumTradeDelay = useCallback(() => {
        const currentTime = Date.now();
        const timeSinceLastTrade = currentTime - lastQuantumTradeTime;
        return timeSinceLastTrade >= MIN_QUANTUM_TRADE_DELAY;
    }, [lastQuantumTradeTime]);

    // Update last quantum trade time
    const updateLastQuantumTradeTime = useCallback(() => {
        setLastQuantumTradeTime(Date.now());
    }, []);

    // Update quantum processors count
    const updateQuantumProcessors = useCallback((count, inventory = [], items = []) => {
        // Don't do anything if count is negative
        if (count < 0) return;

        // If inventory and items are provided, update the inventory
        if (inventory.length > 0 && items.length > 0) {
            const qpDef = items.find((i) => i.name === 'Quantum Processor');
            if (!qpDef) return; // Defensive

            // If count is 0, remove all quantum processors
            if (count === 0) {
                return inventory.filter((i) => i.name !== 'Quantum Processor');
            }

            // For positive counts, update or add the processors
            const existing = inventory.find((i) => i.name === 'Quantum Processor');
            const updatedInv = existing
                ? inventory.map((i) =>
                      i.name === 'Quantum Processor' ? { ...qpDef, ...i, quantity: count } : i
                  )
                : [...inventory, { ...qpDef, quantity: count }];

            // Update the inventory and quantumProcessors state
            setInventory(updatedInv);
            setQuantumProcessors(count);
            return updatedInv;
        } else {
            // Just update the count if no inventory/items provided
            setQuantumProcessors(count);
            return null;
        }
    }, []);

    // Get total quantum processors (inventory + quantumSlotsUsed)
    const getTotalQPs = useCallback(
        (inv = [], slots = quantumSlotsUsed) => {
            const qp = inv?.find((i) => i.name === 'Quantum Processor');
            return (qp ? qp.quantity : 0) + (slots || 0);
        },
        [quantumSlotsUsed]
    );

    // Expose the standalone getTotalQuantumProcessors function
    const getTotalQuantumProcessorsExposed = useCallback(
        (inv = [], slots = quantumSlotsUsed) => {
            const qp = inv?.find((i) => i.name === 'Quantum Processor');
            return (qp ? qp.quantity : 0) + (slots || 0);
        },
        [quantumSlotsUsed]
    );

    // Add quantum processors to inventory
    const addQuantumProcessors = useCallback(
        async (amount = 1, inventory = [], items = []) => {
            if (amount <= 0) return false;
            const newQPs = quantumProcessors + amount;
            await updateQuantumProcessors(newQPs, inventory, items);
            return true;
        },
        [quantumProcessors, updateQuantumProcessors]
    );

    // Remove quantum processors from inventory
    const subtractQuantumProcessor = useCallback(
        async (amount = 1, inventory = [], items = []) => {
            if (amount <= 0) return false;

            const currentQPs = quantumProcessors;
            if (currentQPs < amount) return false;

            const newQPs = currentQPs - amount;
            await updateQuantumProcessors(newQPs, inventory, items);
            return true;
        },
        [quantumProcessors, updateQuantumProcessors]
    );

    // cheat - reset quantum processors after removing cheater status
    const resetQuantumProcessors = useCallback(() => {
        setInventory((inv) =>
            inv.map((i) => (i.name === 'Quantum Processor' ? { ...i, quantity: 0 } : i))
        );
    }, [setInventory]);

    // Context value
    const value = useMemo(
        () => ({
            quantumInventory,
            quantumPower,
            isQuantumHoverEnabled,
            isQuantumScanActive,
            quantumSlotsUsed,
            quantumProcessors,
            lastQuantumTradeTime,
            addQuantumAbility,
            removeQuantumAbility,
            toggleQuantumScan,
            toggleQuantumAbilities,
            checkQuantumTradeDelay,
            updateLastQuantumTradeTime,
            updateQuantumProcessors,
            getTotalQPs,
            getTotalQuantumProcessors: getTotalQuantumProcessorsExposed,
            setQuantumInventory,
            setQuantumPower,
            setIsQuantumHoverEnabled,
            setIsQuantumScanActive,
            setQuantumSlotsUsed,
            setQuantumProcessors,
            addQuantumProcessors,
            subtractQuantumProcessor,
            resetQuantumProcessors,
        }),
        [
            quantumInventory,
            quantumPower,
            isQuantumHoverEnabled,
            isQuantumScanActive,
            quantumSlotsUsed,
            quantumProcessors,
            lastQuantumTradeTime,
            addQuantumAbility,
            removeQuantumAbility,
            toggleQuantumScan,
            toggleQuantumAbilities,
            checkQuantumTradeDelay,
            updateLastQuantumTradeTime,
            updateQuantumProcessors,
            getTotalQPs,
            getTotalQuantumProcessorsExposed,
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
