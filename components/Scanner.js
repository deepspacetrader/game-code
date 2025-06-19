import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Scanner.scss';
import AsciiWaveAnimator from './Reusable/AsciiWaveAnimator';

const CORNERS = [
    { x: 0, y: 0, label: 'top-left' },
    { x: 1, y: 0, label: 'top-right' },
    { x: 0, y: 1, label: 'bottom-left' },
    { x: 1, y: 1, label: 'bottom-right' },
];

const Scanner = ({ images = [], onScanComplete }) => {
    const [isComplete, setIsComplete] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [visitedCorners, setVisitedCorners] = useState([]);
    const [currentCorner, setCurrentCorner] = useState(null);
    const [isMoving, setIsMoving] = useState(false);
    const [scanPosition, setScanPosition] = useState({ x: 0, y: 0 });

    const scannerRef = useRef(null);
    const animationRef = useRef(null);
    const currentImage = images.length > 0 ? images[0] : null;

    // Get a random corner that hasn't been visited yet
    const getRandomCorner = useCallback((exclude = []) => {
        const available = CORNERS.filter(corner => 
            !exclude.some(c => c.x === corner.x && c.y === corner.y)
        );
        return available[Math.floor(Math.random() * available.length)] || CORNERS[0];
    }, []);

    // Move to the next corner in sequence
    const moveToNextCorner = useCallback(() => {
        if (visitedCorners.length >= 4) {
            setIsComplete(true);
            setIsScanning(false);
            if (onScanComplete) onScanComplete();
            return;
        }

        const next = getRandomCorner(visitedCorners);
        setIsMoving(true);
        
        // Animate to next corner
        const startTime = Date.now();
        const duration = 1000; // 1 second per corner
        
        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (currentCorner && next) {
                const x = currentCorner.x + (next.x - currentCorner.x) * progress;
                const y = currentCorner.y + (next.y - currentCorner.y) * progress;
                setScanPosition({ x, y });
                setScanProgress(visitedCorners.length / 4 + progress / 4);
            }
            
            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setCurrentCorner(next);
                setVisitedCorners(prev => [...prev, next]);
                setIsMoving(false);
                
                // Auto-move to next corner after a short delay
                if (visitedCorners.length < 3) {
                    setTimeout(moveToNextCorner, 500);
                } else {
                    setIsComplete(true);
                    setIsScanning(false);
                    if (onScanComplete) onScanComplete();
                }
            }
        };
        
        animationRef.current = requestAnimationFrame(animate);
    }, [currentCorner, visitedCorners, onScanComplete, getRandomCorner]);
    
    // Start the scanning process
    const startScan = useCallback(() => {
        setIsComplete(false);
        setIsScanning(true);
        const firstCorner = getRandomCorner();
        setCurrentCorner(firstCorner);
        setVisitedCorners([firstCorner]);
        setScanProgress(0);
    }, [getRandomCorner]);

    // Reset the scanner
    const resetScan = useCallback(() => {
        setIsComplete(false);
        setIsScanning(false);
        setScanProgress(0);
        setVisitedCorners([]);
        setCurrentCorner(null);
    }, []);

    // Start moving to next corner when current corner changes
    useEffect(() => {
        if (isScanning && currentCorner && !isMoving && visitedCorners.length < 4) {
            const timer = setTimeout(moveToNextCorner, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentCorner, isScanning, isMoving, visitedCorners, moveToNextCorner]);

    // Clean up animation frame on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Update scan position when current corner changes
    useEffect(() => {
        if (currentCorner) {
            // Add 10% padding from edges
            const padding = 0.1;
            setScanPosition({
                x: currentCorner.x * (1 - padding * 2) + padding,
                y: currentCorner.y * (1 - padding * 2) + padding
            });
        }
    }, [currentCorner]);

    // Mouse event handlers (kept for potential future use)
    const handleMouseDown = () => {};
    const handleMouseMove = () => {};
    const handleMouseUp = () => {};
    const handleMouseLeave = () => {};

    return (
        <div className="scanner-container" ref={scannerRef}>
            <h2>Scanner</h2>
            <div className="scanner-display">
                {currentImage && (
                    <div
                        className={`scanner-preview ${isComplete ? 'complete' : ''} ${!isScanning ? 'not-scanning' : ''}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    >
                        {isScanning && (
                            <div 
                                className="scan-indicator"
                                style={{
                                    position: 'absolute',
                                    left: `${scanPosition.x * 100}%`,
                                    top: `${scanPosition.y * 100}%`,
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: '#0f0',
                                    transform: 'translate(-50%, -50%)',
                                    boxShadow: '0 0 10px #0f0',
                                    zIndex: 10,
                                    transition: 'all 0.5s ease-out'
                                }}
                            />
                        )}

                        <AsciiWaveAnimator
                            imagePath={currentImage}
                            isScanning={isScanning}
                            showFinalResult={isComplete}
                            scanProgress={scanProgress}
                            onScanComplete={() => {}}
                        />

                        <div className="scanner-controls">
                            {!isScanning ? (
                                <button
                                    className="start-scan-button"
                                    onClick={isComplete ? resetScan : startScan}
                                    disabled={isMoving}
                                >
                                    {isComplete ? 'Scan Again' : 'Start Scan'}
                                </button>
                            ) : (
                                <div className="scan-progress">
                                    <div className="progress-bar" style={{ width: `${scanProgress * 100}%` }} />
                                    <span>
                                        Scanning... {Math.round(scanProgress * 100)}%
                                        {currentCorner && ` (${currentCorner.label})`}
                                    </span>
                                </div>
                            )}
                            {isComplete && <div className="scan-complete">Scan Complete!</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Scanner;
