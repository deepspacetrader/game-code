import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
// Base enemy types are now defined in this file
import faceImage1 from '../../images/enemy0.webp';
import faceImage2 from '../../images/enemy1.webp';
import faceImage3 from '../../images/enemy2.webp';
import faceImage4 from '../../images/enemy3.webp';
import faceImage5 from '../../images/enemy3.webp'; //TODO: Generate enemy4 image
import './Enemy.scss';
import GameOver from '../Game/GameOver';
import enemiesData from '../../data/enemies.json';

// Helper function to get total quantum processors from inventory
const getTotalQuantumProcessors = (inventory = []) => {
    const qp = inventory.find(item => item.name === 'Quantum Processor');
    return qp ? qp.quantity : 0;
};

/**
 * Enum for encounter types
 */
export const ENEMY_TYPES = {
    SCAVENGER: 'Scavenger',
    MARKET_POLICE: 'Market Police',
    THIEF: 'Thief',
    THUG: 'Thug',
    MILITARY: 'Military',
};

/**
 * Enum for encounter reasons
 */
const ENCOUNTER_REASONS = {
    RANDOM: 'random_encounter',
    QUANTUM_LIMIT: 'quantum_processor_limit',
    ILLEGAL_AI: 'ILLEGAL_AI_increase',
    INSPECTION: 'random_inspection',
    AGGRO: 'player_aggression',
};

/**
 * Base enemy template with default values
 */
const getBaseEnemy = (type = ENEMY_TYPES.THUG) => {
    const enemyConfig = enemiesData.enemies.find(
        (e) => e.name.toLowerCase() === type.toLowerCase()
    );

    if (!enemyConfig) {
        console.warn(`No enemy config found for type: ${type}`);
        return {
            id: `enemy_${Date.now()}`,
            enemyId: 0,
            type,
            name: 'Unknown Threat',
            health: 100,
            damage: 10,
            credits: 0,
            weapons: [],
            shield: false,
            stealth: false,
        };
    }

    // Generate random values within ranges
    const health = Math.floor(Math.random() * (enemyConfig.health + 1));

    return {
        id: `enemy_${Date.now()}`,
        enemyId: enemyConfig.enemyId,
        type,
        name: enemyConfig.name,
        health,
        rank: enemyConfig.rank,
        maxHealth: health,
        damage: Math.floor(health * 0.1),
        credits: Math.floor(health * 5),
        weapons: enemyConfig.weapons,
        shield: enemyConfig.shield,
        stealth: enemyConfig.stealth,
        homeGalaxy: enemyConfig.homeGalaxy,
        language: enemyConfig.languageRange[0],
        statusEffects: [],
        reason: ENCOUNTER_REASONS.RANDOM,
    };
};

const Enemy = ({
    enemyData = null,
    onEncounterEnd = () => console.log('Encounter ended'),
    playerStats = { damage: 20, defense: 10 },
}) => {
    // ===== HOOKS - MUST BE AT TOP LEVEL =====

    // Context hooks
    const { aiTier } = useAILevel() || {};
    const { health, setHealth, credits, setCredits, inventory, addFloatingMessage } =
        useMarketplace() || {};

    // State management
    const [isGameOver, setIsGameOver] = useState(false);
    const [encounterActive, setEncounterActive] = useState(true);
    const [playerTurn, setPlayerTurn] = useState(true);
    const [battleLog, setBattleLog] = useState([]);
    const [escapeAttempts, setEscapeAttempts] = useState(0);
    const [isHacking, setIsHacking] = useState(false);
    const [escapeSuccessful, setEscapeSuccessful] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [currentFace, setCurrentFace] = useState(faceImage3);
    const [currentBribeAmount, setCurrentBribeAmount] = useState(0);

    // Enemy state with fallback
    const [enemy, setEnemy] = useState(() => {
        const initialEnemy = enemyData || getBaseEnemy(ENEMY_TYPES.THUG);
        console.log('Initializing enemy state:', initialEnemy);
        return initialEnemy;
    });

    // Memoized values
    const faces = useMemo(() => [faceImage1, faceImage2, faceImage3, faceImage4, faceImage5], []);

    // Set appropriate face based on enemy type
    useEffect(() => {
        if (!enemy?.type) return;

        // Map enemy types to specific face indices for consistency
        const faceMap = {
            'Scavenger': faceImage1,
            'Market Police': faceImage2,
            'Thief': faceImage3,
            'Thug': faceImage4,
            'Military': faceImage5,
        };

        // Default to a random face if type not in map
        const face = faceMap[enemy.type] || faces[Math.floor(Math.random() * faces.length)];
        setCurrentFace(face);
    }, [enemy?.id, enemy?.type, faces]);

    const aiScaling = useMemo(
        () => ({
            scale: 0.8 + (aiTier || 0) * 0.05,
            opacity: 0.9 - (aiTier || 0) * 0.1,
            animationSpeed: 1 + (aiTier || 0) * 0.1,
            fontSize: 1 - (aiTier || 0) * 0.05,
        }),
        [aiTier]
    );

    // Callbacks
    const addBattleLog = useCallback((message) => {
        setBattleLog((prev) => [...prev, message]);
    }, []);

    // Calculate current bribe amount based on enemy credits and retry status
    useEffect(() => {
        if (!enemy) return;

        let bribeAmount = Math.ceil(enemy.credits * 0.5);
        const isRetry = battleLog.some((log) => log.includes('demands more credits'));

        if (isRetry) {
            bribeAmount *= 2;
        }

        setCurrentBribeAmount(bribeAmount);
    }, [enemy, battleLog]);

    // Handle bribe attempt
    const handleBribe = useCallback(() => {
        if (!enemy || !playerTurn || !encounterActive) return;

        const isRetry = battleLog.some((log) => log.includes('demands more credits'));
        
        // Calculate the current bribe amount based on enemy credits and retry status
        let bribeAmount = Math.ceil(enemy.credits * 0.5);
        if (isRetry) {
            bribeAmount = currentBribeAmount; // Use the already doubled amount from state
        }

        // Check if player has enough credits
        if ((credits || 0) < bribeAmount) {
            addBattleLog(`Not enough credits to bribe! You need ${bribeAmount} credits.`);
            return;
        }

        // 50% chance of success on first attempt, 100% on retry
        const bribeSucceeds = isRetry || Math.random() < 0.5;

        // Deduct the bribe amount
        setCredits((prev) => (prev || 0) - bribeAmount);

        if (bribeSucceeds) {
            addBattleLog(
                `You bribed ${enemy.name} with ${bribeAmount} credits to leave you alone!`
            );
            setFadeOut(true);
            setTimeout(() => onEncounterEnd(), 1000);
        } else {
            // Double the bribe amount for next attempt
            const newBribeAmount = bribeAmount * 2;
            addBattleLog(
                `${enemy.name} laughs and demands ${newBribeAmount} credits to let you go!`
            );
            // Update the bribe amount in state
            setCurrentBribeAmount(newBribeAmount);
            // Add a small delay to ensure state updates before next bribe attempt
            setTimeout(() => {}, 0);
        }
    }, [
        enemy,
        credits,
        setCredits,
        playerTurn,
        encounterActive,
        addBattleLog,
        onEncounterEnd,
        battleLog,
        currentBribeAmount,
    ]);

    // Handle enemy turn
    const handleEnemyTurn = useCallback(() => {
        if (isGameOver || !enemy) return;

        const damage = Math.max(5, Math.floor(Math.random() * enemy.damage));
        const newHealth = Math.max(0, (health || 100) - damage);

        setHealth(newHealth);
        addBattleLog(`${enemy.name} attacks you for ${damage} damage!`);

        if (newHealth <= 0) {
            addBattleLog("You've been defeated!");
            setIsGameOver(true);
        } else {
            setPlayerTurn(true);
        }
    }, [isGameOver, enemy, health, setHealth, addBattleLog]);

    // Handle attack
    const handleAttack = useCallback(() => {
        if (!playerTurn || !encounterActive || !enemy) return;

        const damage = Math.max(5, Math.floor(Math.random() * (playerStats.damage || 20)));
        const newEnemyHealth = Math.max(0, (enemy.health || 0) - damage);

        setEnemy((prev) => ({
            ...prev,
            health: newEnemyHealth,
        }));

        addBattleLog(`You attack ${enemy.name} for ${damage} damage!`);

        if (newEnemyHealth <= 0) {
            addBattleLog(`${enemy.name} has been defeated!`);
            setFadeOut(true);
            setTimeout(() => {
                setEncounterActive(false);
                onEncounterEnd({
                    outcome: 'victory',
                    enemy: { ...enemy, health: 0 },
                    credits: enemy.credits,
                });
            }, 1000);
        } else {
            setPlayerTurn(false);
            setTimeout(handleEnemyTurn, 1000);
        }
    }, [
        playerTurn,
        encounterActive,
        enemy,
        playerStats.damage,
        handleEnemyTurn,
        onEncounterEnd,
        addBattleLog,
    ]);

    // Handle escape attempt
    const handleEscape = useCallback(() => {
        if (!playerTurn || escapeAttempts >= 3) return;

        const escapeChance = 0.3 + escapeAttempts * 0.2;
        const success = Math.random() < escapeChance;

        setEscapeAttempts((prev) => prev + 1);

        if (success) {
            addBattleLog('You successfully escaped!');
            setEscapeSuccessful(true);
            setFadeOut(true);
            setTimeout(() => {
                setEncounterActive(false);
                onEncounterEnd({
                    outcome: 'escaped',
                    enemy: { ...enemy },
                });
            }, 1000);
        } else {
            addBattleLog('Escape attempt failed!');
            setPlayerTurn(false);
            setTimeout(handleEnemyTurn, 1000);
        }
    }, [playerTurn, escapeAttempts, enemy, handleEnemyTurn, onEncounterEnd, addBattleLog]);

    // Handle hack attempt
    const handleHack = useCallback(() => {
        if (isHacking) return;
        
        const enemyConfig = enemiesData.enemies.find(e => e.enemyId === enemyData.enemyId);
        if (!enemyConfig) return;
        
        const playerQPs = getTotalQuantumProcessors(inventory);
        const enemyQPs = enemyConfig.quantum_processors || 0;
        
        if (playerQPs <= enemyQPs) {
            addFloatingMessage('Not enough Quantum Processors to hack this enemy', 'error');
            return;
        }
        
        setIsHacking(true);
        
        // Simulate hacking delay
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% success rate
            
            if (success) {
                const bounty = Math.floor(Math.random() * 
                    (enemyConfig.hack_bounty[1] - enemyConfig.hack_bounty[0] + 1)) + enemyConfig.hack_bounty[0];
                
                setCredits(prev => prev + bounty);
                addFloatingMessage(`Hack successful! Stole ${bounty} credits`, 'success');
                
                // End encounter after successful hack
                setTimeout(() => {
                    onEncounterEnd({
                        success: true,
                        credits: bounty,
                        reason: 'hacked'
                    });
                }, 1500);
            } else {
                // Hack failed, enemy gets a free attack
                addFloatingMessage('Hack failed!', 'error');
                setPlayerTurn(false);
                // Enemy will attack on next render
            }
            
            setIsHacking(false);
        }, 1500);
    }, [enemyData, inventory, onEncounterEnd, setCredits, addFloatingMessage, isHacking]);

    // Timer effect
    useEffect(() => {
        if (!encounterActive || isGameOver) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    addBattleLog("Time's up! The enemy overwhelms you!");
                    setIsGameOver(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [encounterActive, isGameOver, addBattleLog]);

    // Handle game over state
    useEffect(() => {
        if (isGameOver) {
            onEncounterEnd({
                outcome: 'defeat',
                enemy: { ...enemy },
            });
        }
    }, [isGameOver, enemy, onEncounterEnd]);

    // AI scaling styles
    const containerStyle = useMemo(
        () => ({
            transform: `scale(${aiScaling.scale})`,
            opacity: aiScaling.opacity,
            transformOrigin: 'center',
            transition: `all ${0.3 / aiScaling.animationSpeed}s ease`,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }),
        [aiScaling]
    );

    const textStyle = useMemo(
        () => ({
            fontSize: `${aiScaling.fontSize}em`,
            transition: `all ${0.3 / aiScaling.animationSpeed}s ease`,
        }),
        [aiScaling]
    );

    // If no encounter is active, don't render anything
    if (!encounterActive) {
        return null;
    }

    return (
        <div className={`enemy-encounter-overlay fade-out-${fadeOut}`} style={containerStyle}>
            <div className={`enemy-encounter-container ai-tier-${aiTier}`} style={textStyle}>
                <div className="enemy-info">
                    <div className="enemy-header">
                        {currentFace && (
                            <div className="enemy-face">
                                <img
                                    src={currentFace}
                                    alt="Enemy face"
                                    className="enemy-face-image"
                                    style={{
                                        borderRadius: '50%',
                                        border: '3px solid #666',
                                        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                                    }}
                                />
                            </div>
                        )}
                        <h2>ENCOUNTER: {enemy.name}</h2>
                        <p>Rank: {enemy.rank}</p>
                        
                        {enemy.reason && (
                            <div className="enemy-reason">
                                <strong>Encounter Reason:</strong> {enemy.reason}
                            </div>
                        )}

                        {/* Enhanced Timer Display */}
                        <div className="enemy-timer">
                            <div className="timer-container">
                                <div 
                                    className="timer-circle"
                                    style={{
                                        '--progress': `${(timeLeft / 30) * 100}%`,
                                        '--color': timeLeft > 15 ? '#4CAF50' : timeLeft > 5 ? '#FFC107' : '#F44336'
                                    }}
                                >
                                    <div className="timer-content">
                                        <span className="timer-text">{timeLeft}</span>
                                        <span className="timer-label">SECONDS</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enemy stats */}
                        <div className="enemy-stats">
                            <div className="stat-row">
                                <span className="stat-label">Health:</span>
                                <div className="health-bar">
                                    <div
                                        className="health-fill"
                                        style={{
                                            width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                                            backgroundColor:
                                                enemy.health / enemy.maxHealth < 0.3
                                                    ? '#ff3e3e'
                                                    : '#4CAF50',
                                        }}
                                    ></div>
                                </div>
                                <span className="stat-value">
                                    {enemy.health}/{enemy.maxHealth}
                                </span>
                            </div>
                        </div>

                        {/* Player status */}
                        <div className="player-status">
                            <strong>Your Status:</strong>
                            <div className="health-bar" style={{ margin: '6px 0' }}>
                                <div
                                    className="health-fill"
                                    style={{
                                        width: `${(health / 100) * 100}%`,
                                        backgroundColor: health < 30 ? '#ff3e3e' : '#4CAF50',
                                    }}
                                ></div>
                                <span>{health}/100 HP</span>
                            </div>
                            <div className="player-credits">
                                <span>Credits: {credits}</span>
                            </div>
                        </div>

                        {enemy.statusEffects.length > 0 && (
                            <div className="status-effects">
                                <p>Status: {enemy.statusEffects.join(', ')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="battle-log">
                    <h3>BATTLE LOG</h3>
                    <div className="log-entries">
                        {battleLog.map((entry, index) => (
                            <div key={index} className="log-entry">
                                {entry}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="action-buttons">
                    <button
                        onClick={handleAttack}
                        disabled={!playerTurn || isGameOver}
                        className="action-btn attack"
                    >
                        ATTACK
                    </button>
                    <button
                        onClick={handleBribe}
                        disabled={!playerTurn || isGameOver}
                        className="action-btn bribe"
                    >
                        BRIBE ({currentBribeAmount})
                    </button>
                    {enemyData && enemyData.enemyId !== undefined && (
                        <button 
                            className={`action-button hack-button ${isHacking ? 'disabled' : ''}`}
                            onClick={handleHack}
                            disabled={isHacking}
                        >
                            {isHacking ? 'HACKING...' : 'HACK'}
                        </button>
                    )}
                    <button
                        onClick={handleEscape}
                        disabled={(!playerTurn || escapeAttempts >= 3) && !escapeSuccessful}
                        className={`action-btn ${escapeSuccessful ? 'escape-success' : 'escape'}`}
                    >
                        {escapeSuccessful
                            ? 'CONTINUE'
                            : escapeAttempts >= 3
                            ? "CAN'T ESCAPE"
                            : `ESCAPE (${3 - escapeAttempts})`}
                    </button>
                </div>
            </div>
            {isGameOver && <GameOver onRestart={() => window.location.reload()} />}
        </div>
    );
};

export default Enemy;
