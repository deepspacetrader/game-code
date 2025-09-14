import React, { useCallback, useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';
import './Main.scss';
import { Modal, Button } from 'react-bootstrap';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { StatusEffectsProvider } from './context/StatusEffectsContext';
import { AILevelProvider, useAILevel } from './context/AILevelContext';
import { SecretItemProvider, useSecretItems } from './context/SecretItemContext';

import TraderNav from './components/Trader/TraderNav';
import PlayerHUD from './components/PlayerHUD';
import TradingArea from './components/Trading/TradingArea';
import SecretTradingArea from './components/Trading/SecretTradingArea';
import InventoryPane from './components/Inventory/InventoryPane';
import AdminDebug from './components/Admin/AdminDebug';
import TravelOverlay from './components/Travel/TravelOverlay';
import StarMapOverlay from './components/Travel/StarMapOverlay';
import GameOverScreen from './components/Game/GameOverScreen';
import FastestTimes from './components/FastestTimes';
import TradeHistory from './components/Trader/TradeHistory';
import VolumeSlider from './components/Misc/VolumeSlider';
import GameMenu from './components/Game/GameMenu';
import FloatingMessagesManager from './components/Reusable/FloatingMessagesManager';
import SaveGame from './components/Misc/SaveGame';
import Version from './components/Misc/Version';
import ChatBox from './components/Chat/ChatBox';
import Enemy from './components/Reusable/Enemy';
import EnemySpawner from './components/Reusable/EnemySpawner';
import Onboarding from './components/Onboarding/Onboarding';
import SecretOffer from './components/Reusable/SecretOffer';
import ConsentAndAnalytics from './components/Reusable/ConsentAndAnalytics';
// import Scanner from './components/Scanner';
// import ScannerLite from './components/ScannerLite';

const GameUI = ({
    gameCompleted,
    volume,
    setVolume,
    setVolumeWithAudioStop,
    statusEffects,
    currentEnemy,
    setCurrentEnemy,
    credits,
    setCredits,
    inventory,
    setInventory,
    addFloatingMessage,
    galaxyName,
    currentTrader,
    aiTier,
    improvedAILevel,
    handleEncounterEnd,
}) => {
    // UI state for secret market offer/unlock
    const [showSecretOffer, setShowSecretOffer] = useState(false);
    const [secretMarkets, setSecretMarkets] = useState({}); // { [galaxyName]: true }
    const [showSecretArea, setShowSecretArea] = useState(false);

    // Use secret item context for randomized items
    const { randomizedSecretItems } = useSecretItems();

    useEffect(() => {
        if (secretMarkets[galaxyName]) return;
        const timeout = setTimeout(() => {
            setShowSecretOffer(true);
        }, 120000 + Math.random() * 120000);
        return () => clearTimeout(timeout);
    }, [galaxyName, secretMarkets]);

    const handleSecretOfferResult = (result) => {
        setShowSecretOffer(false);
        if (result === 'accept') {
            setSecretMarkets((prev) => ({ ...prev, [galaxyName]: true }));
            setShowSecretArea(true);
            addFloatingMessage('You have unlocked the secret market in this galaxy!', 'global');
        }
    };

    const handleSecretBuy = (item) => {
        if (credits < item.basePrice) {
            addFloatingMessage('Not enough credits for this illegal deal!', 'error');
            return;
        }
        setCredits((c) => c - item.basePrice);
        setInventory((inv) => {
            const existing = inv.find((i) => i.name === item.name);
            if (existing) {
                return inv.map((i) =>
                    i.name === item.name ? { ...i, quantity: (i.quantity || 0) + 1 } : i
                );
            } else {
                return [...inv, { ...item, quantity: 1 }];
            }
        });
        addFloatingMessage(`You bought ${item.name} (illegal)!`, 'global');
    };

    return (
        <div className={`main-container ai-tier-${aiTier} ai-level-${improvedAILevel}`}>
            {/* Top right controls */}
            <div
                style={{
                    position: 'absolute',
                    height: '2rem',
                    right: 24,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                }}
            >
                <Version />
                <SaveGame />
                <VolumeSlider
                    volume={volume}
                    setVolume={setVolume}
                    setVolumeWithAudioStop={setVolumeWithAudioStop}
                />
            </div>
            <AdminDebug />
            {/* Show game menu if game is not running */}
            <GameMenu />
            {/* overlay during galaxy jump */}
            <TravelOverlay />
            {/* star map overlay */}
            <StarMapOverlay />
            {/* floating messages manager */}
            <FloatingMessagesManager />
            {/* Debug logging for currentEnemy state */}
            {/* {console.log('=== GAME COMPONENT === currentEnemy:', currentEnemy)} */}

            {/* Enemy Spawner - Handles random enemy encounters */}
            <EnemySpawner />

            {/* Render Enemy component when there's an active encounter */}
            {currentEnemy && (
                <Enemy
                    enemyData={currentEnemy}
                    onEncounterEnd={handleEncounterEnd}
                    key={`enemy-${currentEnemy.id}`} // Force re-render when enemy changes
                />
            )}

            {/* Onboarding overlay */}
            <Onboarding />

            <TraderNav />
            <PlayerHUD />
            {improvedAILevel >= 1000 && (
                <ChatBox statusEffects={statusEffects} aiLevel={improvedAILevel} />
            )}
            <TradeHistory />
            <div className="main-area">
                <InventoryPane />
                <TradingArea />
                {/* Secret Trading Area appears after TradingArea if unlocked for this galaxy */}
            </div>

            <SecretTradingArea
                secretItems={randomizedSecretItems}
                onBuy={handleSecretBuy}
                visible={!!secretMarkets[galaxyName] && showSecretArea}
            />
            {/* <Scanner />
            <ScannerLite /> */}
            <Modal show={gameCompleted} backdrop="static" keyboard={false} centered>
                <Modal.Header>
                    <Modal.Title>Game Complete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <GameOverScreen />
                    {/* show fastest times when game completes */}
                    {gameCompleted && <FastestTimes />}
                    <div className="game-over-menu">
                        enter trader name button (saves to localstorage)
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => window.location.reload()}>
                        Restart
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Secret Offer Popup */}
            <SecretOffer show={showSecretOffer} onResult={handleSecretOfferResult} />

            <ConsentAndAnalytics />
        </div>
    );
};

const Game = () => {
    const {
        gameCompleted,
        volume,
        setVolume,
        setVolumeWithAudioStop,
        statusEffects,
        currentEnemy,
        setCurrentEnemy,
        credits,
        setCredits,
        inventory,
        setInventory,
        addFloatingMessage,
        galaxyName,
        currentTrader,
    } = useMarketplace();
    const { aiTier, improvedAILevel } = useAILevel();

    const handleEncounterEnd = useCallback(() => {
        setCurrentEnemy(null);
    }, [setCurrentEnemy]);

    return (
        <SecretItemProvider currentTrader={currentTrader}>
            <GameUI
                gameCompleted={gameCompleted}
                volume={volume}
                setVolume={setVolume}
                setVolumeWithAudioStop={setVolumeWithAudioStop}
                statusEffects={statusEffects}
                currentEnemy={currentEnemy}
                setCurrentEnemy={setCurrentEnemy}
                credits={credits}
                setCredits={setCredits}
                inventory={inventory}
                setInventory={setInventory}
                addFloatingMessage={addFloatingMessage}
                galaxyName={galaxyName}
                currentTrader={currentTrader}
                aiTier={aiTier}
                improvedAILevel={improvedAILevel}
                handleEncounterEnd={handleEncounterEnd}
            />
        </SecretItemProvider>
    );
};

const GameOutput = () => {
    return (
        <AILevelProvider>
            <MarketplaceProvider>
                <StatusEffectsProvider>
                    <GameOutput />
                </StatusEffectsProvider>
            </MarketplaceProvider>
        </AILevelProvider>
    );
};

export default Game;
