import React, { useContext } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';

const DebugStatus = () => {
    const { currentGameEvent, currentEnemy } = useMarketplace();
    const { showCheats } = useAILevel();

    if (!showCheats) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#0f0',
                fontFamily: 'monospace',
                padding: '4px 8px',
                zIndex: 1000,
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'none',
            }}
        >
            <div>
                <strong>Active Event:</strong> {currentGameEvent?.name || 'None'}
            </div>
            <div>
                <strong>Enemy:</strong> {currentEnemy?.name || 'None'}
            </div>
            <div>
                <strong>Danger Level:</strong> {currentEnemy?.dangerLevel || 0}
            </div>
        </div>
    );
};

export default DebugStatus;
