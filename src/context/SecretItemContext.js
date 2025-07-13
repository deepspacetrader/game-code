import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import secretItemsData from '../data/secret-items.json';
import tradersData from '../data/traders.json';

const SecretItemContext = createContext();

export const SecretItemProvider = ({ currentTrader, children }) => {
    // Track which traders' addictions have been discovered
    const [discoveredAddictions, setDiscoveredAddictions] = useState({}); // { [traderId]: true }
    // Track randomized secret items for the current trader
    const [randomizedSecretItems, setRandomizedSecretItems] = useState([]);
    // Helper to shuffle array
    const shuffleArray = (array) => {
        const arr = array.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };
    // Update randomized secret items when currentTrader changes
    useEffect(() => {
        const traderObj = tradersData.traders.find((t) => t.traderId === currentTrader);
        const addictedSecretId = traderObj ? traderObj.secretAddiction : null;
        const filteredSecretItems = secretItemsData.secretItems.filter(
            (item) => item.secretItemId !== addictedSecretId
        );
        setRandomizedSecretItems(shuffleArray(filteredSecretItems).slice(0, 6));
    }, [currentTrader]);
    // Mark a trader's addiction as discovered
    const markAddictionDiscovered = useCallback((traderId) => {
        setDiscoveredAddictions((prev) => ({ ...prev, [traderId]: true }));
    }, []);
    return (
        <SecretItemContext.Provider
            value={{
                discoveredAddictions,
                randomizedSecretItems,
                markAddictionDiscovered,
            }}
        >
            {children}
        </SecretItemContext.Provider>
    );
};

export const useSecretItems = () => {
    const context = useContext(SecretItemContext);
    if (!context) {
        throw new Error('useSecretItems must be used within a SecretItemProvider');
    }
    return context;
};
