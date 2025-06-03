import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import { encryptData } from '../../utils/encryption';
import { MdSave } from 'react-icons/md';
import './SaveGame.scss';

const SaveGame = () => {
    const { improvedUILevel } = useUI();
    const [showLevel, setShowLevel] = useState(false);
    const {
        health,
        fuel,
        credits,
        deliverySpeed,
        shieldActive,
        stealthActive,
        inventory,
        galaxyName,
        quantumProcessors,
        isCheater,
    } = useMarketplace();

    const saveGame = () => {
        const gameState = {
            uiLevel: improvedUILevel,
            health,
            fuel,
            credits,
            deliverySpeed,
            shieldActive,
            stealthActive,
            inventory: inventory.map(({ name, quantity, price }) => ({
                name,
                quantity,
                price,
            })),
            galaxyName,
            quantumProcessors,
            isCheater,
            timestamp: new Date().toISOString(),
        };

        // Encrypt the game state before saving
        const encryptedData = encryptData(gameState);
        if (encryptedData) {
            localStorage.setItem('scifiMarketSave', encryptedData);
        } else {
            console.error('Failed to encrypt game data');
            return;
        }

        // Show the level for 2 seconds
        setShowLevel(true);
        setTimeout(() => setShowLevel(false), 2000);
    };

    return (
        <div className="save-game-container">
            <div className={`save-level-display ${showLevel ? 'visible' : ''}`}>
                Saved! UI Level: {improvedUILevel}
            </div>
            <button className="save-button" onClick={saveGame} title="Save Game">
                <MdSave />
            </button>
        </div>
    );
};

export default SaveGame;
