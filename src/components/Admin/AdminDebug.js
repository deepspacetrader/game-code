import React, { useState, useMemo, useCallback } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import { useEventContext } from '../../context/EventContext';
import { useStatusEffects } from '../../context/StatusEffectsContext';
import { zzfx } from 'zzfx';
import { Danger, DANGER_TYPES } from '../Reusable/Danger';
import Event from '../Reusable/Event';
import { ENEMY_TYPES } from '../Reusable/Enemy';
import enemiesData from '../../data/enemies.json';
import { encryptData, decryptData } from '../../utils/encryption';
import './AdminDebug.scss';

const AdminDebug = () => {
    const [showCheats, setShowCheats] = useState(false);
    const { improvedAILevel, setimprovedAILevel, setCourierDrones, courierDrones } = useAILevel();
    const {
        health,
        healthRef,
        setHealth,
        setCredits,
        maxHealth,
        volumeRef,
        setDeliverySpeed,
        quantumProcessors: currentQPs = 0,
        updateQuantumProcessors,
        quantumInventory = [],
        isCheater: contextIsCheater,
        setIsCheater,
        setCurrentEnemy,
    } = useMarketplace();

    const { triggerRandomMajorEvent } = useEventContext();
    const { addStatEffect } = useStatusEffects();

    // Debug function to trigger a test event
    const triggerTestEvent = () => {
        try {
            if (typeof triggerRandomMajorEvent !== 'function') {
                throw new Error('triggerRandomMajorEvent is not a function');
            }
            console.log('[Event] Manually triggering test event');
            triggerRandomMajorEvent();
            alert('Random event triggered successfully!');
        } catch (error) {
            console.error('Error triggering random event:', error);
            alert(`Failed to trigger random event: ${error.message}`);
        }
    };

    // Ensure quantumInventory is an array
    const safeQuantumInventory = Array.isArray(quantumInventory) ? quantumInventory : [];

    const [creditAmount, setCreditAmount] = useState(10000000);
    const [qpAmount, setQPAmount] = useState(1);
    const [deliverySpeedOverride, setDeliverySpeedOverride] = useState(courierDrones || 0);
    const [selectedEnemyType, setSelectedEnemyType] = useState(ENEMY_TYPES.SCAVENGER);

    // Handle triggering a random encounter
    const triggerRandomEncounter = useCallback(() => {
        try {
            console.log('=== DEBUG: Starting triggerRandomEncounter ===');
            console.log('Selected enemy type:', selectedEnemyType);

            // Find the enemy configuration from enemies.json with case-insensitive match
            const enemyConfig = enemiesData.enemies.find(
                (e) => e.name.toLowerCase() === selectedEnemyType.toLowerCase()
            );

            if (!enemyConfig) {
                const availableEnemies = enemiesData.enemies.map((e) => e.name).join(', ');
                const errorMsg = `Enemy type "${selectedEnemyType}" not found. Available types: ${availableEnemies}`;
                console.error(errorMsg);
                alert(errorMsg);
                throw new Error(errorMsg);
            }

            console.log('Found enemy config:', enemyConfig);

            // Use exact health value from config
            const health = typeof enemyConfig.health === 'number' ? enemyConfig.health : 100;

            // Create the enemy object with proper structure
            const enemy = {
                id: `enemy_${Date.now()}`,
                enemyId: enemyConfig.enemyId,
                type: enemyConfig.name,
                name: enemyConfig.name,
                health: health,
                maxHealth: enemyConfig.health,
                rank: enemyConfig.rank,
                damage: Math.floor(health * 0.1),
                credits: Math.floor(health * 5),
                weapons: enemyConfig.weapons || [],
                shield: enemyConfig.shield || false,
                stealth: enemyConfig.stealth || false,
                homeGalaxy: enemyConfig.homeGalaxy || 'Unknown',
                language: enemyConfig.languageRange ? enemyConfig.languageRange[0] : 'Unknown',
                statusEffects: [],
                reason: enemyConfig.reason,
                hack_bounty: enemyConfig.hack_bounty,
                quantum_processors: enemyConfig.quantum_processors,
            };

            console.log('Created enemy object:', enemy);
            console.log('Calling setCurrentEnemy...');

            // Try to set the enemy and log the result
            setCurrentEnemy(enemy);
            console.log('setCurrentEnemy called with:', enemy);

            // Add a small delay to allow state to update
            setTimeout(() => {
                console.log('=== DEBUG: Enemy state should be updated now ===');
                console.log('Try interacting with the enemy in the UI.');
            }, 100);
        } catch (error) {
            console.error('Error triggering random encounter:', error);
            alert(`Failed to trigger random encounter: ${error.message}`);
        }
    }, [selectedEnemyType, setCurrentEnemy]);

    // Handle resetting quantum processors
    const handleResetQPs = useCallback(() => {
        if (!updateQuantumProcessors) {
            console.error('updateQuantumProcessors function is not available');
            alert('Failed to reset QPs: updateQuantumProcessors is not available');
            return;
        }
        updateQuantumProcessors(0);
    }, [updateQuantumProcessors]);

    // Handle adding quantum processors
    const handleAddQPs = useCallback(() => {
        try {
            if (!updateQuantumProcessors) {
                console.error('updateQuantumProcessors function is not available');
                alert('Failed to add QPs: updateQuantumProcessors is not available');
                return;
            }

            const currentCount = currentQPs || 0;
            const newCount = currentCount + qpAmount;

            // Add the processors - the updateQuantumProcessors function will handle updating the count
            // Quantum abilities will be added when the player interacts with quantum slots
            updateQuantumProcessors(newCount);
        } catch (error) {
            console.error('Error adding QPs:', error);
            alert(`Failed to add QPs: ${error.message}`);
        }
    }, [currentQPs, qpAmount, updateQuantumProcessors]);

    // Memoize quantum processor handlers
    const quantumProcessorHandlers = useMemo(
        () => ({
            add: handleAddQPs,
            reset: handleResetQPs,
        }),
        [handleAddQPs, handleResetQPs]
    );

    const toggleCheats = () => {
        // Simply toggle the cheats menu visibility
        setShowCheats(!showCheats);
    };

    const enableCheats = async () => {
        const savedGame = localStorage.getItem('scifiMarketSave');
        let isCheater = false;

        if (savedGame) {
            try {
                const gameState = decryptData(savedGame);
                isCheater = gameState?.isCheater === true;
            } catch (e) {
                console.error('Error checking cheater status:', e);
            }
        }

        // If not a cheater, show warning and enable cheats if confirmed
        if (!isCheater && !contextIsCheater) {
            const confirmText =
                'WARNING: Enabling cheats will mark your save as a cheater.\n\n' +
                'This action cannot be undone. All your current progress will be lost.\n\n' +
                'Type "yes" to confirm and enable cheats.';
            const input = window.prompt(confirmText);
            if (input === 'yes') {
                // Create a new game state with cheats enabled
                const gameState = {
                    isCheater: true,
                    aiLevel: 10,
                    credits: 10000,
                    quantumProcessors: 0,
                    inventory: [],
                    health: 100,
                    fuel: 100,
                    deliverySpeed: 1,
                    shieldActive: false,
                    stealthActive: false,
                    galaxyName: 'start',
                };

                // Save the new game state with cheats enabled
                localStorage.setItem('scifiMarketSave', encryptData(gameState));

                // Update the context state to reflect the new cheater status
                if (setIsCheater) {
                    setIsCheater(true);
                }

                // Update the AI to reflect the new state
                setimprovedAILevel(10);
                setCredits(10000);
                quantumProcessorHandlers.reset();
                setShowCheats(true);
            }
        } else {
            // If already a cheater, just show the cheats menu
            setShowCheats(true);

            // Ensure the context is up to date
            if (setIsCheater && !contextIsCheater) {
                setIsCheater(true);
            }
        }
    };

    const removeCheaterStatus = () => {
        // Clear any saved game data to prevent loading cheated progress
        localStorage.removeItem('scifiMarketSave');

        // Update the context to clear cheater status
        if (setIsCheater) {
            setIsCheater(false);
        }

        // Reset game state to default values
        setimprovedAILevel(10);
        setCredits(10000);
        quantumProcessorHandlers.reset();
        setShowCheats(false);
    };

    const handleAddCredits = () => {
        setCredits(creditAmount);
    };

    const [showDanger, setShowDanger] = useState(false);
    const [currentDangerType, setCurrentDangerType] = useState('INDIRECT_FIRE');

    const handleDangerTrigger = (dangerType) => {
        if (volumeRef.current) {
            // DAMAGE SOUND
            zzfx(
                volumeRef.current,
                0.1,
                150,
                0.49,
                0,
                0.52,
                1,
                1,
                0.5,
                0.01,
                25,
                0.78,
                0.08,
                1.4,
                0.25,
                0.09,
                0.01,
                0.8,
                0.07,
                0.69,
                350
            ); // Random 68 - Mutation 3
        }
        setCurrentDangerType(dangerType);
        setShowDanger(true);
    };

    return (
        <div className="admin-debug">
            <div className="cheats-toggle">
                {showCheats ? (
                    <>
                        <button onClick={toggleCheats}>Hide Cheats</button>
                        <button onClick={removeCheaterStatus}>Restart Game without cheats</button>
                    </>
                ) : (
                    <button onClick={enableCheats}>Show Cheats</button>
                )}
            </div>

            {showCheats && (
                <div className="cheats-container">
                    <div className="form-group">
                        <label>Improved AI Level</label>
                        <input
                            type="number"
                            value={improvedAILevel}
                            onChange={(e) => setimprovedAILevel(Number(e.target.value))}
                            min={0}
                            max={100000}
                        />
                    </div>

                    <div className="admin-section">
                        <h3>Random Encounter</h3>
                        <div className="enemy-type-selector">
                            {Object.values(ENEMY_TYPES).map((type) => (
                                <label key={type} className="radio-label">
                                    <input
                                        type="radio"
                                        name="enemyType"
                                        value={type}
                                        checked={selectedEnemyType === type}
                                        onChange={() => setSelectedEnemyType(type)}
                                    />
                                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                                </label>
                            ))}
                        </div>
                        <button
                            className="admin-button"
                            onClick={triggerRandomEncounter}
                            style={{ marginTop: '10px' }}
                        >
                            Trigger Random Encounter
                        </button>
                    </div>

                    <div className="form-group">
                        <label>Add Credits</label>
                        <div className="input-group">
                            <input
                                type="number"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(Number(e.target.value))}
                            />
                            <button onClick={handleAddCredits}>Add</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Quantum Processors</label>
                        <div className="input-group">
                            <input
                                type="number"
                                value={qpAmount}
                                onChange={(e) => setQPAmount(Number(e.target.value))}
                                min={1}
                                step={1}
                                className="qp-input"
                            />
                            <div className="button-group">
                                <button onClick={handleAddQPs}>Add</button>
                                <button onClick={handleResetQPs} className="reset-btn">
                                    Reset
                                </button>
                            </div>
                        </div>
                        <div className="qp-count">
                            Current: {currentQPs} (Total Items: {safeQuantumInventory.length})
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Delivery Speed (Courier Drones)</label>
                        <div className="input-group">
                            <input
                                type="number"
                                value={deliverySpeedOverride}
                                onChange={(e) => setDeliverySpeedOverride(Number(e.target.value))}
                                min={0}
                                max={100}
                            />
                            <button
                                onClick={() => {
                                    try {
                                        if (typeof setCourierDrones !== 'function') {
                                            throw new Error('setCourierDrones is not a function');
                                        }
                                        const newSpeed = Number(deliverySpeedOverride);
                                        setCourierDrones(newSpeed);
                                        // Also update delivery speed in MarketplaceContext
                                        if (typeof setDeliverySpeed === 'function') {
                                            setDeliverySpeed(newSpeed);
                                        }
                                        console.log(`Delivery speed set to: ${newSpeed}`);
                                    } catch (error) {
                                        console.error('Error setting delivery speed:', error);
                                        alert(`Failed to set delivery speed: ${error.message}`);
                                    }
                                }}
                                disabled={deliverySpeedOverride === courierDrones}
                            >
                                {deliverySpeedOverride === courierDrones ? 'Current' : 'Set'}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Event System</label>
                        <div className="input-group">
                            <button onClick={triggerTestEvent} className="btn btn-warning">
                                Trigger Random Event
                            </button>
                            <Event />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Danger Tester</label>
                        <div className="danger-buttons">
                            {Object.keys(DANGER_TYPES).map((type) => (
                                <button key={type} onClick={() => handleDangerTrigger(type)}>
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showDanger && (
                <Danger
                    type={currentDangerType}
                    onDamage={(damage) => {
                        // Apply damage to player and show damage effect
                        if (typeof setHealth === 'function') {
                            // Use the ref to get the latest health value
                            const currentHealth = healthRef?.current ?? health;
                            const newHealth = Math.max(0, currentHealth - damage);
                            setHealth(newHealth);
                            // Add damage effect to show in HUD
                            addStatEffect('damage_player', damage);
                            console.log(
                                `Player took ${damage} damage. Health: ${newHealth}/${maxHealth}`
                            );
                        } else {
                            console.error('setHealth is not a function');
                        }
                    }}
                    currentHealth={health}
                    maxHealth={maxHealth}
                    onClose={(outcome, damage) => {
                        console.log(`Danger closed. Outcome: ${outcome}, Damage: ${damage || 0}`);
                        // If there was damage, make sure to show it in the HUD
                        if (damage && damage > 0) {
                            addStatEffect('damage_player', damage);
                        }
                        setShowDanger(false);
                    }}
                />
            )}
        </div>
    );
};

export default AdminDebug;
