import React from 'react';
import './SecretTradingArea.scss';

const SecretTradingArea = ({ secretItems = [], onBuy, visible }) => {
    if (!visible) return null;

    return (
        <div className="secret-trading-area">
            <div className="secret-trading-warning">
                <span aria-label="warning">⚠️ Secret Market ⚠️</span>
            </div>
            <div className="secret-items-grid">
                {secretItems.map((item) => (
                    <div className="secret-item-card" key={item.secretItemId}>
                        <div className="secret-item-name">{item.name}</div>
                        <div className="secret-item-desc">{item.description}</div>
                        {/* <div className="secret-item-effects">
                            {Object.entries(item.effects).map(([effect, val]) => (
                                <div
                                    key={effect}
                                    className={`effect effect-${
                                        effect.includes('heal') ? 'heal' : 'harm'
                                    }`}
                                >
                                    {effect.includes('heal') ? '+' : '-'}
                                    {Array.isArray(val) ? `${val[0]}~${val[1]}` : val} HP
                                </div>
                            ))}
                        </div> */}
                        <div className="secret-item-price">Price: {item.basePrice} cr</div>
                        <button className="buy-btn" onClick={() => onBuy(item)}>
                            Buy
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SecretTradingArea;
