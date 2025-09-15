import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import { getTotalQuantumProcessors } from '../../utils/inventory';
// Base enemy types are now defined in this file
import faceImage1 from '../../images/enemy0.webp';
import faceImage2 from '../../images/enemy1.webp';
import faceImage3 from '../../images/enemy2.webp';
import faceImage4 from '../../images/enemy3.webp';
import faceImage5 from '../../images/enemy3.webp'; //TODO: Generate enemy4 image
import './Enemy.scss';
import GameOver from '../Game/GameOver';
import enemiesData from '../../data/enemies.json';

// AutoEnemy component for automatic handling
const AutoEnemy = ({ enemy, playerHealth, playerCredits, timeLeft, onAutoAction, inventory }) => {
    const [action, setAction] = useState(null);
    const [showAuto, setShowAuto] = useState(false);

    useEffect(() => {
        // Only show auto controls if player has quantum processors
        const hasQuantumPower = inventory && getTotalQuantumProcessors(inventory) > 0;
        setShowAuto(hasQuantumPower);

        if (hasQuantumPower) {
            // Simple AI decision making
            if (playerHealth < 30) {
                setAction('ESCAPE_IMMEDIATELY');
                onAutoAction('ESCAPE_IMMEDIATELY');
            } else if (enemy.health < 30) {
                setAction('ATTACK');
                onAutoAction('ATTACK');
            } else if (playerCredits > 1000) {
                setAction('CONSIDER_BRIBE');
                onAutoAction('CONSIDER_BRIBE');
            } else {
                setAction('ATTACK');
                onAutoAction('ATTACK');
            }
        }
    }, [enemy, playerHealth, playerCredits, timeLeft, onAutoAction, inventory]);

    if (!showAuto) return null;

    return (
        <div className="auto-enemy-panel">
            <div className="auto-status">
                <span>AI Assistant: </span>
                <span className={`action-${action?.toLowerCase()}`}>
                    {action?.replace('_', ' ')}
                </span>
            </div>
        </div>
    );
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
            maxHealth: 100,
            damage: 10,
            credits: 0,
            weapons: [],
            shield: false,
            stealth: false,
        };
    }

    // Use exact health value from config
    const baseHealth = typeof enemyConfig.health === 'number' ? enemyConfig.health : 100;

    return {
        id: `enemy_${Date.now()}`,
        enemyId: enemyConfig.enemyId,
        type,
        name: enemyConfig.name,
        health: baseHealth,
        rank: enemyConfig.rank,
        maxHealth: baseHealth,
        damage: Math.floor(baseHealth * 0.1),
        credits: Math.floor(baseHealth * 5),
        weapons: enemyConfig.weapons || [],
        shield: enemyConfig.shield || false,
        stealth: enemyConfig.stealth || false,
        homeGalaxy: enemyConfig.homeGalaxy,
        language: enemyConfig.languageRange ? enemyConfig.languageRange[0] : 'EN',
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

    // Refs
    const bribeAttempts = useRef(0);

    // State management
    const [isGameOver, setIsGameOver] = useState(false);
    const [encounterActive, setEncounterActive] = useState(true);
    const [playerTurn, setPlayerTurn] = useState(true);
    const [battleLog, setBattleLog] = useState([]);
    const [isHacking, setIsHacking] = useState(false);
    const [isHackButtonPressed, setIsHackButtonPressed] = useState(false);
    const isHackButtonPressedRef = useRef(false);
    const [hackProgress, setHackProgress] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [currentFace, setCurrentFace] = useState(faceImage3);
    const [currentBribeAmount, setCurrentBribeAmount] = useState(0);
    const [actionSuccess, setActionSuccess] = useState(null);
    const [escapeAttempts, setEscapeAttempts] = useState(0);
    const [escapeSuccessful, setEscapeSuccessful] = useState(false);
    const [showAutoEnemy, setShowAutoEnemy] = useState(false);

    // Enemy state with fallback
    const [enemy, setEnemy] = useState(() => {
        const initialEnemy = enemyData || getBaseEnemy(ENEMY_TYPES.THUG);
        console.log('Initializing enemy state:', initialEnemy);
        return initialEnemy;
    });

    // Memoized values
    const faces = useMemo(() => [faceImage1, faceImage2, faceImage3, faceImage4, faceImage5], []);

    // Update bribe amount when enemy changes
    useEffect(() => {
        if (enemy) {
            const enemyConfig = enemiesData.enemies.find(e => e.enemyId === enemy.enemyId);
            if (enemyConfig && enemyConfig.hack_bounty) {
                // Use the hack_bounty range from enemy data and round up to nearest 500
                const [minBounty, maxBounty] = enemyConfig.hack_bounty;
                const randomBribe = Math.floor(Math.random() * (maxBounty - minBounty + 1)) + minBounty;
                const roundedBribe = Math.max(500, Math.ceil(randomBribe / 500) * 500);
                setCurrentBribeAmount(roundedBribe);
            } else {
                // Fallback to 10% of enemy credits, rounded up to nearest 500 with minimum 500
                const fallbackBribe = Math.floor((enemy.credits || 1000) * 0.1);
                const roundedBribe = Math.max(500, Math.ceil(fallbackBribe / 500) * 500);
                setCurrentBribeAmount(roundedBribe);
            }
        }
    }, [enemy]);

    // Set appropriate face based on enemy type
    useEffect(() => {
        if (!enemy?.type) return;

        // Map enemy types to specific face indices for consistency
        const faceMap = {
            Scavenger: faceImage1,
            'Market Police': faceImage2,
            Thief: faceImage3,
            Thug: faceImage4,
            Military: faceImage5,
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
            return;
        }

        // Handle player's turn if not defeated
        setPlayerTurn(true);
    }, [isGameOver, enemy, health, setHealth, addBattleLog, setPlayerTurn]);

    // Handle escape attempt
    const handleEscape = useCallback(() => {
        if (!playerTurn || !encounterActive || !enemy || actionSuccess) return;

        const baseChance = 0.3; // 30% base chance to escape
        const escapeBonus = escapeAttempts * 0.1; // 10% bonus per attempt
        const successChance = Math.min(0.8, baseChance + escapeBonus); // Cap at 80%
        const isSuccessful = Math.random() < successChance;

        setEscapeAttempts((prev) => prev + 1);

        if (isSuccessful) {
            setActionSuccess('escape');
            setFadeOut(true);
            setEscapeSuccessful(true);
            addBattleLog(`You successfully escaped from ${enemy.name}!`);

            setTimeout(() => {
                setEncounterActive(false);
                onEncounterEnd({
                    outcome: 'escaped',
                    enemy: { ...enemy },
                });
            }, 1000);
        } else {
            addBattleLog(`Escape attempt failed! ${enemy.name} is still after you!`);
            setPlayerTurn(false);
            setTimeout(handleEnemyTurn, 1000);
        }
    }, [
        playerTurn,
        encounterActive,
        enemy,
        actionSuccess,
        escapeAttempts,
        onEncounterEnd,
        addBattleLog,
        handleEnemyTurn,
        setActionSuccess,
        setFadeOut,
        setEncounterActive,
        setPlayerTurn,
        setEscapeAttempts,
    ]);

    // Handle bribe
    const handleBribe = useCallback(() => {
        if (!playerTurn || !encounterActive || !enemy || actionSuccess) return;

        const bribeAmount = currentBribeAmount;
        const successChance = 0.5;
        const isSuccessful = Math.random() < successChance;

        if (isSuccessful) {
            setActionSuccess('bribe');
            setFadeOut(true);
            addBattleLog(`Bribe successful! You paid ${bribeAmount} credits to avoid a fight.`);
            setCredits((prev) => prev - bribeAmount);

            setTimeout(() => {
                setEncounterActive(false);
                onEncounterEnd({
                    outcome: 'bribed',
                    credits: -bribeAmount,
                    enemy: { ...enemy },
                });
            }, 1000);
        } else {
            const newBribeAmount = bribeAmount * 2;
            setCurrentBribeAmount(newBribeAmount);
            addBattleLog(`Bribe of ${bribeAmount} credits failed! The enemy wants at least ${newBribeAmount} credits.`);
        }
    }, [
        playerTurn,
        encounterActive,
        enemy,
        actionSuccess,
        onEncounterEnd,
        setCredits,
        addBattleLog,
        setActionSuccess,
        setFadeOut,
        setEncounterActive,
        currentBribeAmount,
    ]);

    // Handle attack
    const handleAttack = useCallback(() => {
        if (!playerTurn || !encounterActive || !enemy || actionSuccess) return;

        const damage = Math.max(5, Math.floor(Math.random() * (playerStats.damage || 20)));
        const newEnemyHealth = Math.max(0, (enemy.health || 0) - damage);

        setEnemy((prev) => ({
            ...prev,
            health: newEnemyHealth,
        }));

        addBattleLog(`You attack ${enemy.name} for ${damage} damage!`);

        if (newEnemyHealth <= 0) {
            setActionSuccess('attack');
            setFadeOut(true);
            setPlayerTurn(false);
            addBattleLog(`${enemy.name} has been defeated!`);

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
        actionSuccess,
        playerStats.damage,
        addBattleLog,
        setEncounterActive,
        onEncounterEnd,
        handleEnemyTurn,
        setActionSuccess,
        setFadeOut,
        setPlayerTurn,
    ]);

    // Handle timer expiration
    const handleTimerExpired = useCallback(() => {
        if (!enemy || !credits) return;

        let message = '';
        let penalty = 0;
        let itemsLost = [];
        let outcome = 'defeat';

        switch (enemy.type) {
            case ENEMY_TYPES.MILITARY:
                penalty = Math.floor((credits || 0) * 0.5);
                message = 'Military forces have captured you! You lost 50% of your credits.';
                outcome = 'defeat';
                break;

            case ENEMY_TYPES.MARKET_POLICE:
                const illegalItems = (inventory || []).filter((item) => item.illegal);
                penalty = Math.floor((credits || 0) * 0.1);
                message = `Market police confiscated ${illegalItems.length} illegal items and fined you ${penalty} credits!`;
                outcome = 'escaped';
                break;

            case ENEMY_TYPES.THUG:
                penalty = Math.min(1000, Math.floor((credits || 0) * 0.3));
                message = `The thug knocked you out and stole ${penalty} credits!`;
                outcome = 'defeat';
                break;

            case ENEMY_TYPES.THIEF:
                if (inventory && inventory.length > 0) {
                    const stolenItem = inventory[Math.floor(Math.random() * inventory.length)];
                    message = `The thief got away with your ${stolenItem.name}!`;
                } else {
                    message = 'The thief got away empty-handed!';
                }
                outcome = 'escaped';
                break;

            case ENEMY_TYPES.SCAVENGER:
                penalty = Math.min(100, Math.floor((credits || 0) * 0.1));
                message = `The scavenger took ${penalty} credits and ran away!`;
                outcome = 'escaped';
                break;

            default:
                message = 'You were too slow! The enemy got the better of you.';
        }

        addBattleLog(message);

        // Apply penalties
        if (penalty > 0 && credits !== undefined) {
            setCredits((prev) => Math.max(0, prev - penalty));
        }

        // End encounter after a delay
        setTimeout(() => {
            onEncounterEnd({
                outcome,
                reason: 'timeout',
                penalty: {
                    credits: penalty,
                    items: itemsLost,
                },
                enemy: { ...enemy },
            });
        }, 2000);
    }, [enemy, credits, inventory, addBattleLog, onEncounterEnd, setCredits]);

    // Timer effect
    useEffect(() => {
        if (!encounterActive || isGameOver) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimerExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [encounterActive, isGameOver, handleTimerExpired]);

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

    // Calculate quantum power and auto-enemy visibility
    const hasQuantumPower = useMemo(() => {
        return inventory && getTotalQuantumProcessors(inventory) > 0;
    }, [inventory]);

    // Check if player has enough quantum processors to hack this enemy
    const canHack = useMemo(() => {
        // Count quantum processors from inventory
        let totalPlayerProcessors = 0;

        // Check if inventory is an array and find QPs
        if (Array.isArray(inventory)) {
            const qpItem = inventory.find((i) => i.name === 'Quantum Processor');
            totalPlayerProcessors = qpItem ? qpItem.quantity || 1 : 0;
        }
        // Check if inventory is an object with items array
        else if (inventory?.items) {
            const qpItem = inventory.items.find((i) => i.name === 'Quantum Processor');
            totalPlayerProcessors = qpItem ? qpItem.quantity || 1 : 0;
        }

        const enemyProcessors = enemy?.quantum_processors || 0;
        const canHackResult =
            (enemyProcessors === 0 && totalPlayerProcessors > 0) ||
            totalPlayerProcessors > enemyProcessors;

        // console.log('=== HACK DEBUG ===');
        // console.log('Inventory:', inventory);
        // console.log(`Player QP: ${totalPlayerProcessors}, Enemy QP: ${enemyProcessors}`);
        // console.log(
        //     `Can Hack: ${canHackResult} (Player QP > Enemy QP: ${
        //         totalPlayerProcessors > enemyProcessors
        //     })`
        // );

        return canHackResult;
    }, [inventory, enemy]);

    // Track hack progress state
    const hackStartTime = useRef(0);
    const hackProgressRef = useRef(0);
    const hackAnimationId = useRef(null);
    const hackDuration = 4200; // 4.2 seconds

    // Reset hack progress when enemy changes
    useEffect(() => {
        return () => {
            // Clean up any running animations
            if (hackAnimationId.current) {
                cancelAnimationFrame(hackAnimationId.current);
            }
            // Reset progress
            setHackProgress(0);
            hackProgressRef.current = 0;
            setIsHacking(false);
            setIsHackButtonPressed(false);
            isHackButtonPressedRef.current = false;
        };
    }, [enemy.enemyId]);

    // Clean up animation frame on unmount or when encounter ends
    useEffect(() => {
        return () => {
            if (hackAnimationId.current) {
                cancelAnimationFrame(hackAnimationId.current);
            }
        };
    }, []);

    // Unified hack progress updater using RAF and refs (avoids stale closures)
    const updateHackProgress = useCallback(() => {
        // Pause progress if button is not pressed
        if (!isHackButtonPressedRef.current) {
            return;
        }

        const elapsed = Date.now() - hackStartTime.current;
        const progress = Math.min((elapsed / hackDuration) * 100, 100);

        setHackProgress(progress);
        hackProgressRef.current = progress;

        if (progress >= 100) {
            // Hack completed successfully
            const enemyConfig = enemiesData.enemies.find((e) => e.enemyId === enemy.enemyId);
            const [minBounty, maxBounty] = enemyConfig?.hack_bounty || [1000, 3000];
            const hackBounty = Math.floor(Math.random() * (maxBounty - minBounty + 1)) + minBounty;

            setCredits((prev) => prev + hackBounty);
            addFloatingMessage(`Hack successful! +${hackBounty} credits`, 'success');

            // Indicate success and start fade out
            setActionSuccess('hack');
            setFadeOut(true);

            // Reset hacking states
            setIsHacking(false);
            setIsHackButtonPressed(false);
            isHackButtonPressedRef.current = false;

            // End the encounter after a short delay
            setTimeout(() => {
                onEncounterEnd({
                    type: 'hack',
                    success: true,
                    credits: hackBounty,
                });
                // Reset progress after completion
                setHackProgress(0);
                hackProgressRef.current = 0;
            }, 1500);
            return;
        }

        // Queue next frame
        hackAnimationId.current = requestAnimationFrame(updateHackProgress);
    }, [enemy.enemyId, setCredits, addFloatingMessage, onEncounterEnd]);

    // Handle hack button mouse/touch up/leave
    const handleHackMouseUp = useCallback(() => {
        if (isHackButtonPressed) {
            setIsHackButtonPressed(false);
            isHackButtonPressedRef.current = false;
        }
    }, [isHackButtonPressed]);

    // Handle hack button mouse/touch down
    const handleHackMouseDown = useCallback(() => {
        if (!canHack || !playerTurn) return;

        // Mark as pressed
        setIsHackButtonPressed(true);
        isHackButtonPressedRef.current = true;

        // Compute (or recompute) start time based on current progress
        hackStartTime.current = Date.now() - (hackProgressRef.current / 100) * hackDuration;

        // If not already in a hacking session, start it
        if (!isHacking) {
            setIsHacking(true);
        }

        // Ensure RAF loop is running (resume if previously paused)
        hackAnimationId.current = requestAnimationFrame(updateHackProgress);
    }, [canHack, playerTurn, isHacking, updateHackProgress]);

    // Handle auto action from AutoEnemy component
    const handleAutoAction = useCallback(
        (actionType) => {
            switch (actionType) {
                case 'ATTACK':
                    handleAttack();
                    break;
                case 'ESCAPE_IMMEDIATELY':
                    handleEscape();
                    break;
                case 'CONSIDER_BRIBE':
                    handleBribe();
                    break;
                default:
                    break;
            }
        },
        [handleAttack, handleEscape, handleBribe]
    );

    // If no encounter is active, don't render anything
    if (isGameOver) {
        return <GameOver onRestart={() => window.location.reload()} />;
    }

    return (
        <div className={`enemy-encounter-overlay fade-out-${fadeOut}`} style={containerStyle}>
            {showAutoEnemy && (
                <AutoEnemy
                    enemy={enemy}
                    playerHealth={health}
                    playerCredits={credits}
                    timeLeft={timeLeft}
                    inventory={inventory}
                    onAutoAction={handleAutoAction}
                />
            )}
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

                        {/* Enemy Health Bar */}
                        <div className="health-bar-container">
                            <div className="health-bar-label">ENEMY HEALTH</div>
                            <div className="health-bar">
                                <div
                                    className="health-bar-fill enemy-health"
                                    style={{
                                        width: `${
                                            (enemy.health / (enemy.maxHealth || 100)) * 100
                                        }%`,
                                    }}
                                >
                                    <span className="health-text">
                                        {enemy.health}/{enemy.maxHealth || 100}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Player Health Bar */}
                        <div className="health-bar-container">
                            <div className="health-bar-label">YOUR HEALTH</div>
                            <div className="health-bar">
                                <div
                                    className="health-bar-fill player-health"
                                    style={{ width: `${(health / 100) * 100}%` }}
                                >
                                    <span className="health-text">{health}/100</span>
                                </div>
                            </div>
                        </div>

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
                                        '--color':
                                            timeLeft > 15
                                                ? '#4CAF50'
                                                : timeLeft > 5
                                                ? '#FFC107'
                                                : '#F44336',
                                    }}
                                >
                                    <div className="timer-content">
                                        <span className="timer-text">{timeLeft}</span>
                                        <span className="timer-label">SECONDS</span>
                                    </div>
                                </div>
                            </div>
                            <div className="action-buttons">
                                {actionSuccess ? (
                                    <div className="action-success-message">
                                        {actionSuccess === 'bribe' &&
                                            'Bribe successful! You paid the enemy. They are leaving...'}
                                        {actionSuccess === 'attack' &&
                                            'Enemy defeated! You won the battle!'}
                                        {actionSuccess === 'escape' &&
                                            'Escape successful! Getting away...'}
                                        {actionSuccess === 'hack' &&
                                            'Hack successful! Access granted. Standing down...'}
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleAttack}
                                            disabled={!playerTurn || isGameOver || actionSuccess}
                                            className="action-btn attack"
                                        >
                                            ATTACK
                                        </button>
                                        <button
                                            onClick={handleBribe}
                                            disabled={!playerTurn || isGameOver || actionSuccess}
                                            className="action-btn bribe"
                                            title={`Bribe the enemy for ${currentBribeAmount} credits`}
                                        >
                                            BRIBE ({currentBribeAmount})
                                        </button>
                                        <button
                                            onClick={handleEscape}
                                            disabled={
                                                !playerTurn || escapeAttempts >= 3 || actionSuccess
                                            }
                                            className="action-btn escape"
                                        >
                                            {escapeAttempts >= 3
                                                ? "CAN'T ESCAPE"
                                                : `ESCAPE (${3 - escapeAttempts})`}
                                        </button>
                                    </>
                                )}
                                {enemyData && enemyData.enemyId !== undefined && (
                                    <React.Fragment>
                                        <div
                                            style={{
                                                position: 'fixed',
                                                top: '10px',
                                                right: '10px',
                                                background: 'rgba(0,0,0,0.8)',
                                                color: 'white',
                                                padding: '10px',
                                                zIndex: 1000,
                                                fontSize: '12px',
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            <div>playerTurn: {playerTurn ? 'true' : 'false'}</div>
                                            <div>canHack: {canHack ? 'true' : 'false'}</div>
                                            <div>
                                                isHacking: {isHackButtonPressed ? 'true' : 'false'}
                                            </div>
                                            <div>Enemy QP: {enemy?.quantum_processors || 0}</div>
                                        </div>
                                        <button
                                            className={`action-btn hack ${
                                                !canHack ? 'disabled' : 'hack-available'
                                            } ${isHackButtonPressed ? 'active' : ''}`}
                                            onMouseDown={handleHackMouseDown}
                                            onMouseUp={handleHackMouseUp}
                                            onMouseLeave={handleHackMouseUp}
                                            onTouchStart={handleHackMouseDown}
                                            onTouchEnd={handleHackMouseUp}
                                            onTouchCancel={handleHackMouseUp}
                                            disabled={!canHack || actionSuccess}
                                            style={{ position: 'relative', zIndex: 10 }}
                                        >
                                            <div
                                                className="hack-progress"
                                                style={{ width: `${hackProgress}%` }}
                                            />
                                            <span className="hack-text">
                                                {hackProgress > 0
                                                    ? `HACKING... (${Math.round(hackProgress)}%)`
                                                    : 'HACK'}
                                            </span>
                                        </button>
                                    </React.Fragment>
                                )}
                            </div>
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
                </div>
                {isGameOver && <GameOver onRestart={() => window.location.reload()} />}
            </div>
        </div>
    );
};

export default Enemy;
