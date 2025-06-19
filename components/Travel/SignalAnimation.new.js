import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './SignalAnimation.scss';

import signal1 from '../../images/signal1.webp';
import signal2 from '../../images/signal2.webp';
import signal3 from '../../images/signal3.webp';

const SIGNAL_IMAGES = [signal1, signal2, signal3];
const SIGNAL_IMAGE_SWITCH_MS = 420;
const ROTATION_CHANGE_INTERVAL = 10000;

const SignalAnimation = ({ onClose }) => {
    const [currentImage, setCurrentImage] = useState(
        SIGNAL_IMAGES[Math.floor(Math.random() * SIGNAL_IMAGES.length)]
    );
    const [rotationDirection, setRotationDirection] = useState('clockwise');
    
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
        size: 200,
        mag: -0.3
    });

    // Set random rotation direction
    useEffect(() => {
        const setRandomDirection = () => {
            const directions = ['clockwise', 'counter-clockwise'];
            const randomIndex = Math.floor(Math.random() * directions.length);
            setRotationDirection(directions[randomIndex]);
        };

        setRandomDirection();
        rotationTimer.current = setInterval(setRandomDirection, ROTATION_CHANGE_INTERVAL);
        
        return () => {
            if (rotationTimer.current) {
                clearInterval(rotationTimer.current);
            }
        };
    }, []);

    // Draw image with proper scaling and clipping
    const drawImage = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = imageRef.current;
        
        if (!canvas || !ctx || !img?.complete) return;
        
        const size = Math.min(canvas.width, canvas.height);
        const scale = Math.max(
            size / img.width,
            size / img.height
        );
        
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create circular clipping path
        ctx.save();
        ctx.beginPath();
        ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            size / 2,
            0,
            Math.PI * 2
        );
        ctx.closePath();
        ctx.clip();
        
        // Draw the image
        ctx.drawImage(
            img,
            x,
            y,
            img.width * scale,
            img.height * scale
        );
        
        ctx.restore();
        
        // Save the offset for fisheye effect
        offX.current = x;
        offY.current = y;
    }, []);
    
    // Handle canvas resize
    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        const container = canvas?.closest('.travel-signal');
        if (!canvas || !container) return;
        
        const containerSize = Math.min(
            container.offsetWidth,
            container.offsetHeight
        );
        
        // Set canvas size to match the circular container
        canvas.width = containerSize;
        canvas.height = containerSize;
        
        // Redraw if image is already loaded
        if (imageRef.current?.complete) {
            drawImage();
        }
    }, [drawImage]);
    
    // Initialize canvas and image
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const img = new Image();
        img.onload = () => {
            imageRef.current = img;
            handleResize();
        };
        img.src = currentImage;
        
        // Set up resize observer
        const container = canvas.closest('.travel-signal');
        if (!container) return;
        
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);
        
        return () => {
            resizeObserver.disconnect();
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [currentImage, handleResize]);

    // Handle mouse movement for fisheye effect
    const handleMouseMove = useCallback((e) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        mousePos.current = { x, y };
    }, []);

    // Handle mouse enter/leave for fisheye effect
    const handleMouseEnter = useCallback(() => {
        isHovered.current = true;
    }, []);

    const handleMouseLeave = useCallback(() => {
        isHovered.current = false;
        drawImage();
    }, [drawImage]);

    // Animation loop for fisheye effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        const animate = () => {
            if (isHovered.current) {
                showLens(ctx, img, mousePos.current.x, mousePos.current.y, lensProperties.current);
                animationFrameId.current = requestAnimationFrame(animate);
            }
        };

        if (isHovered.current) {
            animationFrameId.current = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (!isHovered.current && img?.complete) {
                drawImage();
            }
        };
    }, [drawImage]);

    // Show fisheye lens effect
    const showLens = (ctx, img, x, y, { size = 200, mag = 2 } = {}) => {
        if (!img || !img.complete) return;

        const lsize = size;
        const lsize2 = lsize * lsize;
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        
        // Create a temporary canvas for the source image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);
        
        const tempImageData = tempCtx.getImageData(0, 0, img.width, img.height);
        const sourceData = tempImageData.data;
        
        // Apply fisheye distortion
        for (let vd = -lsize; vd < lsize; vd++) {
            for (let ud = -lsize; ud < lsize; ud++) {
                const r2 = ud * ud + vd * vd;
                if (r2 <= lsize2) {
                    const f = 1.0 + (mag - 1.0) * Math.pow(1.0 - Math.sqrt(r2) / lsize, 2);
                    const u = Math.floor(x + ud / f - offX.current);
                    const v = Math.floor(y + vd / f - offY.current);
                    
                    if (u >= 0 && u < img.width && v >= 0 && v < img.height) {
                        const idx = (v * img.width + u) * 4;
                        const didx = ((y + vd) * ctx.canvas.width + (x + ud)) * 4;
                        
                        if (didx >= 0 && didx < data.length - 3) {
                            data[didx] = sourceData[idx];
                            data[didx + 1] = sourceData[idx + 1];
                            data[didx + 2] = sourceData[idx + 2];
                            data[didx + 3] = 255;
                        }
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    };

    // Render the portal content
    const portalContent = (
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

    return createPortal(portalContent, document.getElementById('portal-root') || document.body);
};

export default SignalAnimation;
