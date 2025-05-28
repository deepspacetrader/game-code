import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import './PlayerHUD.scss';

const ShipModulesPanel = () => {
    const { statusEffects } = useMarketplace();
    const active = statusEffects.filter((e) => e.totalTime > 0);
    if (!active.length) return null;
    return (
        <div className="ship-modules-panel">
            <h4>Ship Modules</h4>
            {active.map((effect) => (
                <div key={effect.id} className="module-item">
                    <span>
                        {effect.name}
                        {effect.quantity > 1 ? ` x${effect.quantity}` : ''}
                    </span>
                    <div
                        className="module-bar"
                        style={{ width: `${(effect.remainingTime / effect.totalTime) * 100}%` }}
                    />
                    <span className="module-timer">{Math.ceil(effect.remainingTime / 1000)}s</span>
                </div>
            ))}
        </div>
    );
};

export default ShipModulesPanel;
