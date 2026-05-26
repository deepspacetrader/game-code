import React, { useState } from 'react';
import './Version.scss';
import versionData from '../../data/version.json';

const BUILD_INFO = {
    buildDate: new Date().toISOString().split('T')[0],
    lastUpdated: versionData.versions[0].date,
};

const currentVersion = versionData.versions[0].number;

const Version = () => {
    const [showTooltip, setShowTooltip] = useState(false);

    // Sort updates by version in descending order (newest first)
    const sortedUpdates = [...versionData.versions].sort((a, b) => {
        return b.number.localeCompare(a.number);
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
            <span className="version-text">v{currentVersion}</span>

            {showTooltip && (
                <div className="version-tooltip">
                    <div className="updates-container">
                        {sortedUpdates.map((update, index) => (
                            <div key={update.number} className="update-item">
                                <span className="tooltip-title">
                                    {formatVersion(update.number)} - {update.title}
                                </span>
                                <span className="tooltip-date">{update.date}</span>
                                <div className="tooltip-changes">
                                    <ul>
                                        {update.changes.map(
                                            (change, idx) => change && <li key={idx}>{change}</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="tooltip-meta">
                        <div>Build: {BUILD_INFO.buildDate}</div>
                        <div>Updated: {BUILD_INFO.lastUpdated}</div>
                        <div>Total Updates: {versionData.versions.length}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Version;
