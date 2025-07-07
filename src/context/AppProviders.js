import React from 'react';
import { PlayerStatsProvider } from './PlayerStatsContext';
import { EffectsProvider } from './EffectsContext';
// import { AILevelProvider } from './AILevelContext';
// import { GameEventProvider } from './EventContext';

export const AppProviders = ({ children }) => (
    <PlayerStatsProvider>
        <EffectsProvider>
            {/* <AILevelProvider> */}
            {/* <GameEventProvider> */}
            {children}
            {/* </GameEventProvider> */}
            {/* </AILevelProvider> */}
        </EffectsProvider>
    </PlayerStatsProvider>
);
