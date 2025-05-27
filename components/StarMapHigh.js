import React, { useState, useRef, useEffect } from 'react';
import './StarMap.scss';

// Tooltip component for galaxy info
function GalaxyTooltip({ galaxy, style }) {
    if (!galaxy) return null;
    return (
        <div className="galaxy-tooltip" style={style}>
            <div className="galaxy-tooltip-title">{galaxy.name}</div>
            <div>Status: <b>{galaxy.status || 'Unknown'}</b></div>
            <div>Danger: <b>{galaxy.danger ? 'Yes' : 'No'}</b></div>
            <div>War: <b>{galaxy.war ? 'Yes' : 'No'}</b></div>
            <div>Traders: <b>{Array.isArray(galaxy.traders) ? galaxy.traders.length : 0}</b></div>
            <div>Distance: <b>{galaxy.distance}</b></div>
        </div>
    );
}

const StarMapHigh = ({ galaxies, onSelect, improvedUILevel, onClose, currentGalaxyId }) => {
    const [hoveredGalaxy, setHoveredGalaxy] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const coords = galaxies.map(g => g.coordinates);
    const xs = coords.map(c => c.x);
    const ys = coords.map(c => c.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const padX = Math.max(200, spanX * 0.2);
    const padY = Math.max(200, spanY * 0.2);
    const viewMinX = minX - padX;
    const viewMinY = minY - padY;
    const viewSpanX = spanX + padX * 2;
    const viewSpanY = spanY + padY * 2;
    const width = improvedUILevel >= 100 ? '90vw' : improvedUILevel >= 75 ? '70vw' : '50vw';
    const height = improvedUILevel >= 100 ? '60vh' : improvedUILevel >= 75 ? '45vh' : '30vh';

        const containerRef = useRef();
    const [scale, setScale] = useState(1);

    // Handle mouse wheel zooming
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const currentGalaxy = currentGalaxyId && galaxies.find(g => g.galaxyId === currentGalaxyId);
        
        // If we have a current galaxy and UI level is low, center on it
        if (currentGalaxy && improvedUILevel < 75) {
            const containerRect = container.getBoundingClientRect();
            const targetX = -currentGalaxy.coordinates.x * 0.8 + containerRect.width / 2;
            const targetY = -currentGalaxy.coordinates.y * 0.8 + containerRect.height / 2;
            setPosition({ x: targetX, y: targetY });
            setScale(0.8);
        }

        const handleWheel = (e) => {
            e.preventDefault();
            
            if (improvedUILevel < 75) return; // Only allow zooming at higher UI levels
            
            const zoomIntensity = 0.0005;
            const wheel = e.deltaY * -zoomIntensity;
            
            setScale(prevScale => {
                const newScale = Math.min(Math.max(0.5, prevScale + wheel), 5);
                return newScale;
            });
        };

        const handleMouseDown = (e) => {
            if (improvedUILevel < 75) return; // Only allow dragging at higher UI levels
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        };

        const handleMouseMove = (e) => {
            if (!isDragging || improvedUILevel < 75) return;
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, position.x, position.y, startPos.x, startPos.y, improvedUILevel, currentGalaxyId, galaxies]);

    return (
        <div
            className="star-map-overlay"
            onClick={onClose}
        >
            <div
                ref={containerRef}
                className="star-map-high-container"
                style={{ width, height, overflow: 'hidden' }}
                onClick={e => e.stopPropagation()}
            >
                <div 
                    style={{ 
                        width: '100%', 
                        height: '100%',
                        transform: improvedUILevel >= 75 
                            ? `translate(${position.x}px, ${position.y}px) scale(${scale})`
                            : 'translate(0, 0) scale(1)',
                        transformOrigin: improvedUILevel >= 75 ? '0 0' : 'center center',
                        transition: improvedUILevel >= 75 ? 'none' : 'transform 0.3s ease-out',
                        cursor: improvedUILevel >= 75 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        touchAction: 'none'
                    }}
                >
                    <svg
                        className="star-map-high"
                        viewBox={`${viewMinX} ${viewMinY} ${viewSpanX} ${viewSpanY}`}
                        width="100%"
                        height="100%"
                        style={{ background: '#070a13' }}
                    >
                            <rect x={viewMinX} y={viewMinY} width={viewSpanX} height={viewSpanY} fill="#070a13" />
                            <g>
                                {galaxies.map(g => (
                                    <circle
                                        key={`${g.galaxyId}-point`}
                                        cx={g.coordinates.x}
                                        cy={g.coordinates.y}
                                        r={improvedUILevel >= 100 ? 16 : improvedUILevel >= 75 ? 12 : 8}
                                        fill={g.galaxyId === currentGalaxyId ? '#0f0' : g.war ? '#e44' : g.danger ? '#f80' : '#0ff'}
                                        stroke={g.galaxyId === currentGalaxyId ? '#fff' : g.status === 'active' ? '#fff' : '#444'}
                                        strokeWidth={g.galaxyId === currentGalaxyId ? 4 : g.status === 'active' ? 3 : 1}
                                        style={{ 
                                            filter: g.galaxyId === currentGalaxyId 
                                                ? 'drop-shadow(0 0 12px #0f0)' 
                                                : g.danger 
                                                    ? 'drop-shadow(0 0 8px #f80)' 
                                                    : g.war 
                                                        ? 'drop-shadow(0 0 8px #e44)' 
                                                        : 'drop-shadow(0 0 8px #0ff)',
                                            transition: 'all 0.3s ease-out'
                                        }}
                                        onClick={() => onSelect && onSelect(g.galaxyId)}
                                    />
                                ))}
                                {galaxies.map(g => (
                                    <text
                                        key={g.galaxyId + '-label'}
                                        x={g.coordinates.x + 18}
                                        y={g.coordinates.y + 18}
                                        fill="#fff"
                                        style={{ 
                                            fontSize: '2rem', 
                                            pointerEvents: 'auto', 
                                            textShadow: '0 0 6px #000, 0 0 2px #000', 
                                            cursor: 'pointer' 
                                        }}
                                        onMouseEnter={(e) => {
                                            setHoveredGalaxy(g);
                                            setTooltipPos({ x: e.clientX, y: e.clientY });
                                        }}
                                        onMouseMove={(e) => {
                                            setTooltipPos({ x: e.clientX, y: e.clientY });
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredGalaxy(null);
                                        }}
                                        onClick={() => onSelect && onSelect(g.galaxyId)}
                                    >
                                        {g.name}
                                    </text>
                                ))}
                            </g>
                    </svg>
                </div>
                {hoveredGalaxy && (
                    <GalaxyTooltip
                        galaxy={hoveredGalaxy}
                        style={{ 
                            left: `${tooltipPos.x + 16}px`, 
                            top: `${tooltipPos.y - 8}px`, 
                            position: 'fixed', 
                            zIndex: 1000,
                            pointerEvents: 'none'
                        }}
                    />
                )}

            </div>
        </div>
    );
};

export default StarMapHigh;
