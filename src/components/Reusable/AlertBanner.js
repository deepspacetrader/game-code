import React from 'react';
import './AlertBanner.css';

const AlertBanner = ({ message, type = 'info', aiLevel }) => {
    // determine theme based on AI level
    let theme = 'bare';
    if (aiLevel > 50) theme = 'charts';
    else if (aiLevel > 25) theme = 'sorting';
    else if (aiLevel > 15) theme = 'avg';
    else if (aiLevel > 10) theme = 'colors';
    else if (aiLevel > 5) theme = 'borders';
    else theme = 'bare';

    if (!message) return null;

    return <div className={`alert-banner alert-${type} theme-${theme}`}>{message}</div>;
};

export default AlertBanner;
