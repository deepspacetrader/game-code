import React, { useState, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import itemsData from '../../data/items.json';
import secretItemsData from '../../data/secret-items.json';
import tradersData from '../../data/traders.json';
import traderMessagesData from '../../data/trader-messages.json';
import { useAILevel } from '../../context/AILevelContext';
import './InventoryList.scss';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { onboardingUseQBit, onboardingSellQBit } from '../Onboarding/Onboarding';
import TraderMessage from '../Trader/TraderMessage';

/**
 * Add right-click sell for secret items.
 * - Sells all quantity if trader is addicted, pays basePrice * multiplier * quantity.
 * - If not addicted, increments persistent per-trader rejection counter.
 * - If counter > maxSecretRejections and not in war/danger zone, triggers market police.
 * - If in war/danger zone, nothing happens.
 * - Uses secretItemId for matching.
 */
const InventoryList = () => {
    const {
        inventory,
        purchaseHistory,
        handleUseItem,
        displayCells,
        handleSellAll,
        statusEffects,
        inTravel,
        setCredits,
        setInventory,
        addFloatingMessage,
        setCurrentEnemy,
        currentTrader,
        traders,
        galaxyName,
        // Add any other needed context
    } = useMarketplace();
    const { improvedAILevel } = useAILevel();
    const trader = tradersData.traders.find((t) => t.traderId === currentTrader);
    const defs = itemsData.items;
    const secretDefs = secretItemsData.secretItems;
    const allDefs = [...defs, ...secretDefs];

    // Persistent per-trader rejection counter (in-memory for now)
    const [secretRejectionCounts, setSecretRejectionCounts] = useState({});
    const [secretOfferResult, setSecretOfferResult] = useState(null);

    // Add local floating message state for secret items
    const [localOfferMessages, setLocalOfferMessages] = useState({}); // { [secretItemId]: { text, type } }

    const aiTier =
        improvedAILevel < 25
            ? 'low'
            : improvedAILevel < 50
            ? 'medium'
            : improvedAILevel < 75
            ? 'high'
            : improvedAILevel < 100
            ? 'ultra'
            : 'elite';
    const itemImages = require.context('../../images', false, /^\.\/item\d+\.webp$/);
    const secretItemImages = require.context('../../images', false, /^\.\/secret-item\d+\.webp$/);

    // Helper: get current galaxy danger/war status
    // (Assume useMarketplace or context provides this, or add a helper if not)
    const isDangerOrWar = false; // TODO: Replace with actual check

    const getPreferredLanguage = (trader) => {
        // Determine preferred language based on statusEffects and trader's languageRange
        if (statusEffects['translate_CHIK'] && trader.languageRange.includes('CHIK')) return 'CHIK';
        if (statusEffects['translate_LAY'] && trader.languageRange.includes('LAY')) return 'LAY';
        return 'EN';
    };

    const getRandomTraderMessage = (trader, type, statusEffects) => {
        // type: 'accept' | 'reject'
        const traderMsg = traderMessagesData.traderMessages.find(
            (tm) => tm.traderId === trader.traderId
        );
        if (!traderMsg) return '';
        const messages = type === 'accept' ? traderMsg.secretAccepts : traderMsg.secretRejections;
        if (!messages) return '';
        // Translator logic
        const hasCHIK =
            statusEffects['translate_CHIK'] || statusEffects['Auto Translator CHIK']?.active;
        const hasLAY =
            statusEffects['translate_LAY'] || statusEffects['Auto Translator LAY']?.active;
        let lang = 'EN';
        if (hasCHIK && messages['CHIK']) lang = 'CHIK';
        else if (hasLAY && messages['LAY']) lang = 'LAY';
        else if (messages['EN']) lang = 'EN';
        else lang = Object.keys(messages)[0];
        const arr = messages[lang] || [];
        if (!arr.length) return '';
        return arr[Math.floor(Math.random() * arr.length)];
    };

    const handleMakeOffer = (item) => {
        const trader = tradersData.traders.find((t) => t.traderId === currentTrader);
        if (!trader) return;
        const isAddicted = trader.secretAddiction === item.secretItemId;
        const traderKey = trader.traderId;
        const maxRejections = trader.maxSecretRejections;
        let count = secretRejectionCounts[traderKey] || 0;
        const preferredLanguage = getPreferredLanguage(trader);
        if (isAddicted) {
            const [min, max] = trader.secretAddictionMultiplier;
            const multiplier = Math.random() * (max - min) + min;
            const payout = Math.round(item.basePrice * multiplier * item.quantity);
            setCredits((c) => c + payout);
            setInventory((inv) => inv.filter((i) => i.secretItemId !== item.secretItemId));
            setSecretRejectionCounts((prev) => ({ ...prev, [traderKey]: 0 }));
            setLocalOfferMessages((prev) => ({
                ...prev,
                [item.secretItemId]: {
                    text: getRandomTraderMessage(trader, 'accept', statusEffects),
                    type: 'success',
                },
            }));
            setSecretOfferResult({ type: 'accept', language: preferredLanguage });
        } else {
            count += 1;
            setSecretRejectionCounts((prev) => ({ ...prev, [traderKey]: count }));
            setLocalOfferMessages((prev) => ({
                ...prev,
                [item.secretItemId]: {
                    text: getRandomTraderMessage(trader, 'reject', statusEffects),
                    type: count > maxRejections && !isDangerOrWar ? 'danger' : 'warning',
                },
            }));
            setSecretOfferResult({ type: 'reject', language: preferredLanguage });
            if (count > maxRejections && !isDangerOrWar) {
                setCurrentEnemy({
                    name: 'Market Police',
                    type: 'market_police',
                    health: 200,
                    damage: 25,
                    isHostile: true,
                    isMarketPolice: true,
                    reason: 'secret_item_offer',
                });
            }
        }
        // Hide the local message after 2.5s
        setTimeout(() => {
            setLocalOfferMessages((prev) => ({ ...prev, [item.secretItemId]: null }));
        }, 2500);
        // Clear secretOfferResult after 2.5s
        setTimeout(() => setSecretOfferResult(null), 2500);
    };

    return (
        <>
            <h3 className="inventory-title">Inventory</h3>
            <div className="inventory grid">
                {inventory
                    .filter((item) => !secretDefs.some((s) => s.secretItemId === item.secretItemId))
                    .map((item) => {
                        const history = purchaseHistory[item.name] || [];
                        const avg = history.length
                            ? (history.reduce((a, p) => a + p, 0) / history.length).toFixed(2)
                            : null;
                        const cell = displayCells?.find((c) => c.name === item.name);
                        const pl =
                            avg !== null && cell?.price != null
                                ? (cell.price - parseFloat(avg)).toFixed(2)
                                : null;
                        const value = cell?.price ? (cell.price * item.quantity).toFixed(2) : null;
                        const def = defs.find((d) => d.itemId === item.itemId);
                        // determine if trader trades this item
                        const isTraded = displayCells.some((c) => c.name === item.name);
                        // disable or hide sell all based on AI level and trade availability
                        const disableSellAll =
                            !isTraded && improvedAILevel >= 50 && improvedAILevel < 75;
                        const hideSellAll = !isTraded && improvedAILevel >= 75;
                        // get itemId for image
                        const itemId = def?.itemId;

                        return (
                            <div key={item.name} className="cell inv-item" data-item-id={itemId}>
                                {/* Hover popup info for items */}
                                <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                        <Tooltip
                                            className="item-tooltip"
                                            id={`tooltip-${item.name}`}
                                        >
                                            {def ? def.description : 'No description available'}
                                        </Tooltip>
                                    }
                                >
                                    <div className="item-image-wrapper">
                                        <span className="item-image-name">{item.name}</span>
                                        {(() => {
                                            if (itemId !== undefined) {
                                                const key = `./item${itemId}.webp`;
                                                if (itemImages.keys().includes(key)) {
                                                    return (
                                                        <div
                                                            className="item-image-bg"
                                                            style={{
                                                                backgroundImage: `url(${itemImages(
                                                                    key
                                                                )})`,
                                                            }}
                                                        />
                                                    );
                                                }
                                            }
                                            // fallback visual if image is missing
                                            return <div className="item-image-bg missing-image" />;
                                        })()}
                                    </div>
                                </OverlayTrigger>

                                <p>Owned: {item.quantity}</p>

                                <div className="button-row use-buttons">
                                    <button
                                        onClick={() => {
                                            handleUseItem(item.name);
                                            if (
                                                item.name === 'Basic QBiT Inverter' &&
                                                onboardingUseQBit
                                            )
                                                onboardingUseQBit();
                                        }}
                                    >
                                        Use 1
                                    </button>

                                    <button
                                        className="use-all-btn"
                                        onClick={() => {
                                            const invIt = inventory.find(
                                                (i) => i.name === item.name
                                            );
                                            if (invIt) {
                                                for (let k = 0; k < invIt.quantity; k++) {
                                                    handleUseItem(item.name);
                                                }
                                                if (
                                                    item.name === 'Basic QBiT Inverter' &&
                                                    onboardingUseQBit
                                                )
                                                    onboardingUseQBit();
                                            }
                                        }}
                                    >
                                        Use All
                                    </button>
                                </div>

                                {improvedAILevel >= 75 && avg !== null && ` (Avg: ${avg})`}
                                {improvedAILevel >= 5 && pl !== null && (
                                    <div
                                        className={
                                            parseFloat(pl) >= 0 ? 'pl-positive' : 'pl-negative'
                                        }
                                    >
                                        <p>{parseFloat(pl) >= 0 ? `+${pl}` : pl}</p>
                                        <p>{value && `Value: ${value}`}</p>
                                    </div>
                                )}

                                {improvedAILevel >= 10 && !hideSellAll && (
                                    <button
                                        className={[
                                            'sell-all-btn',
                                            disableSellAll ? 'disabled' : '',
                                            improvedAILevel >= 25 && pl !== null
                                                ? parseFloat(pl) >= 0
                                                    ? 'profit'
                                                    : 'loss'
                                                : '',
                                            `ai-tier-${aiTier}`,
                                        ]
                                            .join(' ')
                                            .trim()}
                                        onClick={
                                            disableSellAll
                                                ? undefined
                                                : () => {
                                                      // Allow sell all if not inTravel or tool_reverter is active
                                                      if (
                                                          !inTravel ||
                                                          statusEffects.tool_reverter?.active
                                                      ) {
                                                          handleSellAll(item.name);
                                                          if (
                                                              item.name === 'Basic QBiT Inverter' &&
                                                              onboardingSellQBit
                                                          )
                                                              onboardingSellQBit();
                                                      }
                                                  }
                                        }
                                        disabled={disableSellAll}
                                    >
                                        Sell All
                                        {improvedAILevel >= 100 && pl !== null
                                            ? ` (${parseFloat(pl) >= 0 ? 'Profit' : 'Loss'})`
                                            : ''}
                                    </button>
                                )}
                            </div>
                        );
                    })}
            </div>
            {/* Secret Items Section */}
            {inventory.some((item) =>
                secretDefs.some((s) => s.secretItemId === item.secretItemId)
            ) && (
                <>
                    <h3 className="inventory-title secret">Secret Inventory</h3>
                    <div className="inventory grid secret-inventory">
                        {inventory
                            .filter((item) =>
                                secretDefs.some((s) => s.secretItemId === item.secretItemId)
                            )
                            .map((item) => {
                                const def = secretDefs.find(
                                    (d) => d.secretItemId === item.secretItemId
                                );
                                const itemId = def?.secretItemId;
                                // Right-click sell handler
                                const handleSecretSell = (e) => {
                                    e.preventDefault();
                                    if (!trader || !def) return;
                                    // Use secretItemId for matching
                                    const addictedId = trader.secretAddiction;
                                    const addictedMultiplier = trader.secretAddictionMultiplier;
                                    const maxRejections = trader.maxSecretRejections;
                                    const traderKey = trader.traderId;
                                    let count = secretRejectionCounts[traderKey] || 0;
                                    if (addictedId === itemId) {
                                        // Trader is addicted, buy all
                                        const payout =
                                            def.basePrice * addictedMultiplier * item.quantity;
                                        setCredits((c) => c + payout);
                                        setInventory((inv) =>
                                            inv.filter((i) => i.name !== item.name)
                                        );
                                        addFloatingMessage(
                                            `Trader buys all your ${item.name} for ${payout.toFixed(
                                                0
                                            )} credits!`,
                                            'global'
                                        );
                                    } else {
                                        // Not addicted, increment rejection
                                        count++;
                                        setSecretRejectionCounts((prev) => ({
                                            ...prev,
                                            [traderKey]: count,
                                        }));
                                        addFloatingMessage(
                                            `Trader refuses your offer of ${item.name}. (${count}/${maxRejections})`,
                                            'global'
                                        );
                                        if (count > maxRejections) {
                                            if (!isDangerOrWar) {
                                                // Trigger market police
                                                setCurrentEnemy({
                                                    name: 'Market Police (Illegal Goods)',
                                                    type: 'market_police',
                                                    rank: 'A',
                                                    health: 250,
                                                    damage: 20,
                                                    statusEffects: [
                                                        'Lawful Presence',
                                                        'System Scan',
                                                    ],
                                                    isHostile: true,
                                                    isMarketPolice: true,
                                                    reason: 'illegal_item',
                                                });
                                                addFloatingMessage(
                                                    'Market Police have been alerted!',
                                                    'danger'
                                                );
                                            } else {
                                                // In war/danger zone, nothing happens
                                                addFloatingMessage(
                                                    'Trader refuses, but no police in this zone.',
                                                    'info'
                                                );
                                            }
                                        }
                                    }
                                };
                                return (
                                    <div
                                        key={item.name}
                                        className="cell inv-item secret-item"
                                        data-item-id={itemId}
                                        onContextMenu={handleSecretSell}
                                    >
                                        <OverlayTrigger
                                            placement="bottom"
                                            overlay={
                                                <Tooltip
                                                    className="item-tooltip"
                                                    id={`tooltip-${item.name}`}
                                                >
                                                    {def
                                                        ? def.description
                                                        : 'No description available'}
                                                </Tooltip>
                                            }
                                        >
                                            <div className="item-image-wrapper">
                                                <span className="item-image-name">{item.name}</span>
                                                {(() => {
                                                    const secretId = def?.secretItemId;
                                                    if (secretId !== undefined) {
                                                        const key = `./secret-item${secretId}.webp`;
                                                        if (secretItemImages.keys().includes(key)) {
                                                            return (
                                                                <div
                                                                    className="item-image-bg"
                                                                    style={{
                                                                        backgroundImage: `url(${secretItemImages(
                                                                            key
                                                                        )})`,
                                                                    }}
                                                                />
                                                            );
                                                        }
                                                    }
                                                    // fallback visual if image is missing
                                                    return (
                                                        <div className="item-image-bg missing-image" />
                                                    );
                                                })()}
                                            </div>
                                        </OverlayTrigger>
                                        <p>Owned: {item.quantity}</p>
                                        <div
                                            className="button-row use-buttons"
                                            style={{ position: 'relative' }}
                                        >
                                            <button onClick={() => handleUseItem(item.name)}>
                                                Use 1
                                            </button>
                                            <button
                                                className="use-all-btn"
                                                onClick={() => {
                                                    const invIt = inventory.find(
                                                        (i) => i.name === item.name
                                                    );
                                                    if (invIt) {
                                                        for (let k = 0; k < invIt.quantity; k++) {
                                                            handleUseItem(item.name);
                                                        }
                                                    }
                                                }}
                                            >
                                                Use All
                                            </button>
                                            <button onClick={() => handleMakeOffer(item)}>
                                                Make Offer
                                            </button>
                                            {localOfferMessages[item.secretItemId] && (
                                                <span
                                                    className={`floating-message ${
                                                        localOfferMessages[item.secretItemId]
                                                            .type || ''
                                                    }`}
                                                    style={{
                                                        position: 'absolute',
                                                        left: '105%',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        marginLeft: 8,
                                                        zIndex: 10,
                                                        minWidth: 120,
                                                        textAlign: 'center',
                                                        pointerEvents: 'none',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {localOfferMessages[item.secretItemId].text}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </>
            )}
            {secretOfferResult && (
                <TraderMessage
                    currentTrader={trader?.traderId || currentTrader}
                    traderMessages={traderMessagesData.traderMessages}
                    statusEffects={statusEffects}
                    secretOfferResult={secretOfferResult}
                />
            )}
        </>
    );
};

export default InventoryList;
