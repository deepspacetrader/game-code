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
        credits,
        setStatusEffects,
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
            {deliveryQueue && deliveryQueue.length > 0 && (
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

                {improvedUILevel > 100 && <MarketNews />}

                <Event />
                {/* {improvedUILevel >= 25 && } */}

                <div className="market-grid-container" style={{ position: 'relative' }}>
                    {/* Show MarketGrid by default */}

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

                    {/* Show QuantumHover when quantum features are enabled */}
                    {/* {console.log('quantumInventory:', quantumInventory, 'has QuantumHover:', quantumInventory?.includes('QuantumHover'))} */}
                    {/* Debug QuantumHover Container */}
                    {quantumPower && quantumInventory?.includes('QuantumHover') && (
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
                            quantumPower={quantumPower}
                            quantumInventory={quantumInventory}
                            setStatusEffects={setStatusEffects}
                        />
                    )}
                    {quantumPower &&
                        quantumInventory?.some((q) => q.startsWith('QuantumScan')) &&
                        (() => {
                            return (
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
                                    }}
                                >
                                    <QuantumScan
                                        marketRef={marketGridRef}
                                        quantumPower={quantumPower}
                                        quantumInventory={quantumInventory}
                                        displayCells={displayCells}
                                        inventory={inventory}
                                        handleBuyClick={handleBuyClick}
                                        handleSellAll={handleSellAll}
                                        credits={credits}
                                    />
                                </div>
                            );
                        })()}
                </div>
            </div>
        </div>
    );
};

export default TradingArea;
