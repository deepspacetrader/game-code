import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import { decryptData } from '../../utils/encryption';
import './GameMenu.scss';
import Version from '../Misc/Version';

const GameMenu = () => {
    const [showMainMenu, setShowMainMenu] = useState(true);
    const [hasSavedGame, setHasSavedGame] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [savedaiLevel, setSavedaiLevel] = useState(0);
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
        setShowOnboarding,
    } = useMarketplace();
    const { setimprovedAILevel } = useAILevel();

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
                    setSavedaiLevel(decrypted.aiLevel || 0);
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
                        aiLevel: gameState.aiLevel || 0,
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
                    if (gameState.aiLevel !== undefined)
                        setimprovedAILevel(Number(gameState.aiLevel) || 0);

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
        setShowOnboarding(true);
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
                                    <span className="ai-level">AI Level: {savedaiLevel}</span>
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
                    <div className="version-info">
                        <Version />
                    </div>
                    <div className="how-to-play">
                        <div className={`how-to-play-content open`}>
                            <h3>Welcome to Deep Space Trading Game</h3>
                            <p>
                                Navigate the galaxies as a space trader, buying low and selling high
                                to build your fortune and dominate the markets.
                            </p>
                            <h4>Basics</h4>
                            <ul>
                                <li>Left click items in the market to buy</li>
                                <li>Right click items in the market to sell</li>
                                <li>Items can be used or traded</li>
                                <li>
                                    Click <b>Next Galaxy</b> button to travel to a new galaxy
                                </li>
                                <li>
                                    Click <b>Previous</b> or <b>Next</b> trader buttons to travel
                                    within the current galaxy <em>(consumes fuel)</em>
                                </li>
                            </ul>

                            <h4>Goal</h4>
                            <ul>
                                <li>
                                    Starting with a small amount of credits <b>your goal</b> is to
                                    navigate the galaxies in search of the highly sought after and
                                    tightly regulated <b>Quantum Processors</b>
                                </li>
                                <li>
                                    Obtain and activate <b>6 Quantum Processors</b> to dominate the
                                    markets with ultra high speed quantum trading capabilities
                                </li>
                            </ul>
                            <h4>Tips</h4>
                            <ul>
                                <li>
                                    Other traders have a variety of items at different prices so
                                    travel around to seek out the best deals
                                </li>
                                <li>
                                    Use items to upgrade your <b>AI Level</b> for visual
                                    enhancements to help make better trading decisions
                                </li>
                                <li>
                                    Be careful out there, some areas are dangerous and you may
                                    encounter some not so friendly individuals or groups
                                </li>
                                <li>Maintain, health, fuel and AI levels</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameMenu;
