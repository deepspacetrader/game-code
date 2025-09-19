import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useMarketplace } from './MarketplaceContext';
import { QuantumProvider } from './QuantumContext';

export const GameStateProvider = ({ children }) => {
    // Get inventory from MarketplaceContext with memoization
    const { inventory } = useMarketplace();
    
    // Shared state that both providers need
    const [quantumPower, setQuantumPower] = useState(false);
    const [quantumSlotsUsed, setQuantumSlotsUsed] = useState(0);
    const [quantumProcessors, setQuantumProcessors] = useState(0);
    const [quantumInventory, setQuantumInventory] = useState([]);

    // Helper function to get total quantum processors
    const getTotalQuantumProcessors = useCallback((inventory, slots) => {
        const qp = inventory?.find((i) => i?.name === 'Quantum Processor');
        return (qp ? qp.quantity : 0) + (slots || 0);
    }, []);

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

    // Memoize the context values to prevent unnecessary re-renders
    const quantumValue = useMemo(() => ({
        // Quantum state
        quantumPower,
        setQuantumPower,
        quantumSlotsUsed,
        setQuantumSlotsUsed,
        quantumProcessors,
        setQuantumProcessors,
        quantumInventory,
        setQuantumInventory,
        
        // Helper functions
        getTotalQuantumProcessors,
        updateQuantumProcessorsCount,
        
        // Pass the current inventory from MarketplaceContext
        inventory,
        
        // Pass marketplace context
        marketplace: { inventory, setQuantumSlotsUsed }
    }), [
        quantumPower,
        quantumSlotsUsed,
        quantumProcessors,
        quantumInventory,
        getTotalQuantumProcessors,
        updateQuantumProcessorsCount,
        inventory
    ]);

    return (
        <QuantumProvider value={quantumValue}>
            {children}
        </QuantumProvider>
    );
};

export default GameStateProvider;
