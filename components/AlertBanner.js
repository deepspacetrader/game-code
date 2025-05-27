import React from 'react';
import './AlertBanner.css';

const AlertBanner = ({ message, type = 'info', uiLevel }) => {
    // determine theme based on UI level
    let theme = 'bare';
    if (uiLevel > 50) theme = 'charts';
    else if (uiLevel > 25) theme = 'sorting';
    else if (uiLevel > 15) theme = 'avg';
    else if (uiLevel > 10) theme = 'colors';
    else if (uiLevel > 5) theme = 'borders';
    else theme = 'bare';

    if (!message) return null;

    return (
        <div className={`alert-banner alert-${type} theme-${theme}`}>
            {message}
        </div>
    );
};

export default AlertBanner;
