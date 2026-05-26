import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';

const GameOverScreen = () => {
    const { recordTimes, credits } = useMarketplace();
    const entries = Object.entries(recordTimes || {});
    if (!entries.length) return null;
    const sorted = entries.sort(([, a], [, b]) => a - b);
    return (
        <div className="game-over-screen">
            <p className="game-over-win-message">
                You've successfully activated the Quantum Auto-Trader! Sit back and watch the
                credits roll as your VO (VOLUME OVERLOAD) strategy executes flawlessly, each and
                every time.
            </p>
            <p>
                Jax Orion appears: "Impressive work, trader. With your own outstanding abilities
                you've outpaced the entire market and reached this plateau we call home. Welcome to
                the Hall of Legends. We've all been watching you trade your way up here from the
                very beginning. Now that you've reached the pinnacle of the market the only
                challenge left is to do it faster again. Try to keep up. Oh and if you're still
                hanging around for whatever reason and you're still interested in trying to figure
                out who has the MOST CREDITS, we stopped trying that long time ago. Heres a hint for
                you: even if we were to combine all the quantum processing power together we still
                wouldn't even be able to show the entire number on a display without crashing."
            </p>
            <p>
                PLAYER: Why do traders even have stock?Wait... oh... what! NO! WAIT none of this
                makes any sense!
            </p>
            <p>How much longer will you be.... ?</p>
            <p>PLAYER: What... I.... wha..t what is even happening? .... </p>
            <p>Credits are only worth something for someone. Not to us.</p>
            <p>- Hall of Legends</p>
        </div>
    );
};
export default GameOverScreen;
