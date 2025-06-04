import React, { useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import MarketGrid from '../Market/MarketGrid';
import MarketSummary from '../Market/MarketSummary';
import QuantumHover from '../Quantum/QuantumHover';
import QuantumScan from '../Quantum/QuantumScan';
import Event from '../Reusable/Event';
import MarketNews from '../Market/MarketNews';
import '../PlayerHUD.scss';

const TradingArea = () => {
    const marketGridRef = useRef(null);
    const {
        displayCells,
        numCellsX,
        statusEffects,
        inventory,
        purchaseHistory,
        priceHistory,
        currentTrader,
        handleBuyClick,
        handleSellClick,
        handleSellAll,
        deliveryQueue,
        quantumInventory = [],
        updateLastQuantumTradeTime,
        quantumPower,
    } = useMarketplace();

    const { improvedUILevel } = useUI();

    // derive UI tier
    const uiTier =
        improvedUILevel < 5
            ? 'low low5'
            : improvedUILevel < 10
            ? 'low low10'
            : improvedUILevel < 15
            ? 'low low15'
            : improvedUILevel < 25
            ? 'low low25'
            : improvedUILevel < 50
            ? 'medium'
            : improvedUILevel < 75
            ? 'high'
            : improvedUILevel < 100
            ? 'ultra'
            : improvedUILevel < 150
            ? 'newbie'
            : improvedUILevel < 200
            ? 'apprentice'
            : improvedUILevel < 300
            ? 'adventurer'
            : improvedUILevel < 500
            ? 'explorer'
            : improvedUILevel < 1000
            ? 'professional'
            : improvedUILevel < 1500
            ? 'skilled'
            : improvedUILevel < 2000
            ? 'knowledgeable'
            : improvedUILevel < 2500
            ? 'smart'
            : improvedUILevel < 5000
            ? 'expert'
            : improvedUILevel < 10000
            ? 'master'
            : improvedUILevel < 15000
            ? 'grandmaster'
            : improvedUILevel < 25000
            ? 'elite'
            : improvedUILevel < 50000
            ? 'legendary'
            : improvedUILevel < 100000
            ? 'potential'
            : 'endgame';

    return (
        <div className={`trading-area ui-tier-${uiTier}`}>
            {/* delivery progress bars */}
            {deliveryQueue.length > 0 && (
                <div className="delivery-bars">
                    {deliveryQueue.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="delivery-bar-container">
                            <div
                                className="delivery-bar"
                                style={{ width: `${(item.timeLeft / item.totalTime) * 100}%` }}
                            />
                        </div>
                    ))}
                </div>
            )}
            <div className="market-container">
                <MarketSummary handleSellAll={handleSellAll} />
                <MarketNews />

                <Event />
                {/* {improvedUILevel >= 25 && } */}

                <div className="market-grid-container" style={{ position: 'relative' }}>
                    {/* Show MarketGrid by default */}
                    <div className="market-grid-container">
                        <MarketGrid
                            ref={marketGridRef}
                            displayCells={displayCells}
                            numCellsX={numCellsX}
                            statusEffects={statusEffects}
                            inventory={inventory}
                            purchaseHistory={purchaseHistory}
                            priceHistory={priceHistory}
                            currentTrader={currentTrader}
                            deliveryQueue={deliveryQueue}
                            handleBuyClick={handleBuyClick}
                            handleSellClick={handleSellClick}
                        />
                    </div>
                    {/* Show QuantumHover when quantum features are enabled */}
                    {/* {console.log('quantumInventory:', quantumInventory, 'has QuantumHover:', quantumInventory?.includes('QuantumHover'))} */}
                    {/* Debug QuantumHover Container */}
                    {quantumPower && quantumInventory?.includes('QuantumHover') && (
                        <div
                            style={{
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                zIndex: 1000,
                                pointerEvents: 'none',
                                border: '2px dashed rgba(0, 255, 0, 0.5)',
                            }}
                        >
                            <QuantumHover
                                market={MarketGrid}
                                displayCells={displayCells}
                                numCellsX={numCellsX}
                                statusEffects={statusEffects}
                                inventory={inventory}
                                purchaseHistory={purchaseHistory}
                                priceHistory={priceHistory}
                                currentTrader={currentTrader}
                                deliveryQueue={deliveryQueue}
                                handleBuyClick={handleBuyClick}
                                handleSellClick={handleSellClick}
                                handleSellAll={handleSellAll}
                                updateLastQuantumTradeTime={updateLastQuantumTradeTime}
                            />
                        </div>
                    )}
                    {quantumPower && quantumInventory?.includes('QuantumScan') && (
                        <div
                            className="quantum-scan-container"
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 1000,
                                pointerEvents: 'none',
                                backgroundColor: 'rgba(0, 255, 0, 0.1)', // Add background for visibility
                                border: '2px solid red', // Add border for visibility
                            }}
                        >
                            <QuantumScan
                                marketRef={marketGridRef}
                                quantumPower={quantumPower}
                                quantumInventory={quantumInventory}
                                displayCells={displayCells}
                                numCellsX={numCellsX}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TradingArea;
