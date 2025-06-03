import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './GameMenu.scss';

const GameMenu = () => {
    const [showMainMenu, setShowMainMenu] = useState(true);
    const [hasSavedGame, setHasSavedGame] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [savedUILevel, setSavedUILevel] = useState(0);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
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
        initializeGameState,
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
                        galaxyName: gameState.galaxyName,
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
                await new Promise((resolve) => setTimeout(resolve, 100));
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
                            {isLoading ? (
                                'Loading...'
                            ) : (
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
                    <div className="how-to-play">
                        <button
                            className="how-to-play-button"
                            onClick={() => setShowHowToPlay(!showHowToPlay)}
                        >
                            How To Play
                            {showHowToPlay ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        <div className={`how-to-play-content ${showHowToPlay ? 'open' : ''}`}>
                            <h3>Welcome to Deep Space Trading Game</h3>
                            <p>
                                Navigate the galaxies as a space trader, buying low and selling high
                                to build your fortune.
                            </p>
                            <h4>Controls</h4>
                            <ul>
                                <li>Left click an item in the market to buy it</li>
                                <li>Right click an item in the market to sell it</li>
                                <li>Each item can be used or traded</li>
                                <li>Click on the Next Galaxy button to travel to a new galaxy</li>
                                <li>
                                    Click on the Previous and Next trader buttons to travel within
                                    the current galaxy <em>(consumes fuel)</em>
                                </li>
                            </ul>

                            <h4>Goal</h4>
                            <ul>
                                <li>
                                    Starting with a small amount of credits <b>your task</b> is to
                                    navigate the galaxies in search of the highly sought after
                                    tightly regulated <b>Quantum Processors</b>
                                </li>
                                <li>
                                    Obtain and activate <b>6 Quantum Processors</b> to dominate the
                                    markets with ultra high speed trading capabilities
                                </li>
                            </ul>
                            <h4>Gameplay</h4>
                            <ul>
                                <li>Visit different traders to buy and sell goods</li>
                                <li>Prices vary between traders so buy low and sell high!</li>
                                <li>
                                    Be careful out there trader, some areas are dangerous and you
                                    may encounter some not so friendly individuals...
                                </li>
                                <li>Maintain your health and fuel levels</li>
                                <li>
                                    Upgrade your UI level to unlock new visual information to help
                                    you make better trading decisions
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameMenu;
