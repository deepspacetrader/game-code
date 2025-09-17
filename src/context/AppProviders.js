import React from 'react';
import { PlayerStatsProvider } from './PlayerStatsContext';
import { EffectsProvider } from './EffectsContext';
import { QuantumProvider } from './QuantumContext';
import { NewsProvider } from './NewsContext';
// import { AILevelProvider } from './AILevelContext';
// import { GameEventProvider } from './EventContext';

export const AppProviders = ({ children }) => (
    <PlayerStatsProvider>
        <EffectsProvider>
            <QuantumProvider>
                <NewsProvider>
                    {/* <AILevelProvider> */}
                    {/* <GameEventProvider> */}
                    {children}
                    {/* </GameEventProvider> */}
                    {/* </AILevelProvider> */}
                </NewsProvider>
            </QuantumProvider>
        </EffectsProvider>
    </PlayerStatsProvider>
);
