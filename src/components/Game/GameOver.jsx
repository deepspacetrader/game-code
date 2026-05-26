import React from 'react';
import './GameOver.scss';

const GameOver = ({ onRestart, outcome = 'lose', enemy = null }) => {
    // Marketplace context is available here for future use if needed

    const getEnemyDefeatMessage = () => {
        if (!enemy) return 'You were defeated!';

        const enemyName = enemy.name || 'enemy';
        const rank = enemy.rank ? ` (${enemy.rank}-Rank)` : '';

        const messages = {
            Military: `You were overwhelmed by the military forces. Their advanced training and equipment were too much to handle.`,
            'Market Police': `The Market Police have caught you. Your trading days are over.`,
            Thug: `You were overpowered by the thug's brute strength.`,
            Thief: `The thief was too quick and evasive for you to handle.`,
            Scavenger: `You underestimated the scavenger and paid the price.`,
            default: `You were defeated by ${enemyName}${rank}.`,
        };

        return messages[enemyName.split(' ')[0]] || messages['default'];
    };

    if (outcome === 'win') {
        return (
            <div className="game-over-overlay">
                <div className="game-over-content win-screen">
                    <h1>Victory!</h1>
                    <div className="win-message">
                        <p>
                            You've successfully activated the Quantum Auto-Trader! Sit back and
                            watch the credits roll as your VO (VOLUME OVERLOAD) strategy executes
                            flawlessly, each and every time.
                        </p>
                        <p>
                            Jax Orion appears: "Impressive work, trader. With your own outstanding
                            abilities you've outpaced the entire market and reached this plateau we
                            call home. Welcome to the Hall of Legends. We've all been watching you
                            trade your way up here from the very beginning. Now that you've reached
                            the pinnacle of the market the only challenge left is to do it faster
                            again. Try to keep up. Oh and if you're still hanging around for
                            whatever reason and you're still interested in trying to figure out who
                            has the MOST CREDITS, we stopped trying that long time ago. Heres a hint
                            for you: even if we were to combine all the quantum processing power
                            together we still wouldn't even be able to show the entire number on a
                            display without crashing."
                        </p>
                        <p>
                            PLAYER: Why do traders even have stock? Wait... oh... what! NO! WAIT
                            none of this makes any sense!
                        </p>
                        <p>How much longer will you be.... ?</p>
                        <p>PLAYER: What... I.... wha..t what is even happening? .... </p>
                        <p>Credits are only worth something for someone. Not to us.</p>
                        <p>- Hall of Legends</p>
                    </div>
                    {onRestart && (
                        <button onClick={onRestart} className="restart-button">
                            Play Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="game-over-overlay">
            <div className="game-over-content">
                <h1>Game Over</h1>
                <p>{getEnemyDefeatMessage()}</p>
                {onRestart && (
                    <button onClick={onRestart} className="restart-button">
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

export default GameOver;
