import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useUI } from '../context/UIContext';
import './GameMenu.scss';

const GameMenu = () => {
    const [showMainMenu, setShowMainMenu] = useState(true);
    const [hasSavedGame, setHasSavedGame] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [savedUILevel, setSavedUILevel] = useState(0);
    const { 
        setHealth, 
        setFuel, 
        setCredits, 
        setDeliverySpeed, 
        setShieldActive, 
        setStealthActive,
        setInventory,
        travelToGalaxy,
        setQuantumProcessors,
        initializeGameState
    } = useMarketplace();
    const { setImprovedUILevel } = useUI();

    useEffect(() => {
        // Check for saved game on component mount
        const savedGame = localStorage.getItem('scifiMarketSave');
        setHasSavedGame(!!savedGame);
        if (savedGame) {
            try {
                const gameState = JSON.parse(savedGame);
                setSavedUILevel(gameState.uiLevel || 0);
            } catch (e) {
                console.error('Error parsing saved game:', e);
            }
        }
    }, []);

    const loadGame = async () => {
        const savedGame = localStorage.getItem('scifiMarketSave');
        if (savedGame) {
            try {
                setIsLoading(true);
                const gameState = JSON.parse(savedGame);
                
                // Initialize the game state first
                if (typeof initializeGameState === 'function') {
                    await initializeGameState({
                        health: gameState.health,
                        fuel: gameState.fuel,
                        credits: gameState.credits,
                        deliverySpeed: gameState.deliverySpeed,
                        shieldActive: gameState.shieldActive,
                        stealthActive: gameState.stealthActive,
                        inventory: gameState.inventory || [],
                        quantumProcessors: gameState.quantumProcessors || 0,
                        uiLevel: gameState.uiLevel || 0,
                        galaxyName: gameState.galaxyName
                    });
                } else {
                    // Fallback to individual state updates if initializeGameState is not available
                    setHealth(gameState.health);
                    setFuel(gameState.fuel);
                    setCredits(gameState.credits);
                    setDeliverySpeed(gameState.deliverySpeed);
                    setShieldActive(gameState.shieldActive);
                    setStealthActive(gameState.stealthActive);
                    setInventory(gameState.inventory || []);
                    setQuantumProcessors(gameState.quantumProcessors || 0);
                    setImprovedUILevel(gameState.uiLevel || 0);
                    
                    // Travel to the saved galaxy
                    if (gameState.galaxyName) {
                        await travelToGalaxy(gameState.galaxyName);
                    }
                }
                
                // Small delay to ensure all state updates are processed
                await new Promise(resolve => setTimeout(resolve, 100));
                setShowMainMenu(false);
            } catch (error) {
                console.error('Failed to load saved game:', error);
                // If loading fails, clear the corrupted save
                localStorage.removeItem('scifiMarketSave');
                setHasSavedGame(false);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleStartGame = () => {
        // Clear any existing saved game when starting new
        localStorage.removeItem('scifiMarketSave');
        setShowMainMenu(false);
    };

    if (!showMainMenu) {
        return null;
    }

    return (
        <div className="game-menu">
            <div className="menu-content">
                <div className="corner-tl"></div>
                <div className="corner-br"></div>
                <h1>Deep Space Trading Game</h1>
                <div className="menu-options">
                    {hasSavedGame && (
                        <button 
                            className={`continue-button ${isLoading ? 'loading' : ''}`} 
                            onClick={loadGame}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Loading...' : (
                                <>
                                    Continue Game
                                    <span className="ui-level">UI Level: {savedUILevel}</span>
                                </>
                            )}
                        </button>
                    )}
                    <button 
                        className={`start-button ${hasSavedGame ? 'has-continue' : ''}`} 
                        onClick={handleStartGame}
                    >
                        Start New Game
                    </button>
                    <p className="version-info">v1.0.0</p>
                </div>
            </div>
        </div>
    );
};

export default GameMenu;
