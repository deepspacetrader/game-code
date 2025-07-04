import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [sortMode, setSortMode] = useState(null);
    const [sortAsc, setSortAsc] = useState(true);
    const [courierDrones, setCourierDrones] = useState(0);
    const [improvedUILevel, setImprovedUILevel] = useState(10);
    const [activeEvent, setActiveEvent] = useState(null);

    const handleSort = useCallback(
        (mode) => {
            setSortAsc((prev) => (mode === sortMode ? !prev : true));
            setSortMode(mode);
        },
        [sortMode]
    );

    const uiTier = useMemo(() => {
        if (improvedUILevel <= 0) return 'zero';
        if (improvedUILevel < 5) return 'worthless';
        if (improvedUILevel < 10) return 'awful';
        if (improvedUILevel < 15) return 'bad';
        if (improvedUILevel < 20) return 'verylow';
        if (improvedUILevel < 25) return 'low';
        if (improvedUILevel < 50) return 'medium';
        if (improvedUILevel < 75) return 'high';
        if (improvedUILevel < 100) return 'ultra';
        if (improvedUILevel < 150) return 'newbie';
        if (improvedUILevel < 200) return 'apprentice';
        if (improvedUILevel < 250) return 'journeyman';
        if (improvedUILevel < 300) return 'adventurer';
        if (improvedUILevel < 500) return 'explorer';
        if (improvedUILevel < 1000) return 'professional';
        if (improvedUILevel < 1500) return 'skilled';
        if (improvedUILevel < 2000) return 'knowledgeable';
        if (improvedUILevel < 2500) return 'smart';
        if (improvedUILevel < 5000) return 'expert';
        if (improvedUILevel < 10000) return 'master';
        if (improvedUILevel < 15000) return 'grandmaster';
        if (improvedUILevel < 25000) return 'elite';
        if (improvedUILevel < 50000) return 'legendary';
        if (improvedUILevel < 100000) return 'potential';
        return 'endgame';
    }, [improvedUILevel]);

    return (
        <UIContext.Provider
            value={{
                courierDrones,
                handleSort,
                improvedUILevel,
                sortMode,
                sortAsc,
                setCourierDrones,
                setImprovedUILevel,
                uiTier,
                // Show a random event
                showEvent: (eventData) => {
                    setActiveEvent({
                        ...eventData,
                        id: `event_${Date.now()}`,
                        timestamp: Date.now(),
                    });
                },
                // Clear the current event
                clearEvent: () => {
                    setActiveEvent(null);
                },
                // Add a floating message
                addFloatingMessage: (message, type = 'info') => {
                    // This would be connected to your floating message system
                    console.log(`[${type}] ${message}`);
                },
                // Buy fuel function
                buyFuel: (amount) => {
                    // This would be connected to your fuel system
                    console.log('Bought fuel:', amount);
                },
                activeEvent,
            }}
        >
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => useContext(UIContext);
