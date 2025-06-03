import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import { useEventContext } from '../../context/EventContext';
import { useStatusEffects } from '../../context/StatusEffectsContext';
import { zzfx } from 'zzfx';
import { Danger, DANGER_TYPES } from '../Reusable/Danger';
import Event from '../Reusable/Event';
import randomEvents from '../../data/random-events.json';
import { encryptData, decryptData } from '../../utils/encryption';
import './AdminDebug.scss';

const AdminDebug = () => {
    const [showCheats, setShowCheats] = useState(false);
    const { improvedUILevel, setImprovedUILevel, setCourierDrones, courierDrones } = useUI();
    const {
        health,
        healthRef,
        setHealth,
        setCredits,
        maxHealth,
        volumeRef,
        setDeliverySpeed,
        quantumProcessors = 0,
        updateQuantumProcessors,
        quantumInventory = [],
        setCurrentGameEvent,
    } = useMarketplace();

    const { triggerRandomEvent } = useEventContext();
    const { addStatEffect } = useStatusEffects();

    // Debug function to trigger a test event
    const triggerTestEvent = () => {
        try {
            if (typeof triggerRandomEvent !== 'function') {
                throw new Error('triggerRandomEvent is not a function');
            }
            console.log('[Event] Manually triggering test event');
            triggerRandomEvent();
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

    // Memoize quantum processor functions
    const quantumProcessorHandlers = useMemo(
        () => ({
            add: (amount) => {
                if (updateQuantumProcessors) {
                    const newCount = (quantumProcessors || 0) + Number(amount);
                    updateQuantumProcessors(newCount);
                }
            },
            reset: () => {
                if (updateQuantumProcessors) {
                    updateQuantumProcessors(0);
                }
            },
        }),
        [quantumProcessors, updateQuantumProcessors]
    );

    // Get current quantum processor count
    const currentQPs = quantumProcessors || 0;

    // Sync delivery speed override with courierDrones and update delivery speed in MarketplaceContext
    useEffect(() => {
        setDeliverySpeedOverride(courierDrones);
        // Update delivery speed in MarketplaceContext when courierDrones changes
        if (typeof setDeliverySpeed === 'function') {
            setDeliverySpeed(courierDrones || 1);
        }
    }, [courierDrones, setDeliverySpeed]);

    const toggleCheats = () => {
        if (localStorage.getItem('isCheater') === 'true') {
            setShowCheats(!showCheats);
        } else {
            const confirmText =
                'WARNING: Enabling cheats will delete all saved game progress.\n\n' +
                'This action cannot be undone. All your current progress will be lost.\n\n' +
                'Type "ye" to confirm and enable cheats.';
            const input = window.prompt(confirmText);
            if (input === 'I understand') {
                // Clear all saved game data
                localStorage.removeItem('scifiMarketSave');
                // Set cheater flag
                localStorage.setItem('isCheater', 'true');
                // Reset game state
                setImprovedUILevel(10);
                setCredits(10000);
                quantumProcessorHandlers.reset();
                // Show cheats menu
                setShowCheats(true);
                // Notify user
                alert('Cheats enabled. All previous game data has been cleared.');
            } else {
                window.alert('Cheats not enabled. Your game data is safe.');
            }
        }
    };

    const removeCheaterStatus = () => {
        // Clear any saved game data to prevent loading cheated progress
        localStorage.removeItem('scifiMarketSave');

        // Remove cheater status from localStorage
        localStorage.removeItem('isCheater');

        // Reset game state to default values
        setImprovedUILevel(10);
        setCredits(10000);
        quantumProcessorHandlers.reset();
        setShowCheats(false);

        // Notify the user that saved data has been cleared
        alert('Cheats removed. All saved game data has been cleared.');
    };

    const handleAddCredits = () => {
        setCredits(creditAmount);
    };

    const handleAddQPs = () => {
        try {
            if (!updateQuantumProcessors) {
                console.error('updateQuantumProcessors function is not available');
                alert('Failed to add QPs: updateQuantumProcessors is not available');
                return;
            }
            quantumProcessorHandlers.add(qpAmount);
        } catch (error) {
            console.error('Error adding QPs:', error);
            alert(`Failed to add QPs: ${error.message}`);
        }
    };

    const handleResetQPs = () => {
        quantumProcessorHandlers.reset();
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
                <button onClick={toggleCheats}>{showCheats ? 'Hide Cheats' : 'Show Cheats'}</button>
                {showCheats && <button onClick={removeCheaterStatus}>Reset Cheats</button>}
            </div>

            {showCheats && (
                <div className="cheats-container">
                    <div className="form-group">
                        <label>Improved UI Level</label>
                        <input
                            type="number"
                            value={improvedUILevel}
                            onChange={(e) => setImprovedUILevel(Number(e.target.value))}
                            min={0}
                            max={100000}
                        />
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
