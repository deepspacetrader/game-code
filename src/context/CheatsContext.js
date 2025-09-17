import React, { createContext, useContext, useState, useCallback } from 'react';
import { useMarketplace } from './MarketplaceContext';
import { useQuantum } from './QuantumContext';

const CheatsContext = createContext();

export const CheatsProvider = ({ children }) => {
    const { 
        setCredits, 
        setInventory, 
        setHealth, 
        items, 
        maxHealth,
        setCurrentEnemy,
        setCurrentGameEvent
    } = useMarketplace();
    
    const { setQuantumInventory } = useQuantum();
    const [isCheater, setIsCheater] = useState(false);

    // Add quantum processors to inventory
    const addQuantumProcessors = useCallback((amount) => {
        if (amount <= 0) return;

        setInventory((inv) => {
            const existing = inv.find((i) => i.name === 'Quantum Processor');
            const currentQty = existing ? existing.quantity || 0 : 0;
            const qpDef = items.find((i) => i.name === 'Quantum Processor');
            if (!qpDef) return inv;

            const newInv = existing
                ? inv.map((i) =>
                      i.name === 'Quantum Processor'
                          ? { ...qpDef, ...i, quantity: currentQty + amount }
                          : i
                  )
                : [...inv, { ...qpDef, quantity: amount }];

            return newInv;
        });
    }, [items, setInventory]);

    // Remove quantum processors from inventory
    const subtractQuantumProcessor = useCallback((amount = 1) => {
        return new Promise((resolve) => {
            setInventory((inv) => {
                const existingIndex = inv.findIndex((i) => i.name === 'Quantum Processor');
                if (existingIndex === -1) {
                    resolve(false);
                    return inv;
                }

                const existing = inv[existingIndex];
                if (existing.quantity < amount) {
                    resolve(false);
                    return inv;
                }

                const newQuantity = existing.quantity - amount;

                if (newQuantity > 0) {
                    // Update quantity if there are still processors left
                    const newInv = [...inv];
                    newInv[existingIndex] = {
                        ...existing,
                        quantity: newQuantity,
                    };
                    resolve(true);
                    return newInv;
                } else {
                    // Remove the item if quantity reaches zero
                    const newInv = inv.filter((_, i) => i !== existingIndex);
                    resolve(true);
                    return newInv;
                }
            });
        });
    }, [setInventory]);

    // Reset quantum processors (used when removing cheater status)
    const resetQuantumProcessors = useCallback(() => {
        setInventory((inv) =>
            inv.map((i) => (i.name === 'Quantum Processor' ? { ...i, quantity: 0 } : i))
        );
        setQuantumInventory([]);
    }, [setInventory, setQuantumInventory]);

    // Add credits
    const addCredits = useCallback((amount) => {
        setCredits(prev => prev + amount);
    }, [setCredits]);

    // Set health to max
    const healToMax = useCallback(() => {
        setHealth(maxHealth);
    }, [maxHealth, setHealth]);

    // Toggle cheater status
    const toggleCheaterStatus = useCallback((status) => {
        const newStatus = status !== undefined ? status : !isCheater;
        setIsCheater(newStatus);
        
        // If disabling cheats, reset quantum processors
        if (!newStatus) {
            resetQuantumProcessors();
        }
        
        return newStatus;
    }, [isCheater, resetQuantumProcessors]);

    // Clear current enemy
    const clearEnemy = useCallback(() => {
        setCurrentEnemy(null);
    }, [setCurrentEnemy]);

    // Clear current game event
    const clearGameEvent = useCallback(() => {
        setCurrentGameEvent(null);
    }, [setCurrentGameEvent]);

    const value = {
        isCheater,
        setIsCheater: toggleCheaterStatus,
        addQuantumProcessors,
        subtractQuantumProcessor,
        resetQuantumProcessors,
        addCredits,
        healToMax,
        clearEnemy,
        clearGameEvent
    };

    return (
        <CheatsContext.Provider value={value}>
            {children}
        </CheatsContext.Provider>
    );
};

export const useCheats = () => {
    const context = useContext(CheatsContext);
    if (context === undefined) {
        throw new Error('useCheats must be used within a CheatsProvider');
    }
    return context;
};

export default CheatsContext;