import React, { useState, useEffect, useMemo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAILevel } from '../../context/AILevelContext';
import galaxiesData from '../../data/galaxies.json';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import AlertBanner from '../Reusable/AlertBanner';

// dynamic import of galaxy images
const galaxyImages = require.context('../../images', false, /^\.\/galaxy\d+(-war)?\.webp$/);

const MarketSummary = () => {
    const { displayCells, galaxyName, onBuyAll, credits } = useMarketplace();
    const { improvedAILevel } = useAILevel();
    const [history, setHistory] = useState([]);
    const [alertMsg, setAlertMsg] = useState('');
    const [alertType, setAlertType] = useState('info');
    const [bgImage, setBgImage] = useState(null);

    // compute market total with useMemo to prevent unnecessary recalculations
    const total = useMemo(() => {
        const validItems = displayCells.filter((item) => item && item.price && item.stock);
        return validItems.reduce((sum, item) => sum + item.price * item.stock, 0);
    }, [displayCells]);

    // Update history only when total changes
    useEffect(() => {
        setHistory((h) => {
            // Only update if the total has actually changed and is a valid number
            if ((h.length > 0 && h[h.length - 1] === total) || isNaN(total)) {
                return h;
            }
            const newHistory = [...h, total];
            // Keep only the last 20 entries
            return newHistory.slice(-20);
        });
    }, [total]);

    useEffect(() => {
        if (!alertMsg) return;
        const id = setTimeout(() => setAlertMsg(''), 4000);
        return () => clearTimeout(id);
    }, [alertMsg]);

    useEffect(() => {
        const info = galaxiesData.galaxies.find((g) => g.name === galaxyName) || {};
        const { galaxyId, war = false } = info;
        let imgSrc = null;
        if (typeof galaxyId === 'number') {
            const key = `./galaxy${galaxyId}${war ? '-war' : ''}.webp`;
            if (galaxyImages.keys().includes(key)) imgSrc = galaxyImages(key);
        }
        setBgImage(imgSrc);
    }, [galaxyName]);

    // determine enhanced view for higher AI
    const enhanced = improvedAILevel >= 75;
    // compute dynamic width percent based on total and AI
    const widthPercent = enhanced
        ? Math.min(40, Math.max(15, total / 8000))
        : Math.min(30, Math.max(10, total / 10000));

    const style = {
        width: `${widthPercent}vw`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '4px',
        border: '1px solid #fff',
        borderRadius: '4px',
        margin: '0 auto',
        zIndex: 1000,
    };

    // handle bulk buy of entire market stock
    const handleBuyAll = () => {
        if (credits < total) {
            setAlertMsg('Not enough credits for bulk purchase');
            setAlertType('error');
            return;
        }
        const success = onBuyAll();
        if (!success) {
            setAlertMsg('Not enough credits for bulk purchase');
            setAlertType('error');
        } else {
            setAlertMsg('Bulk purchase completed');
            setAlertType('info');
        }
    };

    return (
        <>
            <AlertBanner message={alertMsg} type={alertType} aiLevel={improvedAILevel} />
            <div className="market-summary-container">
                <h3>Market</h3>

                <div
                    style={{
                        ...style,
                        cursor: enhanced ? 'pointer' : 'default',
                        borderColor: enhanced
                            ? history.length > 1 && total - history[history.length - 2] < 0
                                ? 'red'
                                : 'lime'
                            : style.border,
                    }}
                    className="market-summary"
                    onClick={enhanced ? handleBuyAll : undefined}
                >
                    <div
                        className="galaxy-image"
                        style={{
                            backgroundImage: bgImage ? `url(${bgImage})` : undefined,
                        }}
                    >
                        <div className="galaxy-summary-info">
                            <p>{galaxyName}</p>
                            <p>Total: {total}</p>
                        </div>

                        {enhanced && (
                            <Sparklines data={history} width={widthPercent * 3} height={30}>
                                <SparklinesLine color="#fff" />
                            </Sparklines>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MarketSummary;
