import React from 'react';

/**
 * Single floating message component.
 * Props:
 * - text: message text
 * - color: text color
 * - animation: CSS animation string
 */
const FloatingMessage = ({ text, color, animation, style = {} }) => {
    const styleProps = { animation, ...style };
    if (color) styleProps.color = color;
    return (
        <div className="floating-message" style={styleProps}>
            {text}
        </div>
    );
};

export default FloatingMessage;
