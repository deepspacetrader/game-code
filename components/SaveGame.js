import React, { useState } from 'react';
import { useUI } from '../context/UIContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { MdSave } from 'react-icons/md';
import { MdOutlineSaveAlt } from 'react-icons/md';
import { MdSaveAlt } from 'react-icons/md';
import { MdSaveAs } from 'react-icons/md';
import { MdOutlineSave } from 'react-icons/md';
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
            timestamp: new Date().toISOString(),
        };

        localStorage.setItem('scifiMarketSave', JSON.stringify(gameState));

        // Show the level for 2 seconds
        setShowLevel(true);
        setTimeout(() => setShowLevel(false), 2000);
    };

    const getSaveIcon = () => {
        if (improvedUILevel < 50) return <MdOutlineSave />;
        if (improvedUILevel < 100) return <MdSave />;
        if (improvedUILevel < 200) return <MdOutlineSaveAlt />;
        if (improvedUILevel < 300) return <MdSaveAlt />;
        return <MdSaveAs />;
    };

    return (
        <div className="save-game-container">
            <div className={`save-level-display ${showLevel ? 'visible' : ''}`}>
                Saved! UI Level: {improvedUILevel}
            </div>
            <button className="save-button" onClick={saveGame} title="Save Game">
                {getSaveIcon()}
            </button>
        </div>
    );
};

export default SaveGame;
