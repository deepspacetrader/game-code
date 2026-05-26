import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const StatusEffectsContext = createContext();

export const useStatusEffects = () => {
    const context = useContext(StatusEffectsContext);
    if (!context) {
        throw new Error('useStatusEffects must be used within a StatusEffectsProvider');
    }
    return context;
};

export const StatusEffectsProvider = ({ children }) => {
    const [statusEffects, setStatusEffects] = useState({});
    const [statEffects, setStatEffects] = useState([]);

    const applyEffect = useCallback((name, duration, onActivate) => {
        const expire = Date.now() + duration;
        setStatusEffects((prev) => ({ ...prev, [name]: expire }));
        if (onActivate) onActivate(duration);
    }, []);

    const removeEffect = useCallback((name) => {
        setStatusEffects((prev) => {
            const copy = { ...prev };
            delete copy[name];
            return copy;
        });
    }, []);

    const addStatEffect = useCallback((name, delta) => {
        const id = Date.now() + Math.random();
        setStatEffects((prev) => [...prev, { id, name, delta }]);
        setTimeout(() => 
            setStatEffects((prev) => prev.filter((e) => e.id !== id)), 
            3000
        );
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        statusEffects,
        statEffects,
        applyEffect,
        removeEffect,
        addStatEffect
    }), [statusEffects, statEffects, applyEffect, removeEffect, addStatEffect]);

    return (
        <StatusEffectsContext.Provider value={contextValue}>
            {children}
        </StatusEffectsContext.Provider>
    );
};
