import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AILevelContext = createContext();

export const AILevelProvider = ({ children }) => {
    const [sortMode, setSortMode] = useState(null);
    const [sortAsc, setSortAsc] = useState(true);
    const [courierDrones, setCourierDrones] = useState(0);
    const [improvedAILevel, setimprovedAILevel] = useState(10);
    const [activeEvent, setActiveEvent] = useState(null);

    const handleSort = useCallback(
        (mode) => {
            setSortAsc((prev) => (mode === sortMode ? !prev : true));
            setSortMode(mode);
        },
        [sortMode]
    );

    const aiTier = useMemo(() => {
        if (improvedAILevel <= 0) return 'zero';
        if (improvedAILevel < 5) return 'worthless';
        if (improvedAILevel < 10) return 'awful';
        if (improvedAILevel < 15) return 'bad';
        if (improvedAILevel < 20) return 'verylow';
        if (improvedAILevel < 25) return 'low';
        if (improvedAILevel < 50) return 'medium';
        if (improvedAILevel < 75) return 'high';
        if (improvedAILevel < 100) return 'ultra';
        if (improvedAILevel < 150) return 'newbie';
        if (improvedAILevel < 200) return 'apprentice';
        if (improvedAILevel < 250) return 'journeyman';
        if (improvedAILevel < 300) return 'adventurer';
        if (improvedAILevel < 500) return 'explorer';
        if (improvedAILevel < 1000) return 'professional';
        if (improvedAILevel < 1500) return 'skilled';
        if (improvedAILevel < 2000) return 'knowledgeable';
        if (improvedAILevel < 2500) return 'smart';
        if (improvedAILevel < 5000) return 'expert';
        if (improvedAILevel < 10000) return 'master';
        if (improvedAILevel < 15000) return 'grandmaster';
        if (improvedAILevel < 25000) return 'elite';
        if (improvedAILevel < 50000) return 'legendary';
        if (improvedAILevel < 100000) return 'potential';
        return 'endgame';
    }, [improvedAILevel]);

    return (
        <AILevelContext.Provider
            value={{
                courierDrones,
                handleSort,
                improvedAILevel,
                sortMode,
                sortAsc,
                setCourierDrones,
                setimprovedAILevel,
                aiTier,
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
        </AILevelContext.Provider>
    );
};

export const useAILevel = () => useContext(AILevelContext);
