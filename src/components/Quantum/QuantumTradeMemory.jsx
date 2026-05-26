import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import '../PlayerHUD.scss';

const QuantumTradeMemory = () => {
    const { quantumInventory } = useMarketplace();
    if (!quantumInventory || quantumInventory.length === 0) return null;

    return (
        <div className="quantum-trade-memory">
            <h3>Quantum Trade Memory</h3>
            <ul className="quantum-list">
                {quantumInventory.map((item) => (
                    <li key={item.name} className="quantum-item">
                        {item.name}: {item.quantity}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default QuantumTradeMemory;
