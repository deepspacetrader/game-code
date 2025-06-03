import React, { useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useMarketplace } from './context/MarketplaceContext';
import { useUI } from './context/UIContext';

// Import components with proper paths
import TraderNav from './components/Trader/TraderNav';
import PlayerHUD from './components/PlayerHUD';
import TradingArea from './components/Trading/TradingArea';
import InventoryPane from './components/Inventory/InventoryPane';
import TravelOverlay from './components/Travel/TravelOverlay';
import GameOverScreen from './components/Game/GameOverScreen';
import FastestTimes from './components/FastestTimes';
import TradeHistory from './components/Trader/TradeHistory';
import GameMenu from './components/Game/GameMenu';
import FloatingMessagesManager from './components/Reusable/FloatingMessagesManager';
import ChatBox from './components/Chat/ChatBox';
import Enemy from './components/Reusable/Enemy';
import EnemySpawner from './components/Reusable/EnemySpawner';

// Import styles
import './App.scss';
import './MyCss.scss';

const Game = () => {
    const { currentEnemy, gameCompleted } = useMarketplace();
    const { improvedUILevel, statusEffects } = useUI();

    const handleEncounterEnd = useCallback(() => {
        // Handle encounter end logic here
    }, []);

    return (
        <div className="app-container">
            <GameMenu />
            <TravelOverlay />
            <FloatingMessagesManager />
            <EnemySpawner />
            <TraderNav />
            <PlayerHUD />
            
            {improvedUILevel >= 1000 && (
                <ChatBox statusEffects={statusEffects} uiLevel={improvedUILevel} />
            )}
            
            <TradeHistory />
            <div className="main-area">
                <InventoryPane />
                <TradingArea />
            </div>

            {currentEnemy && (
                <Enemy 
                    enemyData={currentEnemy} 
                    onEncounterEnd={handleEncounterEnd} 
                />
            )}

            <Modal show={gameCompleted} backdrop="static" keyboard={false} centered>
                <Modal.Header>
                    <Modal.Title>Game Complete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <GameOverScreen />
                    {gameCompleted && <FastestTimes />}
                    <div className="game-over-menu">
                        enter trader name button (saves to localstorage)
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="primary" 
                        onClick={() => window.location.reload()}
                    >
                        Restart
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Game;
