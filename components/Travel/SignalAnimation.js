import React, { useEffect, useState, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import './SignalAnimation.scss';

import signal1 from '../../images/signal1.webp';
import signal2 from '../../images/signal2.webp';
import signal3 from '../../images/signal3.webp';

const SIGNAL_IMAGES = [signal1, signal2, signal3];
const SIGNAL_IMAGE_SWITCH_MS = 420;
const ROTATION_CHANGE_INTERVAL = 10000; // 10 seconds between rotation direction changes

const SignalAnimation = ({ duration, onClose }) => {
    const { travelTimeLeft } = useMarketplace();
    const [currentImage, setCurrentImage] = useState(
        SIGNAL_IMAGES[Math.floor(Math.random() * SIGNAL_IMAGES.length)]
    );
    const [rotationDirection, setRotationDirection] = useState('clockwise');
    const [lastImageSwitch, setLastImageSwitch] = useState(performance.now());
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const animationFrameId = useRef(null);
    const rotationTimer = useRef(null);
    const isHovered = useRef(false);
    const mousePos = useRef({ x: 0, y: 0 });
    const offX = useRef(0);
    const offY = useRef(0);

    // Lens properties
    const lensProperties = useRef({
        size: 169, // Larger lens area
        mag: -0.3337, // Moderate magnification
        k: 0, //-0.01337, //-0.01337, // Increased distortion
    });

    // Debug info
    const debugInfo = useRef({
        lastMousePos: { x: 0, y: 0 },
        lastUpdate: 0,
        frameCount: 0,
    });

    // Set random rotation direction
    useEffect(() => {
        const setRandomDirection = () => {
            const directions = ['clockwise', 'counter-clockwise'];
            const randomIndex = Math.floor(Math.random() * directions.length);
            setRotationDirection(directions[randomIndex]);
        };

        // Set initial random direction
        setRandomDirection();

        // Update direction at intervals
        rotationTimer.current = setInterval(() => {
            setRandomDirection();
        }, ROTATION_CHANGE_INTERVAL);

        return () => {
            if (rotationTimer.current) {
                clearInterval(rotationTimer.current);
            }
        };
    }, []);

    // Initialize canvas and image
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const img = new Image();
        img.src = currentImage;
        img.onload = () => {
            // Set canvas size to match container
            const container = canvas.parentElement;
            const size = Math.min(container.offsetWidth, container.offsetHeight);
            canvas.width = size;
            canvas.height = size;

            // Center the image
            offX.current = (canvas.width - img.width) / 2;
            offY.current = (canvas.height - img.height) / 2;

            // Draw initial image
            ctx.drawImage(img, offX.current, offY.current);
        };

        imageRef.current = img;

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [currentImage]);

    // Main effect for handling canvas and image updates
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.log('Canvas not ready');
            return;
        }

        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        // Always ensure we have the latest image drawn
        if (img && img.complete) {
            const redraw = () => {
                // Only redraw if we're not currently showing the fisheye effect
                if (!isHovered.current) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, offX.current, offY.current);
                }
            };

            // Use requestAnimationFrame for smoother updates
            const frameId = requestAnimationFrame(redraw);
            return () => cancelAnimationFrame(frameId);
        }
    }, [lastImageSwitch, isHovered.current]);

    // Animation loop for fisheye effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.log('Canvas not ready for animation');
            return;
        }

        const ctx = canvas.getContext('2d');
        const img = imageRef.current;
        const isCurrentlyHovered = isHovered.current;

        // If no image is ready, don't start the animation
        if (!img || !img.complete) {
            return;
        }

        // If not hovering, don't start the animation but keep the current frame
        if (!isCurrentlyHovered) {
            return;
        }

        // console.log('Starting fisheye animation');
        let frameId;
        let lastTime = 0;

        const animate = (timestamp) => {
            try {
                // Throttle updates to ~60fps
                if (timestamp - lastTime < 25) {
                    // ~60fps
                    frameId = requestAnimationFrame(animate);
                    return;
                }
                lastTime = timestamp;

                // Only apply fisheye if we have a valid mouse position
                if (mousePos.current.x > 0 && mousePos.current.y > 0) {
                    // Get the current image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    // Draw the original image first (in case it changed)
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, offX.current, offY.current);

                    // Apply the fisheye effect
                    showLens(ctx, img, mousePos.current.x, mousePos.current.y);
                }

                frameId = requestAnimationFrame(animate);
            } catch (error) {
                console.error('Error in fisheye animation:', error);
            }
        };

        // Start the animation
        frameId = requestAnimationFrame(animate);
        animationFrameId.current = frameId;
        // console.log('Fisheye animation started');

        // Cleanup function
        return () => {
            if (frameId) {
                cancelAnimationFrame(frameId);
                // console.log('Fisheye animation stopped');

                // Redraw the original image when effect is cleaned up
                if (img && img.complete) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, offX.current, offY.current);
                }
            }
        };
    }, [isHovered.current, lastImageSwitch]); // Re-run when hover state or image changes

    // Handle image switching
    useEffect(() => {
        const switchImage = () => {
            const now = performance.now();
            if (now - lastImageSwitch > SIGNAL_IMAGE_SWITCH_MS) {
                const newImage = SIGNAL_IMAGES[Math.floor(Math.random() * SIGNAL_IMAGES.length)];
                const img = new Image();
                img.onload = () => {
                    // Only update the image reference after it's loaded
                    imageRef.current = img;
                    setCurrentImage(newImage);
                    setLastImageSwitch(now);
                };
                img.src = newImage;
            }
        };

        const interval = setInterval(switchImage, SIGNAL_IMAGE_SWITCH_MS);
        return () => clearInterval(interval);
    }, [lastImageSwitch]);

    const showLens = (ctx, img, x, y) => {
        if (!img || !img.complete) return;

        const { size, mag, k } = lensProperties.current;
        const lsize = size;
        const lsize2 = lsize * lsize;

        // Debug logging - only log every 500ms
        const now = Date.now();
        if (now - debugInfo.current.lastUpdate > 500) {
            // console.log('Applying fisheye at:', { x, y }, 'size:', size, 'mag:', mag, 'k:', k);
            debugInfo.current.lastUpdate = now;
        }

        // Get the current image data
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;

        // Create a temporary canvas to store the original image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

        // Draw the current image to the temp canvas
        tempCtx.drawImage(img, 0, 0);
        const tempImageData = tempCtx.getImageData(0, 0, img.width, img.height);
        const sourceData = tempImageData.data;

        // Debug: Draw a red dot at mouse position
        const dotSize = 3;
        for (let dy = -dotSize; dy <= dotSize; dy++) {
            for (let dx = -dotSize; dx <= dotSize; dx++) {
                const px = Math.round(x) + dx;
                const py = Math.round(y) + dy;
                if (px >= 0 && px < ctx.canvas.width && py >= 0 && py < ctx.canvas.height) {
                    const idx = (py * ctx.canvas.width + px) * 4;
                    data[idx] = 255; // R
                    data[idx + 1] = 0; // G
                    data[idx + 2] = 0; // B
                    data[idx + 3] = 255; // A
                }
            }
        }

        // Apply fisheye distortion
        for (let vd = -lsize; vd < lsize; vd++) {
            for (let ud = -lsize; ud < lsize; ud++) {
                const r2 = ud * ud + vd * vd;
                if (r2 <= lsize2) {
                    // Calculate the distortion factor - more distortion near the edges
                    const f = 1.0 + (mag - 1.0) * Math.pow(1.0 - Math.sqrt(r2) / lsize, 2);

                    // Calculate source coordinates with distortion
                    const u = Math.floor(x + ud / f - offX.current);
                    const v = Math.floor(y + vd / f - offY.current);

                    // Calculate destination coordinates
                    const px = Math.floor(x + ud);
                    const py = Math.floor(y + vd);

                    // Only process if within canvas bounds
                    if (px >= 0 && px < ctx.canvas.width && py >= 0 && py < ctx.canvas.height) {
                        const destIdx = (py * ctx.canvas.width + px) * 4;

                        // Check if source coordinates are within image bounds
                        if (u >= 0 && u < img.width && v >= 0 && v < img.height) {
                            const srcIdx = (v * img.width + u) * 4;

                            // Copy RGBA values from source to destination
                            data[destIdx] = sourceData[srcIdx]; // R
                            data[destIdx + 1] = sourceData[srcIdx + 1]; // G
                            data[destIdx + 2] = sourceData[srcIdx + 2]; // B
                            data[destIdx + 3] = sourceData[srcIdx + 3]; // A
                        }
                    }
                }
            }
        }

        // Put the modified data back to the canvas
        ctx.putImageData(imageData, 0, 0);

        // Draw a circle around the lens area for debugging
        ctx.beginPath();
        ctx.arc(x, y, lsize, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
    };

    const handleMouseMove = (e) => {
        if (!canvasRef.current) {
            console.log('Canvas ref not ready');
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if mouse is within canvas bounds
        const isInBounds = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

        if (isInBounds) {
            // Only update if position changed significantly (for performance)
            if (Math.abs(mousePos.current.x - x) > 1 || Math.abs(mousePos.current.y - y) > 1) {
                mousePos.current = { x, y };
                // console.log('Mouse move:', mousePos.current);
            }

            // Ensure hover state is true when mouse is over the container
            if (!isHovered.current) {
                isHovered.current = true;
                setLastImageSwitch((prev) => prev + 1);
            }
        } else if (isHovered.current) {
            // Only reset if we're leaving the container
            handleMouseLeave();
        }
    };

    const handleMouseEnter = (e) => {
        // console.log('Mouse entered');
        isHovered.current = true;
        // Force a re-render to trigger the effect
        setLastImageSwitch((prev) => prev + 1);
    };

    const handleMouseLeave = () => {
        // console.log('Mouse left');
        isHovered.current = false;

        // Redraw original image when mouse leaves
        if (canvasRef.current && imageRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const img = imageRef.current;
            if (img.complete) {
                ctx.drawImage(img, offX.current, offY.current);
            }
        }
        // Force a re-render to trigger the effect
        setLastImageSwitch((prev) => prev + 1);
    };

    return (
        <div
            className={`signal-container ${
                rotationDirection === 'clockwise'
                    ? 'rotating-clockwise'
                    : 'rotating-counter-clockwise'
            }`}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="travel-signal">
                <div className="signal-canvas-container">
                    <canvas ref={canvasRef} className="signal-canvas" />
                </div>
            </div>
        </div>
    );
};

export default SignalAnimation;
