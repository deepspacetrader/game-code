import React from 'react';

export default function VolumeSlider({ volume, setVolume, setVolumeWithAudioStop }) {
    const min = 0;
    const max = 2;
    const step = 0.25;

    const setVol = setVolumeWithAudioStop || setVolume;
    const handleChange = (e) => {
        setVol(Number(e.target.value));
    };
    const handleDecrease = () => {
        setVol(Math.max(min, Math.round((volume - step) * 100) / 100));
    };
    const handleIncrease = () => {
        setVol(Math.min(max, Math.round((volume + step) * 100) / 100));
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
                aria-label="Lower Volume"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
                onClick={handleDecrease}
                tabIndex={0}
            >
                🔈
            </button>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={volume}
                onChange={handleChange}
                style={{ width: 80 }}
                aria-label="Volume Slider"
            />
            <button
                aria-label="Increase Volume"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
                onClick={handleIncrease}
                tabIndex={0}
            >
                🔊
            </button>
        </div>
    );
}
