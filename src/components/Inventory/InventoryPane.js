import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import InventoryList from './InventoryList';
import QuantumSetup from '../Quantum/QuantumSetup';

import DeliveryBar from '../Reusable/DeliveryBar';
import '../PlayerHUD.scss';

function groupStatusEffectsByName(effects, filterFn) {
    // Group by itemName or key/type
    const grouped = {};
    Object.entries(effects).forEach(([key, eff]) => {
        if (filterFn && !filterFn(eff)) return;
        const name = eff.itemName || eff.type || key;
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push({ ...eff, _key: key });
    });
    return grouped;
}

const InventoryPane = () => {
    const {
        statusEffects,
        inventory,
        setQuantumSlotsUsed,
        setStatusEffects,
        subtractQuantumProcessor,
    } = useMarketplace();
    const { improvedAILevel } = useAILevel();

    // Group installed modules (all status effects)
    const installedModulesGrouped = groupStatusEffectsByName(statusEffects, () => true);
    // Group active effects (not fuel_cost)
    const activeEffectsGrouped = groupStatusEffectsByName(
        statusEffects,
        (eff) => eff.type !== 'fuel_cost'
    );
    // Group fuel cost reductions
    const fuelCostGrouped = groupStatusEffectsByName(
        statusEffects,
        (eff) => eff.type === 'fuel_cost'
    );

    return (
        <div className="inventory-pane">
            <QuantumSetup
                inventory={inventory}
                subtractQuantumProcessor={subtractQuantumProcessor}
                setQuantumSlotsUsed={setQuantumSlotsUsed}
                setStatusEffects={setStatusEffects}
            />
            <div className="inventory-content">
                <InventoryList />
                {Object.keys(installedModulesGrouped).length > 0 && (
                    <div className="ship-inventory">
                        {improvedAILevel >= 10 && (
                            <div>
                                <h3>Installed Modules</h3>
                                {Object.entries(installedModulesGrouped).map(([name, group]) => {
                                    // Use the max remainingTime for the group
                                    const withTimers = group.filter(
                                        (eff) => eff.remainingTime && eff.duration
                                    );
                                    if (!withTimers.length) return null;
                                    const maxRemaining = Math.max(
                                        ...withTimers.map((eff) => eff.remainingTime)
                                    );
                                    const duration = withTimers[0].duration;
                                    const value = group.reduce(
                                        (sum, eff) => sum + (eff.value || 0),
                                        0
                                    );
                                    return (
                                        <div key={name} className="effect-item">
                                            <span>
                                                {name} x{group.length} ({Math.abs(value)} effect)
                                            </span>
                                            <DeliveryBar
                                                timeLeft={maxRemaining}
                                                totalTime={duration}
                                            />
                                            <span className="effect-timer-label">
                                                {Math.ceil((maxRemaining || 0) / 1000)}s
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Active Effects */}
                        {Object.keys(activeEffectsGrouped).length > 0 && (
                            <div className="active-effects">
                                <h3>Active Effects</h3>
                                {Object.entries(activeEffectsGrouped).map(([name, group]) => {
                                    // Use the max remainingTime for the group
                                    const withTimers = group.filter(
                                        (eff) => eff.remainingTime && eff.duration
                                    );
                                    if (!withTimers.length) return null;
                                    const maxRemaining = Math.max(
                                        ...withTimers.map((eff) => eff.remainingTime)
                                    );
                                    const duration = withTimers[0].duration;
                                    const value = group.reduce(
                                        (sum, eff) => sum + (eff.value || 0),
                                        0
                                    );
                                    return (
                                        <div key={name} className="effect-item">
                                            <span>
                                                {name} x{group.length} ({Math.abs(value)} effect)
                                            </span>
                                            <DeliveryBar
                                                timeLeft={maxRemaining}
                                                totalTime={duration}
                                            />
                                            <span className="effect-timer-label">
                                                {Math.ceil((maxRemaining || 0) / 1000)}s
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {Object.keys(fuelCostGrouped).length > 0 && (
                            <div className="fuel-savings">
                                <h4>Fuel Savings</h4>
                                {Object.entries(fuelCostGrouped).map(([name, group]) => {
                                    // Use the max remainingTime for the group
                                    const withTimers = group.filter(
                                        (eff) => eff.remainingTime && eff.duration
                                    );
                                    if (!withTimers.length) return null;
                                    const maxRemaining = Math.max(
                                        ...withTimers.map((eff) => eff.remainingTime)
                                    );
                                    const duration = withTimers[0].duration;
                                    const value = group.reduce(
                                        (sum, eff) => sum + (eff.value || 0),
                                        0
                                    );
                                    return (
                                        <div key={name} className="effect-item">
                                            <span>
                                                {name} x{group.length} (-{Math.abs(value)} fuel)
                                            </span>
                                            <DeliveryBar
                                                timeLeft={maxRemaining}
                                                totalTime={duration}
                                            />
                                            <span className="effect-timer-label">
                                                {Math.ceil((maxRemaining || 0) / 1000)}s
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* <h3>Scanner</h3> */}
                {/* <ScannerLite /> */}

                {/* <Scanner
                    images={[faceImage, faceImage2, faceImage3, faceImage4, faceImage5]}
                    onScanComplete={() => console.log('Scan complete!')}
                /> */}
            </div>
        </div>
    );
};

export default InventoryPane;
