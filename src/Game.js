import React, { useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';
import './Main.scss';
import { Modal, Button } from 'react-bootstrap';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { StatusEffectsProvider } from './context/StatusEffectsContext';
import { AILevelProvider, useAILevel } from './context/AILevelContext';

import TraderNav from './components/Trader/TraderNav';
import PlayerHUD from './components/PlayerHUD';
import TradingArea from './components/Trading/TradingArea';
import InventoryPane from './components/Inventory/InventoryPane';
import AdminDebug from './components/Admin/AdminDebug';
import TravelOverlay from './components/Travel/TravelOverlay';
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
// import Scanner from './components/Scanner';
// import ScannerLite from './components/ScannerLite';

const Game = () => {
    const {
        gameCompleted,
        volume,
        setVolume,
        setVolumeWithAudioStop,
        statusEffects,
        currentEnemy,
        setCurrentEnemy,
    } = useMarketplace();
    const { aiTier, improvedAILevel } = useAILevel();

    // Handle the end of an enemy encounter
    const handleEncounterEnd = useCallback(() => {
        setCurrentEnemy(null);
    }, [setCurrentEnemy]);

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
            {/* floating messages manager */}
            <FloatingMessagesManager />
            {/* Enemy Spawner - Handles random enemy encounters */}
            <EnemySpawner />
            {/* Render Enemy component when there's an active encounter */}
            <Enemy enemyData={currentEnemy} onEncounterEnd={handleEncounterEnd} />

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
            </div>
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
        </div>
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
