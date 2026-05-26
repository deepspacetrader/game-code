import React, { createContext, useContext, useState, useCallback } from 'react';
import { useMarketplace } from './MarketplaceContext';
import { useQuantum } from './QuantumContext';

const CheatsContext = createContext();

export const CheatsProvider = ({ children }) => {
    const { setCredits, setInventory, setHealth, items, maxHealth } = useMarketplace();

    const { resetQuantumProcessors } = useQuantum();
    const [isCheater, setIsCheater] = useState(false);

    // Add quantum processors to inventory
    const CHEAT_addQuantumProcessors = useCallback(
        (amount) => {
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
        },
        [items, setInventory]
    );

    // Add credits
    const CHEAT_addCredits = useCallback(
        (amount) => {
            setCredits((prev) => prev + amount);
        },
        [setCredits]
    );

    // Set health to max
    const CHEAT_healToMax = useCallback(() => {
        setHealth(maxHealth);
    }, [maxHealth, setHealth]);

    // Toggle cheater status
    const toggleCheaterStatus = useCallback(
        (status) => {
            const newStatus = status !== undefined ? status : !isCheater;
            setIsCheater(newStatus);

            // If disabling cheats, reset quantum processors
            if (!newStatus) {
                resetQuantumProcessors();
            }

            return newStatus;
        },
        [isCheater, resetQuantumProcessors]
    );

    const value = {
        isCheater,
        setIsCheater: toggleCheaterStatus,
        CHEAT_addQuantumProcessors,
        CHEAT_addCredits,
        CHEAT_healToMax,
    };

    return <CheatsContext.Provider value={value}>{children}</CheatsContext.Provider>;
};

export const useCheats = () => {
    const context = useContext(CheatsContext);
    if (context === undefined) {
        throw new Error('useCheats must be used within a CheatsProvider');
    }
    return context;
};

export default CheatsContext;
