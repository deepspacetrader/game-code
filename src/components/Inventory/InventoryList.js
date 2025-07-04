import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import itemsData from '../../data/items.json';
import { useUI } from '../../context/UIContext';
import './InventoryList.scss';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { onboardingUseQBit, onboardingSellQBit } from '../Onboarding/Onboarding';

const InventoryList = () => {
    const {
        inventory,
        purchaseHistory,
        handleUseItem,
        displayCells,
        handleSellAll,
        statusEffects,
        inTravel,
    } = useMarketplace();
    const { improvedUILevel } = useUI();
    const defs = itemsData.items;
    const uiTier =
        improvedUILevel < 25
            ? 'low'
            : improvedUILevel < 50
            ? 'medium'
            : improvedUILevel < 75
            ? 'high'
            : improvedUILevel < 100
            ? 'ultra'
            : 'elite';
    const itemImages = require.context('../../images', false, /^\.\/item\d+\.webp$/);

    return (
        <>
            <h3 className="inventory-title">Inventory</h3>
            <div className="inventory grid">
                {inventory.map((item) => {
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
                    const def = defs.find((d) => d.name === item.name);
                    // determine if trader trades this item
                    const isTraded = displayCells.some((c) => c.name === item.name);
                    // disable or hide sell all based on UI level and trade availability
                    const disableSellAll =
                        !isTraded && improvedUILevel >= 50 && improvedUILevel < 75;
                    const hideSellAll = !isTraded && improvedUILevel >= 75;
                    // get itemId for image
                    const itemId = def?.itemId;

                    return (
                        <div key={item.name} className="cell inv-item" data-item-id={itemId}>
                            {/* Hover popup info for items */}
                            <OverlayTrigger
                                placement="bottom"
                                overlay={
                                    <Tooltip className="item-tooltip" id={`tooltip-${item.name}`}>
                                        {def.description}
                                    </Tooltip>
                                }
                            >
                                <div className="item-image-wrapper">
                                    <span className="item-image-name">{item.name}</span>
                                    {(() => {
                                        const key = `./item${itemId}.webp`;
                                        if (itemImages.keys().includes(key)) {
                                            return (
                                                <div
                                                    className="item-image-bg"
                                                    style={{
                                                        backgroundImage: `url(${itemImages(key)})`,
                                                    }}
                                                />
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </OverlayTrigger>

                            <p>Owned: {item.quantity}</p>
                            {improvedUILevel >= 75 && avg !== null && ` (Avg: ${avg})`}
                            {improvedUILevel >= 5 && pl !== null && (
                                <div
                                    className={parseFloat(pl) >= 0 ? 'pl-positive' : 'pl-negative'}
                                >
                                    <p>{pl}</p>
                                    <p>{value && `Value: ${value}`}</p>
                                </div>
                            )}

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
                                        const invIt = inventory.find((i) => i.name === item.name);
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

                            {improvedUILevel >= 10 && !hideSellAll && (
                                <button
                                    className={[
                                        'sell-all-btn',
                                        disableSellAll ? 'disabled' : '',
                                        improvedUILevel >= 25 && pl !== null
                                            ? parseFloat(pl) >= 0
                                                ? 'profit'
                                                : 'loss'
                                            : '',
                                        `ui-tier-${uiTier}`,
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
                                    {improvedUILevel >= 100 && pl !== null
                                        ? ` (${parseFloat(pl) >= 0 ? 'Profit' : 'Loss'})`
                                        : ''}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default InventoryList;
