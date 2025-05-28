import React, { useState } from 'react';
import packageJson from '../../../package.json';
import './Version.scss';

// Hardcoded update information
const UPDATES = [
    {
        version: '1.0.0',
        date: '2025-05-27',
        title: 'Initial Release',
        changes: [
            'Initial game launch',
            'Core trading mechanics implemented',
            'Basic UI with dark theme',
        ],
    },
    {
        version: '1.0.1',
        date: '2025-05-28',
        title: 'Bug Fixes',
        changes: [
            'Fixed inventory display issues',
            'Improved market price calculations',
            'Minor UI tweaks and optimizations',
        ],
    },
    {
        version: '1.1.0',
        date: '2025-05-29',
        title: 'New Features',
        changes: [
            'Added new items to the market',
            'Implemented save/load functionality',
            'Added version tracking',
            'Improved event system',
        ],
    },
];

const BUILD_INFO = {
    buildDate: new Date().toISOString().split('T')[0],
    environment: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    lastUpdated: '2025-05-29',
};

const Version = () => {
    const [showTooltip, setShowTooltip] = useState(false);

    // Sort updates by version in descending order (newest first)
    const sortedUpdates = [...UPDATES].sort((a, b) => {
        return b.version.localeCompare(a.version);
    });

    // Format version for display (remove leading 'v' if present)
    const formatVersion = (version) => {
        return version.startsWith('v') ? version : `v${version}`;
    };

    return (
        <div
            className="version-container"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <span className="version-text">v{packageJson.version}</span>

            {showTooltip && (
                <div className="version-tooltip">
                    <div className="updates-container">
                        {sortedUpdates.map((update, index) => (
                            <div key={update.version} className="update-item">
                                <span className="tooltip-title">
                                    {formatVersion(update.version)} - {update.title}
                                </span>
                                <span className="tooltip-date">{update.date}</span>
                                <div className="tooltip-changes">
                                    <ul>
                                        {update.changes.map((change, idx) => (
                                            <li key={idx}>{change}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="tooltip-meta">
                        <div>Build: {BUILD_INFO.buildDate}</div>
                        <div>Env: {BUILD_INFO.environment}</div>
                        <div>Updated: {BUILD_INFO.lastUpdated}</div>
                        <div>Total Updates: {UPDATES.length}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Version;
