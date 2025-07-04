import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Scanner.scss';

const CORNERS = [
    { x: 0, y: 0, label: 'top-left' },
    { x: 1, y: 0, label: 'top-right' },
    { x: 0, y: 1, label: 'bottom-left' },
    { x: 1, y: 1, label: 'bottom-right' },
];

const ScannerLite = ({ onComplete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [showCompleteMessage, setShowCompleteMessage] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [corners, setCorners] = useState({
        start: { x: 0, y: 0, label: 'top-left' },
        end: { x: 1, y: 1, label: 'bottom-right' },
    });
    const scannerRef = useRef(null);
    const endZoneRef = useRef(null);
    const startPosRef = useRef({ x: 0, y: 0 });

    const startScan = useCallback(() => {
        setIsScanning(true);
        setIsComplete(false);
        const randomIndex = Math.floor(Math.random() * CORNERS.length);
        const startCorner = CORNERS[randomIndex];
        const endCorner =
            CORNERS.find((corner) => corner.x !== startCorner.x && corner.y !== startCorner.y) ||
            CORNERS[(randomIndex + 2) % 4];

        setCorners({
            start: startCorner,
            end: endCorner,
        });
    }, []);

    const resetScan = useCallback(() => {
        setIsComplete(false);
        setIsScanning(false);
    }, []);

    // Initialize random start and opposite end corners
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * CORNERS.length);
        const startCorner = CORNERS[randomIndex];
        const endCorner =
            CORNERS.find((corner) => corner.x !== startCorner.x && corner.y !== startCorner.y) ||
            CORNERS[(randomIndex + 2) % 4]; // Fallback if no opposite found

        setCorners({
            start: startCorner,
            end: endCorner,
        });
    }, []);

    const isMouseOverStartZone = (x, y) => {
        if (!scannerRef.current) return false;
        const rect = scannerRef.current.getBoundingClientRect();
        const zoneSize = 30;
        const padding = 10;

        const startX = corners.start.x === 0 ? padding : rect.width - padding;
        const startY = corners.start.y === 0 ? padding : rect.height - padding;

        const inX = Math.abs(x - startX) < zoneSize / 2;
        const inY = Math.abs(y - startY) < zoneSize / 2;

        return inX && inY;
    };

    const handleMouseDown = (e) => {
        if (isComplete || !isScanning) return;

        const rect = scannerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const padding = 10;

        if (isMouseOverStartZone(x, y)) {
            startPosRef.current = {
                x: corners.start.x === 0 ? padding : rect.width - padding,
                y: corners.start.y === 0 ? padding : rect.height - padding,
            };
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

            // Check if we've reached the end zone (right side of the scanner)
            if (x > rect.width * 0.9) {
                setIsComplete(true);
                setIsDragging(false);
                setIsScanning(false);
                if (onComplete) onComplete();
            }
        },
        [isDragging, isScanning, onComplete]
    );

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
        }
    };

    // Calculate line angle and length
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

    // Calculate if mouse is over end zone
    const isMouseOverEndZone = (x, y) => {
        if (!endZoneRef.current) return false;
        const zone = endZoneRef.current.getBoundingClientRect();
        return x >= zone.left && x <= zone.right && y >= zone.top && y <= zone.bottom;
    };

    // Handle scan completion
    useEffect(() => {
        if (isComplete && onComplete) {
            onComplete();
            setShowCompleteMessage(true);
            const timer = setTimeout(() => {
                setShowCompleteMessage(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isComplete, onComplete]);

    return (
        <div className="scanner-lite-container">
            <div
                ref={scannerRef}
                className={`scanner-lite ${isComplete ? 'complete' : ''} ${
                    !isScanning ? 'not-scanning' : ''
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                {!isScanning ? (
                    <div className="scanner-controls">
                        {isComplete && <div className="scan-complete">Scan Complete!</div>}
                        <button
                            className="start-scan-button"
                            onClick={isComplete ? resetScan : startScan}
                        >
                            {isComplete ? 'Scan Again' : 'Start Scan'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div
                            className="start-zone"
                            style={{
                                left: corners.start.x === 0 ? '10px' : 'auto',
                                right: corners.start.x === 1 ? '10px' : 'auto',
                                top: corners.start.y === 0 ? '10px' : 'auto',
                                bottom: corners.start.y === 1 ? '10px' : 'auto',
                                opacity: isComplete ? 0 : 1,
                                transition: 'opacity 0.3s ease',
                                cursor: 'grab',
                            }}
                        />
                        <div
                            ref={endZoneRef}
                            className="end-zone"
                            style={{
                                left: corners.end.x === 0 ? '10px' : 'auto',
                                right: corners.end.x === 1 ? '10px' : 'auto',
                                top: corners.end.y === 0 ? '10px' : 'auto',
                                bottom: corners.end.y === 1 ? '10px' : 'auto',
                                opacity: isComplete ? 0 : 1,
                                transition: 'opacity 0.3s ease',
                            }}
                        />
                        {isDragging && <div className="scan-line" style={getLineStyle()} />}
                    </>
                )}
            </div>
        </div>
    );
};

export default ScannerLite;
