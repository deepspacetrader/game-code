import React from 'react';
import ReactDOM from 'react-dom/client';
import Game from './Game';
import './StarBackground.scss';
import { StatusEffectsProvider } from './context/StatusEffectsContext';
import { AILevelProvider } from './context/AILevelContext';
import { EventProvider } from './context/EventContext';
import { NewsProvider } from './context/NewsContext';
import { CheatsProvider } from './context/CheatsContext';
import { MarketplaceProvider } from './context/MarketplaceContext';
import { QuantumProvider } from './context/QuantumContext';

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
        <AILevelProvider>
            <NewsProvider>
                <EventProvider>
                    <MarketplaceProvider>
                        <StatusEffectsProvider>
                            <QuantumProvider>
                                <CheatsProvider>
                                    <Game />
                                </CheatsProvider>
                            </QuantumProvider>
                        </StatusEffectsProvider>
                    </MarketplaceProvider>
                </EventProvider>
            </NewsProvider>
        </AILevelProvider>
    </div>
);
