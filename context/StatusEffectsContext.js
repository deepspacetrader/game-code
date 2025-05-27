import React, { createContext, useContext, useState, useCallback } from 'react';

const StatusEffectsContext = createContext();
export const useStatusEffects = () => useContext(StatusEffectsContext);

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

    /**
     * name: stat key (e.g. 'credits'), delta: positive or negative change
     */
    const addStatEffect = useCallback((name, delta) => {
        const id = Date.now() + Math.random();
        setStatEffects((prev) => [...prev, { id, name, delta }]);
        setTimeout(() => setStatEffects((prev) => prev.filter((e) => e.id !== id)), 3000);
    }, []);

    return (
        <StatusEffectsContext.Provider
            value={{ statusEffects, applyEffect, removeEffect, statEffects, addStatEffect }}
        >
            {children}
        </StatusEffectsContext.Provider>
    );
};
