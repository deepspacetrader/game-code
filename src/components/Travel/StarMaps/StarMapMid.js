import React, { useRef, useCallback } from 'react';
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';
import './StarMap.scss';

// Mid-range interactive map: static dots with labels
const StarMapMid = ({ galaxies, onSelect, improvedAILevel, onClose, currentGalaxyId }) => {
    const containerRef = useRef();
    const width = improvedAILevel >= 75 ? 600 : 400,
        height = improvedAILevel >= 75 ? 600 : 400;
    const xs = galaxies.map((g) => g.coordinates.x);
    const ys = galaxies.map((g) => g.coordinates.y);
    const minX = Math.min(...xs),
        maxX = Math.max(...xs);
    const minY = Math.min(...ys),
        maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    // Add padding for scrollable background
    const padX = Math.max(100, spanX * 0.15);
    const padY = Math.max(100, spanY * 0.15);
    const viewMinX = minX - padX;
    const viewMinY = minY - padY;
    const viewSpanX = spanX + padX * 2;
    const viewSpanY = spanY + padY * 2;

    // Note: Click outside handling is now done by the parent overlay

    const contentRef = useRef();
    const onUpdate = useCallback(({ x, y, scale }) => {
        const { current: content } = contentRef;
        if (content) {
            const value = make3dTransformValue({ x, y, scale });
            content.style.setProperty('transform', value);
        }
    }, []);

    return (
        <div ref={containerRef} className="star-map-mid-container">
            <QuickPinchZoom onUpdate={onUpdate}>
                <div
                    ref={contentRef}
                    className="star-map-mid"
                    style={{ width, height, position: 'relative', touchAction: 'none' }}
                >
                    <svg
                        className="star-map-mid-svg"
                        viewBox={`${viewMinX} ${viewMinY} ${viewSpanX} ${viewSpanY}`}
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}
                    >
                        <rect
                            x={viewMinX}
                            y={viewMinY}
                            width={viewSpanX}
                            height={viewSpanY}
                            fill="#070a13"
                        />
                        {galaxies.map((g) => {
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
                        })}
                    </svg>
                    {/* Overlay dots for pointer events and accessibility */}
                    {galaxies.map((g) => {
                        const x = ((g.coordinates.x - viewMinX) / viewSpanX) * width;
                        const y = ((g.coordinates.y - viewMinY) / viewSpanY) * height;
                        return (
                            <div
                                key={g.galaxyId}
                                className="star-dot mid"
                                style={{
                                    left: `${x}px`,
                                    top: `${y}px`,
                                    background: g.war
                                        ? 'red'
                                        : g.danger
                                        ? 'orange'
                                        : g.galaxyId === currentGalaxyId
                                        ? 'green'
                                        : 'var(--accent)',
                                    width: improvedAILevel >= 75 ? 14 : 8,
                                    height: improvedAILevel >= 75 ? 14 : 8,
                                    zIndex: 2,
                                }}
                                onClick={() => onSelect && onSelect(g.galaxyId)}
                            />
                        );
                    })}
                </div>
            </QuickPinchZoom>
        </div>
    );
};

export default StarMapMid;
