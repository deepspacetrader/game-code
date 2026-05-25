import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Scanner.scss';
import AsciiWaveAnimator from './Reusable/AsciiWaveAnimator';

const CORNERS = [
    { x: 0, y: 0, label: 'top-left' },
    { x: 1, y: 0, label: 'top-right' },
    { x: 0, y: 1, label: 'bottom-left' },
    { x: 1, y: 1, label: 'bottom-right' },
];

const getRandomCorner = (exclude = []) => {
    const available = CORNERS.filter(
        (c) => !exclude.some((ex) => ex.label === c.label)
    );
    return available[Math.floor(Math.random() * available.length)];
};

const Scanner = ({ onScanComplete, images = [] }) => {
    const [stage, setStage] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [corners, setCorners] = useState({ start: null, end: null });
    const scannerRef = useRef(null);
    const startPosRef = useRef({ x: 0, y: 0 });
    const currentImage = images.length > 0 ? images[0] : null;

    const setupStage = useCallback(() => {
        const start = getRandomCorner();
        const end = getRandomCorner([start]);
        setCorners({ start, end });
    }, []);

    useEffect(() => {
        if (isScanning && stage < 4) {
            setupStage();
        }
    }, [isScanning, stage, setupStage]);

    const startScan = useCallback(() => {
        setIsScanning(true);
        setIsComplete(false);
        setStage(0);
    }, []);

    const resetScan = useCallback(() => {
        setIsComplete(false);
        setIsScanning(false);
        setStage(0);
        setCorners({ start: null, end: null });
    }, []);

    const handleMouseDown = (e) => {
        if (isComplete || !isScanning || !corners.start) return;

        const rect = scannerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const zoneSize = 30;
        const startX = corners.start.x * (rect.width - zoneSize) + zoneSize / 2;
        const startY = corners.start.y * (rect.height - zoneSize) + zoneSize / 2;

        if (Math.abs(x - startX) < zoneSize && Math.abs(y - startY) < zoneSize) {
            startPosRef.current = { x: startX, y: startY };
            setMousePosition({ x, y });
            setIsDragging(true);
        }
    };

    const handleMouseMove = useCallback(
        (e) => {
            if (!isScanning || !isDragging) return;

            const rect = scannerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
            setMousePosition({ x, y });

            const zoneSize = 30;
            const endX = corners.end.x * (rect.width - zoneSize) + zoneSize / 2;
            const endY = corners.end.y * (rect.height - zoneSize) + zoneSize / 2;

            if (Math.abs(x - endX) < zoneSize && Math.abs(y - endY) < zoneSize) {
                setIsDragging(false);
                if (stage < 3) {
                    setStage((s) => s + 1);
                } else {
                    setIsComplete(true);
                    setIsScanning(false);
                    if (onScanComplete) onScanComplete();
                }
            }
        },
        [isScanning, isDragging, corners, stage, onScanComplete]
    );

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            // Reset current stage, but not the whole game
            setupStage();
        }
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            setupStage();
        }
    };
    
    const getLineStyle = () => {
        if (!isDragging) return { display: 'none' };

        const dx = mousePosition.x - startPosRef.current.x;
        const dy = mousePosition.y - startPosRef.current.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return {
            position: 'absolute',
            left: `${startPosRef.current.x}px`,
            top: `${startPosRef.current.y}px`,
            width: `${length}px`,
            height: '2px',
            backgroundColor: '#0f0',
            transformOrigin: '0 50%',
            transform: `rotate(${angle}deg)`,
            pointerEvents: 'none',
        };
    };

    return (
        <div className="scanner-container">
            <h2>Scanner</h2>
            <div
                ref={scannerRef}
                className={`scanner-display ${isComplete ? 'complete' : ''} ${!isScanning ? 'not-scanning' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                {isScanning && corners.start && corners.end && (
                    <>
                        <div
                            className="start-zone"
                            style={{
                                left: `${corners.start.x * 100}%`,
                                top: `${corners.start.y * 100}%`,
                                transform: `translate(${corners.start.x === 1 ? '-100%' : '0'}, ${corners.start.y === 1 ? '-100%' : '0'})`,
                            }}
                        />
                        <div
                            className="end-zone"
                            style={{
                                left: `${corners.end.x * 100}%`,
                                top: `${corners.end.y * 100}%`,
                                transform: `translate(${corners.end.x === 1 ? '-100%' : '0'}, ${corners.end.y === 1 ? '-100%' : '0'})`,
                            }}
                        />
                        {isDragging && <div className="scan-line" style={getLineStyle()} />}
                    </>
                )}

                <AsciiWaveAnimator
                    imagePath={currentImage}
                    isScanning={isScanning}
                    showFinalResult={isComplete}
                    scanProgress={(stage + (isDragging ? 0.5 : 0)) / 4}
                />

                <div className="scanner-controls">
                    {!isScanning ? (
                        <button
                            className="start-scan-button"
                            onClick={isComplete ? resetScan : startScan}
                        >
                            {isComplete ? 'Scan Again' : 'Start Scan'}
                        </button>
                    ) : (
                        <div className="scan-progress">
                            <div className="progress-bar" style={{ width: `${(stage / 4) * 100}%` }} />
                            <span>
                                Scanning... {stage}/4
                            </span>
                        </div>
                    )}
                    {isComplete && <div className="scan-complete">Scan Complete!</div>}
                </div>
            </div>
        </div>
    );
};

export default Scanner;