import React from 'react';
import './GameOver.scss';

const GameOver = ({ onRestart }) => {
    return (
        <div className="game-over-overlay">
            <div className="game-over-content">
                <h1>Game Over</h1>
                <p>Player's health has reached 0</p>
                <button onClick={onRestart} className="restart-button">
                    Restart Game
                </button>
            </div>
        </div>
    );
};

export default GameOver;
