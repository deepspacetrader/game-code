import React from 'react';
import { PlayerStatsProvider } from './PlayerStatsContext';
import { EffectsProvider } from './EffectsContext';
// import { UIProvider } from './UIContext';
// import { GameEventProvider } from './EventContext';

export const AppProviders = ({ children }) => (
    <PlayerStatsProvider>
        <EffectsProvider>
            {/* <UIProvider> */}
            {/* <GameEventProvider> */}
            {children}
            {/* </GameEventProvider> */}
            {/* </UIProvider> */}
        </EffectsProvider>
    </PlayerStatsProvider>
);
