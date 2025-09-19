import React, { useMemo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import galaxiesData from '../../data/galaxies.json';
import StarMapMid from './StarMaps/StarMapMid';
import StarMapHigh from './StarMaps/StarMapHigh';
import StarMapLow from './StarMaps/StarMapLow';
import './StarMaps/StarMap.scss';

const StarMapOverlay = () => {
    const { showStarMap, setShowStarMap, galaxyName, travelToGalaxy, currentGalaxyId: contextGalaxyId } = useMarketplace();
    const { improvedAILevel } = useAILevel();
    
    // Fallback to find the ID from galaxyName if currentGalaxyId is not available
    const currentGalaxyId = useMemo(() => {
        if (contextGalaxyId) return contextGalaxyId;
        // If we don't have an ID but have a name, try to find the ID
        if (galaxyName) {
            const galaxy = galaxiesData.galaxies.find(g => g.name === galaxyName);
            return galaxy ? galaxy.galaxyId : null;
        }
        return null;
    }, [contextGalaxyId, galaxyName]);

    const handleSelect = (name) => {
        travelToGalaxy(name);
        setShowStarMap(false);
    };

    if (!showStarMap) {
        return null;
    }

    return (
        <div className="starmap-overlay">
            <div className="starmap-overlay-content">
                <div className="starmap-header">
                    <h3 className="starmap-title">Star Map</h3>
                    <button className="close-star-map" onClick={() => setShowStarMap(false)}>
                        ✕
                    </button>
                </div>
                {improvedAILevel < 50 ? (
                    <StarMapLow currentGalaxyId={currentGalaxyId} onTravel={handleSelect} />
                ) : improvedAILevel < 100 ? (
                    <StarMapMid
                        galaxies={galaxiesData.galaxies}
                        currentGalaxyId={currentGalaxyId}
                        onSelect={handleSelect}
                        improvedAILevel={improvedAILevel}
                        onClose={() => setShowStarMap(false)}
                    />
                ) : improvedAILevel > 100 ? (
                    <StarMapHigh
                        galaxies={galaxiesData.galaxies}
                        currentGalaxyId={currentGalaxyId}
                        onSelect={handleSelect}
                        improvedAILevel={improvedAILevel}
                        onClose={() => setShowStarMap(false)}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default StarMapOverlay;
