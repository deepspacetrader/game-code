import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import './Enemy.scss';
import GameOver from '../Game/GameOver';
import { zzfx } from 'zzfx';
import faceImage1 from '../../images/enemy0.webp';
import faceImage2 from '../../images/enemy1.webp';
import faceImage3 from '../../images/enemy2.webp';
import faceImage4 from '../../images/enemy3.webp';
import faceImage5 from '../../images/enemy3.webp';
import enemiesData from '../../data/enemies.json';
/**
 * Enum for encounter types
 */
export const ENEMY_TYPES = {
    SCAVENGER: 'scavenger',
    MARKET_POLICE: 'market_police',
    THIEF: 'thief',
    THUG: 'thug',
    MILITARY: 'military',
};

/**
 * Enum for encounter reasons
 */
const ENCOUNTER_REASONS = {
    RANDOM: 'random_encounter',
    QUANTUM_LIMIT: 'quantum_processor_limit',
    ILLEGAL_UI: 'illegal_ui_increase',
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
    const intelligence = Math.floor(
        Math.random() * (enemyConfig.intelligence[1] - enemyConfig.intelligence[0]) +
            enemyConfig.intelligence[0]
    );
    const chanceOfScan =
        Math.random() * (enemyConfig.chanceOfScan[1] - enemyConfig.chanceOfScan[0]) +
        enemyConfig.chanceOfScan[0];
    const hostileChance =
        Math.random() * (enemyConfig.hostileRange[1] - enemyConfig.hostileRange[0]) +
        enemyConfig.hostileRange[0];

    return {
        id: `enemy_${Date.now()}`,
        enemyId: enemyConfig.enemyId,
        type,
        name: enemyConfig.name,
        health,
        maxHealth: health,
        damage: Math.floor(intelligence * 0.1),
        credits: Math.floor(intelligence * 5),
        weapons: enemyConfig.weapons,
        shield: enemyConfig.shield,
        stealth: enemyConfig.stealth,
        intelligence,
        chanceOfScan,
        hostileChance,
        homeGalaxy: enemyConfig.homeGalaxy,
        language: enemyConfig.languageRange[0],
        statusEffects: [],
        isHostile: hostileChance > 0.5,
        reason: ENCOUNTER_REASONS.RANDOM,
    };
};

const Enemy = ({
    enemyData = getBaseEnemy(ENEMY_TYPES.THUG, 'D'),
    onEncounterEnd = () => console.log('Encounter ended'),
    playerStats = { damage: 20, defense: 10 },
}) => {
    const {
        health: playerHealth,
        setHealth,
        credits,
        inventory,
        volumeRef,
    } = useMarketplace() || {};
    const { uiTier } = useUI() || {};
    const [isGameOver, setIsGameOver] = useState(false);
    const [encounterActive, setEncounterActive] = useState(true);
    const [playerTurn, setPlayerTurn] = useState(true);
    const [battleLog, setBattleLog] = useState([]);
    const [escapeAttempts, setEscapeAttempts] = useState(0);
    const [bribeAmount, setBribeAmount] = useState(25);
    const [enemy, setEnemy] = useState(() => getBaseEnemy());
    const [hackProgress, setHackProgress] = useState(0);
    const [showDanger, setShowDanger] = useState(false);
    const [dangerMessage, setDangerMessage] = useState('');
    const [escapeSuccessful, setEscapeSuccessful] = useState(false);
    const [showEscapeMenu, setShowEscapeMenu] = useState(false);
    const [selectedTradeItem, setSelectedTradeItem] = useState(null);
    const [selectedEscapeItem, setSelectedEscapeItem] = useState(null);
    const [fadeOut, setFadeOut] = useState(false);
    const faces = useMemo(() => [faceImage1, faceImage2, faceImage3, faceImage4, faceImage5], []);
    const [currentFace, setCurrentFace] = useState(() => faces[3]);

    // Calculate UI scaling based on UI level (simplified for performance)
    const uiScaling = useMemo(
        () => ({
            scale: 1.1, // Base scale
            opacity: 0.9, // Base opacity
            blur: 0, // No blur by default
        }),
        []
    );

    const handlePlayerDamage = useCallback(
        (damage) => {
            const effectiveDamage = Math.max(0, damage - playerStats.defense);
            setHealth((prevHealth) => {
                const newHealth = Math.max(0, prevHealth - effectiveDamage);
                if (newHealth <= 0) {
                    setIsGameOver(true);
                    if (volumeRef.current) {
                        zzfx(volumeRef.current, 0.1, 100, 0.1, 0.1, 0, 0, 1, 0.1);
                    }
                }
                return newHealth;
            });
        },
        [playerStats.defense, setHealth, volumeRef]
    );

    const handleRestart = useCallback(() => {
        setIsGameOver(false);
        setHealth(100);
        if (onEncounterEnd) onEncounterEnd();
    }, [onEncounterEnd, setHealth]);

    const addBattleLog = useCallback((message) => {
        setBattleLog((prev) => [...prev, message]);
    }, []);

    const endEncounter = useCallback(
        (outcome) => {
            setEncounterActive(false);
            onEncounterEnd({
                outcome,
                enemy: { ...enemy, health: enemy.health },
            });
        },
        [enemy, onEncounterEnd]
    );

    // Update enemy when enemyData changes
    useEffect(() => {
        setEnemy((prev) => ({
            ...getBaseEnemy(enemyData?.type, enemyData?.rank),
            ...enemyData,
            health: enemyData?.health || prev.health,
        }));
    }, []);

    // Set a random face when the component mounts
    useEffect(() => {
        const faces = [faceImage1, faceImage2, faceImage3, faceImage4, faceImage5];
        // const randomFace = faces[Math.floor(Math.random() * faces.length)];
        console.log(enemy);
        setCurrentFace(faces[enemy.enemyId]);
    }, []);

    // Handle player attack
    const handlePlayerAttack = useCallback(() => {
        if (!playerTurn || !encounterActive) return;

        const damage = playerStats.damage;
        const crit = Math.random() < 0.1; // 10% crit chance
        const totalDamage = crit ? damage * 2 : damage;

        setEnemy((prev) => ({
            ...prev,
            health: Math.max(0, prev.health - totalDamage),
        }));

        addBattleLog(
            `You attack ${enemy.name} for ${totalDamage} damage${crit ? ' (CRITICAL HIT!)' : ''}!`
        );

        if (enemy.health - totalDamage <= 0) {
            addBattleLog(`You defeated ${enemy.name}!`);
            setEncounterActive(false);
            endEncounter('victory');
        } else {
            setPlayerTurn(false);
            // Enemy will take their turn in the next effect
        }
    }, [playerTurn, encounterActive, playerStats.damage, enemy, addBattleLog, endEncounter]);

    // Handle bribe attempt
    const handleBribe = useCallback(() => {
        if (!playerTurn || !encounterActive) return;

        const bribeAmount = Math.ceil(enemy.credits * 0.5); // 50% of enemy's credits
        if (credits >= bribeAmount) {
            addBattleLog(`You successfully bribed ${enemy.name} with ${bribeAmount} credits!`);
            setFadeOut(true);
            setTimeout(() => {
                setEncounterActive(false);
                onEncounterEnd({
                    outcome: 'bribed',
                    enemy: { ...enemy },
                    creditsLost: bribeAmount,
                });
                setFadeOut(false);
            }, 1000);
        } else {
            addBattleLog(`You don't have enough credits to bribe ${enemy.name}!`);
        }
    }, [playerTurn, encounterActive, enemy, credits, addBattleLog, onEncounterEnd]);

    // Calculate bribe amount based on enemy rank
    const calculateBribeAmount = useCallback((rank) => {
        const baseBribes = {
            S: 5000,
            A: 3000,
            B: 1500,
            C: 750,
            D: 300,
        };

        return baseBribes[rank] || baseBribes.D;
    }, []);

    const checkEncounterConditions = useCallback(() => {
        const quantumProcessors = inventory.filter((item) => item.name === 'Quantum Processor');
        const hasIllegalUI =
            uiTier > 1000 &&
            inventory.some((item) => item.isIllegal && item.name !== 'Quantum Processor');

        if (quantumProcessors.length >= 5) return 'quantum_processor_limit';
        if (hasIllegalUI) return 'illegal_ui_increase';
        if (Math.random() < 0.05 && quantumProcessors.length > 0) return 'random_inspection';

        return null;
    }, [inventory, uiTier]);

    // Trigger market police encounter
    const triggerMarketPoliceEncounter = useCallback(
        (reason) => {
            // Determine rank and base stats
            const rank = ['D', 'C', 'B', 'A', 'S'][Math.floor(Math.random() * 5)];
            const baseHealth =
                {
                    S: 500,
                    A: 300,
                    B: 200,
                    C: 150,
                    D: 100,
                }[rank] || 100;

            // Create market police enemy with different stats based on reason
            let marketPolice = {
                name: `Market Police ${rank}-Rank Enforcer`,
                rank,
                health: baseHealth,
                maxHealth: baseHealth,
                damage: Math.floor(baseHealth * 0.2),
                homeGalaxy: 'Central Authority',
                language: 'EN',
                credits: 0,
                statusEffects: ['Shielded', 'Armored'],
                isHostile: true,
                isMarketPolice: true,
                reason: reason,
            };

            // Adjust stats based on encounter reason
            switch (reason) {
                case 'quantum_processor_limit':
                    marketPolice = {
                        ...marketPolice,
                        name: `Quantum Regulation Unit (${rank}-Rank)`,
                        health: Math.floor(baseHealth * 1.5),
                        damage: Math.floor(baseHealth * 0.3),
                        statusEffects: ['Quantum Dampening', 'Reinforced Armor'],
                    };
                    break;

                case 'illegal_ui_increase':
                    marketPolice = {
                        ...marketPolice,
                        name: `Compliance Officer (${rank}-Rank)`,
                        health: Math.floor(baseHealth * 1.2),
                        damage: Math.floor(baseHealth * 0.15),
                        statusEffects: ['Lawful Presence', 'System Scan'],
                    };
                    break;

                case 'random_inspection':
                default:
                    marketPolice = {
                        ...marketPolice,
                        name: `Market Inspector (${rank}-Rank)`,
                        health: Math.floor(baseHealth * 0.9),
                        damage: Math.floor(baseHealth * 0.1),
                        credits: 200,
                        statusEffects: ['Scanning', 'Alert'],
                    };
                    addBattleLog('Random inspection initiated by Market Police.');
                    break;
            }

            // Update enemy state
            setEnemy(marketPolice);
            setEncounterActive(true);
            setPlayerTurn(true);
            setBattleLog([]);
            setEscapeAttempts(0);
            setBribeAmount(calculateBribeAmount(rank));
        },
        [calculateBribeAmount, addBattleLog]
    );

    // Handle enemy turn
    const handleEnemyTurn = useCallback(() => {
        if (!enemy.isHostile || enemy.health <= 0 || !encounterActive) {
            setPlayerTurn(true);
            return;
        }

        // Simple AI for enemy actions
        const action = Math.random();

        if (action < 0.7) {
            // 70% chance to attack
            const damage = Math.floor(enemy.damage * (0.8 + Math.random() * 0.4));
            addBattleLog(`${enemy.name} attacks for ${damage} damage!`);
            // Apply damage to player (you'll need to implement this in your game state)
            // For now, we'll just log it
            console.log(`Player takes ${damage} damage`);
        } else {
            // 30% chance to use a special ability
            const healAmount = Math.floor(enemy.health * 0.2);
            addBattleLog(`${enemy.name} uses a repair kit and heals for ${healAmount} HP!`);
            setEnemy((prev) => ({
                ...prev,
                health: Math.min(prev.maxHealth, prev.health + healAmount),
            }));
        }

        // End enemy turn and return to player
        setPlayerTurn(true);
    }, [enemy, encounterActive, addBattleLog, setPlayerTurn]);

    // Check for encounter conditions - used in the encounter effect
    // This is kept for potential future use, though currently handled in the useEffect above
    // eslint-disable-next-line no-unused-vars
    const checkAndTriggerEncounter = useCallback(() => {
        const reason = checkEncounterConditions();
        if (reason && !enemyData) {
            triggerMarketPoliceEncounter(reason);
        }
    }, [checkEncounterConditions, enemyData, triggerMarketPoliceEncounter]);

    // Handle danger interaction - used in the danger choice modal
    // eslint-disable-next-line no-unused-vars
    const handleDangerChoice = useCallback(
        (choice) => {
            const damage = Math.floor(Math.random() * 36) + 25; // 25-60 damage
            const escaped = Math.random() < 0.5; // 50% chance to escape

            let message;
            if (!escaped) {
                message = `You took ${damage} damage from the explosion!`;
            } else {
                message = 'You narrowly escaped the danger!';
            }

            setDangerMessage(message);
            addBattleLog(message);

            const timeoutId = setTimeout(() => {
                setShowDanger(false);
                setDangerMessage('');
            }, 2000);

            return () => clearTimeout(timeoutId);
        },
        [addBattleLog]
    );

    // Show danger encounter - used in the Nir Lhat Etol interaction
    // eslint-disable-next-line no-unused-vars
    const showDangerEncounter = useCallback(() => {
        setShowDanger(true);
        // Auto-hide after 5 seconds if no choice is made
        const timeoutId = setTimeout(() => {
            if (showDanger) {
                setShowDanger(false);
                setDangerMessage('Too slow! You took 30 damage!');
                // Apply damage here if needed
                setTimeout(() => setDangerMessage(''), 2000);
            }
        }, 5000);
        return () => clearTimeout(timeoutId);
    }, [showDanger]);

    // Handle Nir Lhat Etol's special interaction
    // eslint-disable-next-line no-unused-vars
    const handleNirLhatEtolInteraction = useCallback(() => {
        const hasTranslator = inventory.some(
            (item) => item.itemId === 5 && item.name === 'Universal Translator'
        );

        if (hasTranslator) {
            addBattleLog('You used the Universal Translator to communicate with Nir Lhat Etol.');

            // Function to show danger encounter
            const triggerDanger = () => {
                setShowDanger(true);
                // Auto-hide after 5 seconds if no choice is made
                const timeoutId = setTimeout(() => {
                    setShowDanger(false);
                    setDangerMessage('Too slow! You took 30 damage!');
                    // Apply damage here if needed
                    setTimeout(() => setDangerMessage(''), 2000);
                }, 5000);
                return () => clearTimeout(timeoutId);
            };

            // Show danger immediately
            triggerDanger();
        }
        return null;
    }, [inventory, addBattleLog, setShowDanger, setDangerMessage]);

    const handleEscape = useCallback(() => {
        if (!playerTurn || !encounterActive || escapeSuccessful) return;

        const escapeChance = 0.5 + escapeAttempts * 0.1; // 50% base + 10% per attempt
        const escaped = Math.random() < escapeChance;

        if (escaped) {
            setEscapeSuccessful(true);
            addBattleLog(`You successfully escaped from ${enemy.name}!`);

            // Disable all buttons and show success state
            setPlayerTurn(false);

            // After 3 seconds, end the encounter
            const timer = setTimeout(() => {
                onEncounterEnd({
                    outcome: 'escaped',
                    enemy: { ...enemy },
                });
                setEncounterActive(false);
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            const newAttempts = escapeAttempts + 1;
            setEscapeAttempts(newAttempts);
            addBattleLog(`Failed to escape! ${enemy.name} is still pursuing you!`);

            if (newAttempts < 3) {
                // Allow up to 3 escape attempts
                addBattleLog(
                    `You can try to escape again! (${3 - newAttempts} attempts remaining)`
                );
            }

            // End player's turn and let enemy take their turn
            setPlayerTurn(false);

            // Schedule enemy turn to happen after state updates
            setTimeout(() => {
                handleEnemyTurn();
            }, 0);
        }
    }, [
        playerTurn,
        encounterActive,
        escapeAttempts,
        enemy,
        addBattleLog,
        onEncounterEnd,
        escapeSuccessful,
        handleEnemyTurn,
    ]);

    // Handle hack attempt
    const handleHack = useCallback(() => {
        if (!playerTurn || !encounterActive) return;

        const quantumProcessors = 4; //inventory.filter((item) => item.name === 'Quantum Processor');
        const hackPower = quantumProcessors * 15; // 15% per quantum processor

        if (quantumProcessors.length === 0) {
            addBattleLog('You need at least one Quantum Processor to attempt a hack!');
            return;
        }

        const newHackProgress = Math.min(100, hackProgress + hackPower);
        setHackProgress(newHackProgress);

        addBattleLog(`Hacking in progress... (${newHackProgress}%)`);

        if (newHackProgress >= 100) {
            addBattleLog('Hack successful! You override the security protocols.');

            setFadeOut(true);
            setTimeout(() => {
                setEncounterActive(false);
                onEncounterEnd({
                    outcome: 'hacked',
                    enemy: { ...enemy },
                });
                setFadeOut(false);
                // endEncounter('hacked');
            }, 1000);
        } else {
            addBattleLog(`Hack progress: ${newHackProgress}% - Keep going!`);
            setPlayerTurn(false);
            setTimeout(handleEnemyTurn, 1000);
        }
    }, [
        playerTurn,
        encounterActive,
        inventory,
        hackProgress,
        addBattleLog,
        endEncounter,
        handleEnemyTurn,
    ]);

    // // If no encounter is active, don't render anything
    if (!encounterActive) {
        return null;
    }

    // Apply UI scaling to the container
    const containerStyle = {
        transform: `scale(${uiScaling.scale})`,
        opacity: uiScaling.opacity,
        transformOrigin: 'center',
        transition: `all ${0.3 / uiScaling.animationSpeed}s ease`,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const textStyle = {
        fontSize: `${uiScaling.fontSize}em`,
        transition: `all ${0.3 / uiScaling.animationSpeed}s ease`,
    };

    return (
        <div className={`enemy-encounter-overlay fade-out-${fadeOut}`} style={containerStyle}>
            <div className={`enemy-encounter-container ui-tier-${uiTier}`} style={textStyle}>
                <div className="enemy-info">
                    <div className="enemy-header">
                        {currentFace && (
                            <div className="enemy-face">
                                <img
                                    src={currentFace}
                                    alt="Enemy face"
                                    className="enemy-face-image"
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        border: '3px solid #666',
                                        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                                    }}
                                />
                            </div>
                        )}
                        <h2>ENCOUNTER: {enemy.name}</h2>
                    </div>
                    {enemy.reason === 'quantum_processor_limit' && (
                        <p className="encounter-reason">
                            <strong>Charge:</strong> Exceeded legal limit of Quantum Processors{' '}
                        </p>
                    )}
                    {enemy.reason === 'illegal_ui_increase' && (
                        <p className="encounter-reason">
                            <strong>Charge:</strong> Unauthorized neural interface modification
                        </p>
                    )}

                    <div className="enemy-stats">
                        <div className="health-bar">
                            <div
                                className="health-fill"
                                style={{
                                    width: `${(enemy.health / (enemy.maxHealth || 1)) * 100}%`,
                                    backgroundColor:
                                        enemy.health < enemy.maxHealth * 0.3
                                            ? '#ff3e3e'
                                            : '#4CAF50',
                                }}
                            ></div>
                            <span>
                                {enemy.health}/{enemy.maxHealth} HP
                            </span>
                        </div>
                        <p>Rank: {enemy.rank}</p>
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

                <div className="player-actions">
                    <h3>ACTIONS</h3>
                    <div className="action-buttons">
                        <button
                            onClick={handlePlayerAttack}
                            disabled={
                                !playerTurn ||
                                enemy.health <= 0 ||
                                !inventory.some((item) => item.itemId === 8) ||
                                escapeSuccessful
                            }
                            className={`action-btn attack ${
                                escapeSuccessful ? 'disabled-action' : ''
                            }`}
                            title={
                                !inventory.some((item) => item.itemId === 8)
                                    ? 'You need a Plasma Rifle to attack!'
                                    : ''
                            }
                        >
                            ATTACK
                        </button>
                        <button
                            onClick={handleHack}
                            disabled={!playerTurn || enemy.health <= 0 || escapeSuccessful}
                            className={`action-btn hack ${
                                escapeSuccessful ? 'disabled-action' : ''
                            }`}
                        >
                            HACK ({hackProgress}%)
                        </button>
                        <button
                            onClick={handleBribe}
                            disabled={!playerTurn || enemy.health <= 0 || escapeSuccessful}
                            className={`action-btn bribe ${
                                escapeSuccessful ? 'disabled-action' : ''
                            }`}
                        >
                            BRIBE ({bribeAmount} cr)
                        </button>
                        <button
                            onClick={() => {
                                if (escapeSuccessful) {
                                    setFadeOut(true);
                                    setTimeout(() => {
                                        setEncounterActive(false);
                                        onEncounterEnd({
                                            outcome: 'escaped',
                                            enemy: { ...enemy },
                                        });
                                        setFadeOut(false);
                                    }, 1000);
                                } else {
                                    handleEscape();
                                }
                            }}
                            disabled={(!playerTurn || escapeAttempts >= 3) && !escapeSuccessful}
                            className={`action-btn ${
                                escapeSuccessful ? 'escape-success' : 'escape'
                            }`}
                        >
                            {escapeSuccessful
                                ? 'CONTINUE'
                                : escapeAttempts >= 3
                                ? "CAN'T ESCAPE"
                                : `ESCAPE (${3 - escapeAttempts})`}
                        </button>
                    </div>
                </div>
            </div>
            {isGameOver && <GameOver onRestart={handleRestart} />}
        </div>
    );
};

export default Enemy;
