import React, { useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useUI } from '../context/UIContext';
import { zzfx } from 'zzfx';
import { Danger, DANGER_TYPES } from './Danger';
import './AdminDebug.scss';

const AdminDebug = () => {
    const [showCheats, setShowCheats] = useState(false);
    const { improvedUILevel, setImprovedUILevel, setCourierDrones, courierDrones } = useUI();
    const { 
        triggerRandomEvent, 
        setCredits, 
        addQuantumProcessors, 
        resetQuantumProcessors,
        health,
        setHealth,
        maxHealth 
    } = useMarketplace();
    const [creditAmount, setCreditAmount] = useState(10000000);
    const [qpAmount, setQPAmount] = useState(1);
    const [deliverySpeedOverride, setDeliverySpeedOverride] = useState(courierDrones);

    const toggleCheats = () => {
        if (localStorage.getItem('isCheater') === 'true') {
            setShowCheats(!showCheats);
        } else {
            const confirmText =
                'Are you sure? This will let you access developer cheats. Type "yes" to confirm.';
            const input = window.prompt(confirmText);
            if (input === 'yes') {
                setShowCheats(true);
                localStorage.setItem('isCheater', 'true');
            } else {
                window.alert('Cancelled');
            }
        }
    };

    const removeCheaterStatus = () => {
        localStorage.removeItem('isCheater');
        setImprovedUILevel(10);
        setCredits(5000);
        resetQuantumProcessors();
        setShowCheats(false);
    };

    const handleRandomEvent = () => {
        if (volumeRef.current) {
            // ZZFX sound TBD
        }
        triggerRandomEvent();
    };

    const handleAddCredits = () => {
        setCredits(creditAmount);
    };

    const handleAddQPs = () => {
        addQuantumProcessors(qpAmount);
    };

    const [showDanger, setShowDanger] = useState(false);
    const [currentDangerType, setCurrentDangerType] = useState('INDIRECT_FIRE');
    const { volumeRef } = useMarketplace();

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
                        <label>Add Q Processors</label>
                        <div className="input-group">
                            <input
                                type="number"
                                value={qpAmount}
                                onChange={(e) => setQPAmount(Number(e.target.value))}
                            />
                            <button onClick={handleAddQPs}>Add</button>
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
                            <button onClick={() => setCourierDrones(deliverySpeedOverride)}>
                                Set
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Trigger Random Event</label>
                        <button onClick={handleRandomEvent}>Trigger</button>
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
                        // Apply damage to player using the context setter
                        setHealth(prev => Math.max(0, prev - damage));
                    }}
                    currentHealth={health}
                    maxHealth={maxHealth}
                    onClose={(outcome, damage) => {
                        console.log(`Danger closed. Outcome: ${outcome}, Damage: ${damage || 0}`);
                        setShowDanger(false);
                    }}
                />
            )}
        </div>
    );
};

export default AdminDebug;
