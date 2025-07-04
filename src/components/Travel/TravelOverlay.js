import React, { useMemo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import galaxiesData from '../../data/galaxies.json';

const TravelOverlay = () => {
    const { isJumping, jumpTimeLeft, jumpDuration, jumpFromCoord, jumpToCoord } = useMarketplace();
    const { improvedUILevel } = useUI();
    // compute animation values
    const elapsed = jumpDuration - jumpTimeLeft;
    const showDeparture = elapsed < 2000;
    const progressPercent = useMemo(
        () => Math.min(100, (elapsed / jumpDuration) * 100),
        [elapsed, jumpDuration]
    );
    const distance = useMemo(() => {
        const fromX = typeof jumpFromCoord?.x === 'number' ? jumpFromCoord.x : 0;
        const fromY = typeof jumpFromCoord?.y === 'number' ? jumpFromCoord.y : 0;
        const fromZ = typeof jumpFromCoord?.z === 'number' ? jumpFromCoord.z : 0;
        const toX = typeof jumpToCoord?.x === 'number' ? jumpToCoord.x : 0;
        const toY = typeof jumpToCoord?.y === 'number' ? jumpToCoord.y : 0;
        const toZ = typeof jumpToCoord?.z === 'number' ? jumpToCoord.z : 0;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dz = toZ - fromZ;
        return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
    }, [jumpFromCoord, jumpToCoord]);
    // Defensive: only render if isJumping and coords are objects
    if (!isJumping || typeof jumpFromCoord !== 'object' || typeof jumpToCoord !== 'object') {
        return null;
    }
    // star map scaling
    const coordsList = galaxiesData.galaxies.map((g) => g.coordinates);
    const xs = coordsList.map((c) => c.x),
        ys = coordsList.map((c) => c.y);
    const minX = Math.min(...xs),
        maxX = Math.max(...xs);
    const minY = Math.min(...ys),
        maxY = Math.max(...ys);
    const width = 400,
        height = 400;
    const scaleX = width / (maxX - minX + 100 || 1);
    const scaleY = height / (maxY - minY + 100 || 1);

    return (
        <div
            className="travel-overlay"
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.9)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
                boxSizing: 'border-box',
            }}
        >
            {showDeparture ? (
                <div style={{ fontSize: 24, marginBottom: 20 }}>Departing...</div>
            ) : (
                <div
                    style={{
                        width: '80%',
                        background: '#444',
                        borderRadius: 4,
                        overflow: 'hidden',
                        marginBottom: 20,
                    }}
                >
                    <div style={{ width: `${progressPercent}%`, height: 10, background: '#0f0' }} />
                </div>
            )}
            <div style={{ fontSize: 14, marginBottom: 10 }}>Distance: {distance}</div>
            <svg
                width={width}
                height={height}
                style={{ background: '#111', border: '1px solid #555' }}
            >
                {galaxiesData.galaxies.map((g) => {
                    const x = Math.max(
                        25,
                        Math.min(width - 25, (g.coordinates.x - minX + 25) * scaleX)
                    );
                    const y = (g.coordinates.y - minY) * scaleY;
                    const isFrom =
                        g.coordinates.x === jumpFromCoord.x && g.coordinates.y === jumpFromCoord.y;
                    const isTo =
                        g.coordinates.x === jumpToCoord.x && g.coordinates.y === jumpToCoord.y;
                    return (
                        <circle
                            key={`galaxy-${g.galaxyId}`}
                            cx={x}
                            cy={y}
                            r={isFrom || isTo ? 5 : 2}
                            fill={isTo ? 'blue' : isFrom ? 'green' : 'white'}
                        >
                            {improvedUILevel > 50 && (
                                <text
                                    x={x}
                                    y={y + 15}
                                    fill="#fff"
                                    fontSize="10"
                                    textAnchor="middle"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {g.name}
                                </text>
                            )}
                        </circle>
                    );
                })}
            </svg>
        </div>
    );
};

export default TravelOverlay;
