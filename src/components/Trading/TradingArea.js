import React, { useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import MarketGrid from '../Market/MarketGrid';
import MarketSummary from '../Market/MarketSummary';
import QuantumHover from '../Quantum/QuantumHover';
import QuantumScan from '../Quantum/QuantumScan';
import Event from '../Reusable/Event';
import MarketNews from '../Market/MarketNews';
import MarketBreakingNews from '../Market/MarketBreakingNews';

import QuantumMarket from '../Quantum/QuantumMarket';
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

    const { improvedAILevel } = useAILevel();

    // derive AI tier
    const aiTier =
        improvedAILevel < 5
            ? 'low low5'
            : improvedAILevel < 10
            ? 'low low10'
            : improvedAILevel < 15
            ? 'low low15'
            : improvedAILevel < 25
            ? 'low low25'
            : improvedAILevel < 50
            ? 'medium'
            : improvedAILevel < 75
            ? 'high'
            : improvedAILevel < 100
            ? 'ultra'
            : improvedAILevel < 150
            ? 'newbie'
            : improvedAILevel < 200
            ? 'apprentice'
            : improvedAILevel < 300
            ? 'adventurer'
            : improvedAILevel < 500
            ? 'explorer'
            : improvedAILevel < 1000
            ? 'professional'
            : improvedAILevel < 1500
            ? 'skilled'
            : improvedAILevel < 2000
            ? 'knowledgeable'
            : improvedAILevel < 2500
            ? 'smart'
            : improvedAILevel < 5000
            ? 'expert'
            : improvedAILevel < 10000
            ? 'master'
            : improvedAILevel < 15000
            ? 'grandmaster'
            : improvedAILevel < 25000
            ? 'elite'
            : improvedAILevel < 50000
            ? 'legendary'
            : improvedAILevel < 100000
            ? 'potential'
            : 'endgame';

    return (
        <div className={`trading-area ai-tier-${aiTier}`}>
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

                <QuantumMarket
                    credits={credits}
                    displayCells={displayCells}
                    inventory={inventory}
                    purchaseHistory={purchaseHistory}
                    handleBuyClick={handleBuyClick}
                    handleSellAll={handleSellAll}
                    quantumInventory={quantumInventory}
                    improvedAILevel={improvedAILevel}
                    quantumPower={quantumPower}
                    statusEffects={statusEffects}
                />

                {improvedAILevel > 100 && (
                    <>
                        <MarketBreakingNews />
                        <MarketNews />
                    </>
                )}

                <Event />
                {/* {improvedAILevel >= 25 && } */}

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
