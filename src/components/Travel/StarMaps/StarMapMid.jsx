import React, { useRef, useCallback } from 'react';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import './StarMap.scss';

// Mid-range interactive map: static dots with labels
const StarMapMid = ({ galaxies, onSelect, improvedAILevel, onClose, currentGalaxyId }) => {
    const containerRef = useRef();
    const width = 600,
        height = 600;
    const xs = galaxies.map((g) => g.coordinates.x);
    const ys = galaxies.map((g) => g.coordinates.y);
    const minX = Math.min(...xs),
        maxX = Math.max(...xs);
    const minY = Math.min(...ys),
        maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    // Calculate padding and view dimensions
    const padX = Math.max(100, spanX * 0.042);
    const padY = Math.max(100, spanY * 0.042);
    const viewMinX = minX - padX;
    const viewMinY = minY - padY;
    const viewSpanX = spanX + padX * 2;
    const viewSpanY = spanY + padY * 2;

    // Calculate aspect ratio
    const svgAspectRatio = width / height;
    const contentAspectRatio = viewSpanX / viewSpanY;

    // Adjust viewBox to maintain aspect ratio and prevent black bars
    let adjustedViewMinX = viewMinX;
    let adjustedViewSpanX = viewSpanX;
    let adjustedViewMinY = viewMinY;
    let adjustedViewSpanY = viewSpanY;

    if (svgAspectRatio > contentAspectRatio) {
        // SVG is wider than content, adjust width
        const newWidth = viewSpanY * svgAspectRatio;
        const diff = (newWidth - viewSpanX) / 2;
        adjustedViewMinX = viewMinX - diff;
        adjustedViewSpanX = newWidth;
    } else {
        // SVG is taller than content, adjust height
        const newHeight = viewSpanX / svgAspectRatio;
        const diff = (newHeight - viewSpanY) / 2;
        adjustedViewMinY = viewMinY - diff;
        adjustedViewSpanY = newHeight;
    }
    const contentRef = useRef();

    return (
        <div ref={containerRef} className="star-map-mid-container">
            <div
                ref={contentRef}
                className="star-map-mid"
                style={{ width, height, position: 'relative', touchAction: 'none' }}
            >
                <svg
                    className="star-map-mid-svg"
                    viewBox={`${adjustedViewMinX} ${adjustedViewMinY} ${adjustedViewSpanX} ${adjustedViewSpanY}`}
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        zIndex: 1,
                        backgroundColor: '#070a13', // Fallback background
                    }}
                >
                    <rect
                        x={adjustedViewMinX}
                        y={adjustedViewMinY}
                        width={adjustedViewSpanX}
                        height={adjustedViewSpanY}
                        fill="#070a13"
                    />
                    {/* {galaxies.map((g) => {
                            // Color logic
                            let fill = '#fff';
                            if (g.galaxyId === currentGalaxyId) fill = 'green';
                            else if (g.war) fill = 'red';
                            else if (g.danger) fill = 'orange';
                            return (
                                <circle
                                    key={g.galaxyId}
                                    cx={g.coordinates.x}
                                    cy={g.coordinates.y}
                                    r={improvedAILevel >= 75 ? 7 : 4}
                                    fill={fill}
                                    stroke="#333"
                                    strokeWidth={g.galaxyId === currentGalaxyId ? 2 : 1}
                                    onClick={() => onSelect && onSelect(g.galaxyId)}
                                />
                            );
                        })} */}
                </svg>
                {/* Overlay dots for pointer events and accessibility */}
                {galaxies.map((g) => {
                    const isCurrent = g.galaxyId === currentGalaxyId;
                    const x = ((g.coordinates.x - adjustedViewMinX) / adjustedViewSpanX) * 100;
                    const y = ((g.coordinates.y - adjustedViewMinY) / adjustedViewSpanY) * 100;

                    // Determine dot classes based on status
                    const dotClasses = ['star-dot', 'mid'];
                    if (isCurrent) {
                        dotClasses.push('current-location');
                    } else {
                        dotClasses.push('selectable');
                    }
                    if (g.war) {
                        dotClasses.push('war');
                    } else if (g.danger) {
                        dotClasses.push('danger');
                    }

                    // Add hover effect only for non-current galaxies
                    const hoverEffect = !isCurrent
                        ? {
                              transform: 'translate(-50%, -50%) scale(1.5)',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                          }
                        : {};

                    return (
                        <div
                            key={g.galaxyId}
                            className={dotClasses.join(' ')}
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)',
                                position: 'absolute',
                                // background: isCurrent ? '#00ff00' : 'var(--accent)',
                                zIndex: 1,
                                pointerEvents: isCurrent ? 'none' : 'auto',
                                cursor: isCurrent ? 'default' : 'pointer',
                                opacity: isCurrent ? 1 : 0.9,
                                ...hoverEffect,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isCurrent && onSelect) {
                                    onSelect(g.galaxyId);
                                }
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default StarMapMid;
