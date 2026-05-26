import React from 'react';
import AsciiWaveAnimator from './AsciiWaveAnimator';
import './AsciiThumbnailGrid.scss';

const AsciiThumbnailGrid = ({ images = [] }) => {
    if (images.length === 0) return null;

    return (
        <div className="ascii-thumbnail-grid">
            {images.map((image, index) => (
                <div key={index} className="ascii-thumbnail">
                    <div className="ascii-thumbnail-inner">
                        <AsciiWaveAnimator
                            imagePath={image}
                            showFinalResult={true}
                            isThumbnail={true}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AsciiThumbnailGrid;
