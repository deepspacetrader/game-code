import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import './TieredMenu.scss';
import { zzfx } from 'zzfx';

const TieredMenu = () => {
    // initialize menu open state for all renders
    const { volumeRef } = useMarketplace();
    const { improvedAILevel, sortMode, sortAsc, handleSort } = useAILevel();

    // determine tier style
    let tierClass = 'tier-medium';
    if (improvedAILevel >= 75) tierClass = 'tier-high';
    if (improvedAILevel >= 100) tierClass = 'tier-ultra';

    return (
        <div className={`tiered-menu ${tierClass}`}>
            <div className="menu-items">
                <button
                    onClick={() => {
                        zzfx(
                            ...[
                                volumeRef.current,
                                1,
                                378,
                                0.24,
                                0.28,
                                0.69,
                                1,
                                4.8,
                                0,
                                -87,
                                193,
                                0.06,
                                0.06,
                                0,
                                236,
                                0.01337,
                                0,
                                0.2,
                                0.32,
                                0.34,
                                0,
                            ]
                        ); // Random 69
                        handleSort('alpha');
                    }}
                >
                    Sort A-Z{sortMode === 'alpha' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
                <button
                    onClick={() => {
                        zzfx(...[volumeRef.current, 0, 500, 0.01, 0, 0.15, 0, 1, 5, 0, 1, 0, 0, 5]);
                        handleSort('price');
                    }}
                >
                    Sort Price{sortMode === 'price' ? (sortAsc ? '↑' : '↓') : ''}
                </button>

                <button
                    onClick={() => {
                        zzfx(...[volumeRef.current, 0, 500, 0.01, 0, 0.15, 0, 0, 0, 0, 0, 0, 0, 5]);
                        handleSort('stock');
                    }}
                >
                    Sort Stock{sortMode === 'stock' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
            </div>
        </div>
    );
};

export default TieredMenu;
