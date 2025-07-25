import React, { useState, useEffect } from 'react';
import galaxiesData from '../../../data/galaxies.json';
import './StarMap.scss';

// SVG-based starmap for low AI, modeled after TravelOverlay
const StarMapLow = ({ currentGalaxyId, onTravel }) => {
    const [selectedGalaxyId, setSelectedGalaxyId] = useState(null);
    const [showMap, setShowMap] = useState(true);
    const [isTraveling, setIsTraveling] = useState(false);
    const [progress, setProgress] = useState(0);

    const current = galaxiesData.galaxies.find((g) => g.galaxyId === currentGalaxyId);
    console.log(current);

    useEffect(() => {
        // console.log('Galaxy selection effect triggered:', { currentGalaxyId });
        // Select random galaxy when component mounts or current galaxy changes
        const availableIds = galaxiesData.galaxies
            .filter((g) => g.galaxyId !== currentGalaxyId)
            .map((g) => g.galaxyId);
        const newGalaxyId = availableIds[Math.floor(Math.random() * availableIds.length)];
        console.log('Selected new galaxy ID:', newGalaxyId);
        setSelectedGalaxyId(newGalaxyId);
    }, [currentGalaxyId]);

    useEffect(() => {
        if (showMap && selectedGalaxyId && !isTraveling) {
            console.log('Travel effect triggered:', { showMap, selectedGalaxyId });
            setIsTraveling(true);
            setProgress(0);

            // Start progress animation immediately
            const startTime = Date.now();
            const duration = 2000; // 2 seconds

            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const newProgress = Math.min(100, (elapsed / duration) * 100);
                setProgress(newProgress);

                if (newProgress >= 100) {
                    clearInterval(progressInterval);
                    console.log('Timer completed, attempting travel');
                    const selectedGalaxy = galaxiesData.galaxies.find(
                        (g) => g.galaxyId === selectedGalaxyId
                    );
                    console.log('Found galaxy:', selectedGalaxy);
                    if (selectedGalaxy) {
                        console.log('Calling onTravel with:', selectedGalaxy.name);
                        onTravel(selectedGalaxy.name);
                        setShowMap(false);
                    }
                    setIsTraveling(false);
                }
            }, 50); // Update every 50ms for smooth animation

            return () => clearInterval(progressInterval);
        }
    }, [showMap, selectedGalaxyId, onTravel]);

    if (!showMap) {
        return null;
    }

    // Find selected galaxy
    const selectedGalaxy = galaxiesData.galaxies.find((g) => g.galaxyId === selectedGalaxyId);

    // Star map scaling
    const coordsList = galaxiesData.galaxies.map((g) => g.coordinates);
    const xs = coordsList.map((c) => c.x),
        ys = coordsList.map((c) => c.y);
    const minX = Math.min(...xs),
        maxX = Math.max(...xs);
    const minY = Math.min(...ys),
        maxY = Math.max(...ys);
    const width = 300,
        height = 300;
    const scaleX = width / (maxX - minX || 1);
    const scaleY = height / (maxY - minY || 1);

    return (
        <div className="star-map-low-container">
            <div className="starmap-departing-text">Departing...</div>
            <div className="starmap-progress-container">
                <div className="starmap-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <svg
                width={width}
                height={height}
                style={{
                    background: '#111',
                    border: '1px solid #555',
                    display: 'block',
                    margin: '0 auto',
                }}
            >
                {galaxiesData.galaxies.map((g) => {
                    const x = (g.coordinates.x - minX) * scaleX;
                    const y = height - (g.coordinates.y - minY) * scaleY;
                    const isCurrent = g.galaxyId === currentGalaxyId;
                    const isSelected = g.galaxyId === selectedGalaxyId;
                    return (
                        <circle
                            key={g.galaxyId}
                            cx={x}
                            cy={y}
                            r={isCurrent || isSelected ? 10 : 5}
                            fill={isCurrent ? 'green' : isSelected ? 'blue' : 'white'}
                            stroke="#222"
                            strokeWidth={isCurrent || isSelected ? 2 : 1}
                            opacity={isCurrent || isSelected ? 1 : 0.7}
                        />
                    );
                })}
            </svg>
            <div className="starmap-legend">
                <span className="starmap-legend-current">● Current {current.name}</span>
                <span className="starmap-legend-next">● Next {selectedGalaxy?.name}</span>
            </div>
        </div>
    );
};

export default StarMapLow;
