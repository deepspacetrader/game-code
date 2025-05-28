import React from 'react';
import { useMarketplace } from '../context/MarketplaceContext';

function FastestTimes() {
    const { recordTimes, credits } = useMarketplace();
    const entries = Object.entries(recordTimes || {});
    if (entries.length === 0) return null;
    const sortedEntries = entries.sort(([, a], [, b]) => a - b);

    return (
        <div className="fastest-times">
            <h2>Fastest Times</h2>
            <ul>
                {sortedEntries.map(([name, time]) => (
                    <li key={name}>
                        {name}: {time.toFixed(2)}s
                    </li>
                ))}
            </ul>
            <p>Final Credit Balance: {credits.toFixed(2)}</p>
        </div>
    );
}

export default FastestTimes;
