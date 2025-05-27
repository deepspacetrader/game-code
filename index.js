import React from 'react';
import ReactDOM from 'react-dom/client';
import Marketplace from './Marketplace';
import './StarBackground.scss';
import { StatusEffectsProvider } from './context/StatusEffectsContext';
import { MarketplaceProvider } from './context/MarketplaceContext';
import { UIProvider } from './context/UIContext';
import { GameProvider } from './context/GameContext';

// Generate random star positions on each refresh
const STAR_COUNT = 500;
const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100, // vw
    top: Math.random() * 100, // vh
    size: i % 2 === 0 ? 2 : 1, // px, alternate sizes
}));

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <div className="star-background">
        <div className="stars">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="star"
                    style={{
                        left: `${star.left}vw`,
                        top: `${star.top}vh`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                    }}
                ></div>
            ))}
        </div>
        <GameProvider>
            <StatusEffectsProvider>
                <UIProvider>
                    <MarketplaceProvider>
                        <Marketplace />
                    </MarketplaceProvider>
                </UIProvider>
            </StatusEffectsProvider>
        </GameProvider>
    </div>
);
