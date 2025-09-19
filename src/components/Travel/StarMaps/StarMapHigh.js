import React, { useState, useRef, useEffect } from 'react';
import './StarMap.scss';

// Tooltip component for galaxy info
function GalaxyTooltip({ galaxy, style }) {
    if (!galaxy) return null;
    return (
        <div className="galaxy-tooltip" style={style}>
            <div className="galaxy-tooltip-title">{galaxy.name}</div>
            <div>
                Status: <b>{galaxy.status || 'Unknown'}</b>
            </div>
            <div>
                Danger: <b>{galaxy.danger ? 'Yes' : 'No'}</b>
            </div>
            <div>
                War: <b>{galaxy.war ? 'Yes' : 'No'}</b>
            </div>
            <div>
                Traders: <b>{Array.isArray(galaxy.traders) ? galaxy.traders.length : 0}</b>
            </div>
            <div>
                Distance: <b>{galaxy.distance}</b>
            </div>
        </div>
    );
}

const StarMapHigh = ({ galaxies, onSelect, improvedAILevel, onClose, currentGalaxyId }) => {
    const [hoveredGalaxy, setHoveredGalaxy] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef();

    // Calculate galaxy bounds
    const coords = galaxies.map((g) => g.coordinates);
    const xs = coords.map((c) => c.x);
    const ys = coords.map((c) => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Calculate center point of all galaxies
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate view parameters
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const padX = Math.max(200, spanX * 0.2);
    const padY = Math.max(200, spanY * 0.2);
    const viewMinX = minX - padX;
    const viewMinY = minY - padY;
    const viewSpanX = spanX + padX * 2;
    const viewSpanY = spanY + padY * 2;
    // Responsive dimensions
    const width = improvedAILevel >= 100 ? '90vw' : improvedAILevel >= 75 ? '70vw' : '50vw';
    const height = improvedAILevel >= 100 ? '60vh' : improvedAILevel >= 75 ? '45vh' : '30vh';

    // Calculate initial scale and position
    const [scale, setScale] = useState(1);

    // Set initial position and scale when component mounts
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate the scale needed to fit all galaxies with padding
        const contentWidth = maxX - minX + 2 * padX;
        const contentHeight = maxY - minY + 2 * padY;

        // Calculate scale to fit both dimensions with a minimum zoom level
        const scaleFactor = 3.0; // Significantly increased zoom factor
        const scaleX = (containerWidth * scaleFactor) / contentWidth;
        const scaleY = (containerHeight * scaleFactor) / contentHeight;
        const initialScale = Math.min(scaleX, scaleY, 4.0); // Increased maximum zoom cap

        setScale(initialScale);

        // Calculate center of the container
        const centerScreenX = containerWidth / 2;
        const centerScreenY = containerHeight / 2;

        // Calculate position to center the content
        setPosition({
            x: centerScreenX - centerX * initialScale,
            y: centerScreenY - centerY * initialScale,
        });
    }, [minX, maxX, minY, maxY, padX, padY, centerX, centerY]);

    // Handle mouse wheel zooming
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const currentGalaxy =
            currentGalaxyId && galaxies.find((g) => g.galaxyId === currentGalaxyId);

        // If we have a current galaxy and AI level is low, center on it
        if (currentGalaxy && improvedAILevel < 75) {
            const containerRect = container.getBoundingClientRect();
            const zoomLevel = 2.5; // Increased zoom level when centering on current galaxy
            const targetX = -currentGalaxy.coordinates.x * zoomLevel + containerRect.width / 2;
            const targetY = -currentGalaxy.coordinates.y * zoomLevel + containerRect.height / 2;
            setPosition({ x: targetX, y: targetY });
            setScale(zoomLevel);
        }

        const handleWheel = (e) => {
            e.preventDefault();

            if (improvedAILevel < 75) return; // Only allow zooming at higher AI levels

            const zoomIntensity = 0.0005;
            const wheel = e.deltaY * -zoomIntensity;

            setScale((prevScale) => {
                const newScale = Math.min(Math.max(0.5, prevScale + wheel), 5);
                return newScale;
            });
        };

        const handleMouseDown = (e) => {
            if (improvedAILevel < 75) return; // Only allow dragging at higher AI levels
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        };

        const handleMouseMove = (e) => {
            if (!isDragging || improvedAILevel < 75) return;
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y,
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
    }, [
        isDragging,
        position.x,
        position.y,
        startPos.x,
        startPos.y,
        improvedAILevel,
        currentGalaxyId,
        galaxies,
    ]);

    return (
        <div
            ref={containerRef}
            className="star-map-high-container"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                backgroundColor: '#070a13',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: 'center center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    willChange: 'transform',
                    width: '100%',
                    height: '100%',
                }}
            >
                <svg
                    className="star-map-high"
                    viewBox={`${viewMinX} ${viewMinY} ${viewSpanX} ${viewSpanY}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '100vmax',
                        height: '100vmax',
                        minWidth: '1000px',
                        minHeight: '1000px',
                    }}
                >
                    <rect
                        x={viewMinX}
                        y={viewMinY}
                        width={viewSpanX}
                        height={viewSpanY}
                        fill="#070a13"
                    />
                    <g>
                        {galaxies.map((g) => (
                            <circle
                                key={`${g.galaxyId}-point`}
                                cx={g.coordinates.x}
                                cy={g.coordinates.y}
                                r={improvedAILevel >= 100 ? 16 : improvedAILevel >= 75 ? 12 : 8}
                                fill={
                                    g.galaxyId === currentGalaxyId
                                        ? '#0f0'
                                        : g.war
                                        ? '#e44'
                                        : g.danger
                                        ? '#f80'
                                        : '#0ff'
                                }
                                stroke={
                                    g.galaxyId === currentGalaxyId
                                        ? '#fff'
                                        : g.status === 'active'
                                        ? '#fff'
                                        : '#444'
                                }
                                strokeWidth={
                                    g.galaxyId === currentGalaxyId
                                        ? 4
                                        : g.status === 'active'
                                        ? 3
                                        : 1
                                }
                                style={{
                                    filter:
                                        g.galaxyId === currentGalaxyId
                                            ? 'drop-shadow(0 0 12px #0f0)'
                                            : g.danger
                                            ? 'drop-shadow(0 0 8px #f80)'
                                            : g.war
                                            ? 'drop-shadow(0 0 8px #e44)'
                                            : 'drop-shadow(0 0 8px #0ff)',
                                    transition: 'all 0.3s ease-out',
                                }}
                                onClick={() => onSelect && onSelect(g.galaxyId)}
                            />
                        ))}
                        {galaxies.map((g) => (
                            <text
                                key={g.galaxyId + '-label'}
                                x={g.coordinates.x}
                                y={g.coordinates.y + 60}
                                textAnchor="middle"
                                fill="#fff"
                                style={{
                                    fontSize: '3.5rem',
                                    pointerEvents: 'auto',
                                    textShadow: '0 0 6px #000, 0 0 2px #000',
                                    cursor: 'pointer',
                                    fontFamily: '"Orbitron", "Segoe UI", sans-serif',
                                    fontWeight: 500,
                                    letterSpacing: '0.05em',
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
                        pointerEvents: 'none',
                    }}
                />
            )}
        </div>
    );
};

export default StarMapHigh;
