import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { decryptData } from '../../utils/encryption';
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
        setIsCheater,
    } = useMarketplace();
    const { setImprovedUILevel } = useUI();

    useEffect(() => {
        // Check for saved game on component mount
        const savedGame = localStorage.getItem('scifiMarketSave');
        if (savedGame) {
            try {
                const decrypted = decryptData(savedGame);
                if (decrypted) {
                    // Check if this is a cheater's save file
                    if (decrypted.isCheater) {
                        console.warn('Loading a save file with cheats enabled');
                    }
                    setSavedUILevel(decrypted.uiLevel || 0);
                    setHasSavedGame(true);
                } else {
                    console.error('Failed to decrypt saved game');
                    setHasSavedGame(false);
                    localStorage.removeItem('scifiMarketSave');
                }
            } catch (e) {
                console.error('Error parsing saved game:', e);
                // If decryption fails, remove the corrupted save
                localStorage.removeItem('scifiMarketSave');
                setHasSavedGame(false);
            }
        } else {
            setHasSavedGame(false);
        }
    }, []);

    const loadGame = async () => {
        const savedGame = localStorage.getItem('scifiMarketSave');
        if (savedGame) {
            try {
                setIsLoading(true);

                // Decrypt the saved game data
                const gameState = decryptData(savedGame);
                if (!gameState) {
                    console.error('Failed to decrypt saved game');
                    setIsLoading(false);
                    return;
                }

                // Initialize the game state using the context's initializeGameState function
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
                        isCheater: gameState.isCheater || false,
                    });

                    // Force a re-render after a short delay to ensure state is updated
                    // await new Promise(resolve => setTimeout(resolve, 300));
                    // window.location.reload();
                } else {
                    console.error('initializeGameState function not available in context');
                    // Fallback to individual state updates if initializeGameState is not available
                    if (gameState.health !== undefined) setHealth(gameState.health);
                    if (gameState.fuel !== undefined) setFuel(gameState.fuel);
                    if (gameState.credits !== undefined) setCredits(gameState.credits);
                    if (gameState.deliverySpeed !== undefined)
                        setDeliverySpeed(gameState.deliverySpeed);
                    if (gameState.shieldActive !== undefined)
                        setShieldActive(gameState.shieldActive);
                    if (gameState.stealthActive !== undefined)
                        setStealthActive(gameState.stealthActive);
                    if (gameState.isCheater !== undefined && typeof setIsCheater === 'function') {
                        setIsCheater(gameState.isCheater);
                    }

                    // Handle inventory
                    if (Array.isArray(gameState.inventory)) {
                        const validInventory = gameState.inventory
                            .filter((item) => item && item.name && item.quantity > 0)
                            .map((item) => ({
                                name: item.name,
                                quantity: Number(item.quantity) || 0,
                                price: Number(item.price) || 0,
                            }));
                        setInventory(validInventory);
                    } else {
                        console.warn('Invalid inventory data in save file, using empty inventory');
                        setInventory([]);
                    }

                    if (gameState.quantumProcessors !== undefined)
                        setQuantumProcessors(Number(gameState.quantumProcessors) || 0);
                    if (gameState.uiLevel !== undefined)
                        setImprovedUILevel(Number(gameState.uiLevel) || 0);

                    // Small delay to ensure state is updated before traveling
                    await new Promise((resolve) => setTimeout(resolve, 100));

                    // Travel to the saved galaxy if it exists
                    if (gameState.galaxyName) {
                        console.log('Traveling to galaxy:', gameState.galaxyName);
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

    const handleNewGame = () => {
        // Clear any existing save
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
                        onClick={handleNewGame}
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
                                to build your fortune and dominate the markets.
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
                            <h4>Tips</h4>
                            <ul>
                                <li>Visit different traders to buy and sell goods</li>
                                <li>Prices vary between traders so buy low and sell high!</li>
                                <li>
                                    Be careful out there, some areas are dangerous and you may
                                    encounter some not so friendly individuals or groups
                                </li>
                                <li>Maintain your health and fuel levels</li>
                                <li>
                                    Upgrade your UI Level for enhanced visual information to help
                                    make better trading decisions
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
