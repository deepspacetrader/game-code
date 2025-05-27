import React, { useEffect, useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import './SignalAnimation.scss';

import signal1 from '../images/signal1.webp';
import signal2 from '../images/signal2.webp';
import signal3 from '../images/signal3.webp';

const SIGNAL_IMAGES = [signal1, signal2, signal3];
const SIGNAL_IMAGE_SWITCH_MS = 420;

const SignalAnimation = ({ duration, onClose }) => {
    const { travelTimeLeft } = useMarketplace();

    const [signalImage, setSignalImage] = useState(
        SIGNAL_IMAGES[Math.floor(Math.random() * SIGNAL_IMAGES.length)]
    );
    const [isOpen, setIsOpen] = useState(true);
    const [lastImageSwitch, setLastImageSwitch] = useState(performance.now());

    useEffect(() => {
        // Select a random signal image
        const now = performance.now();
        if (now - lastImageSwitch > SIGNAL_IMAGE_SWITCH_MS) {
            setLastImageSwitch(now);
            setSignalImage(SIGNAL_IMAGES[Math.floor(Math.random() * SIGNAL_IMAGES.length)]);
        }
    }, [duration, onClose]);

    return (
        <div className={`signal-container ${isOpen ? '' : 'close'}`}>
            <div className="travel-signal">
                <div className="travel-text">
                    Flying — {(travelTimeLeft / 1000).toFixed(1)}s left
                </div>
                {signalImage && <img src={signalImage} alt="Signal" className="signal-image" />}
            </div>
        </div>
    );
};

export default SignalAnimation;
