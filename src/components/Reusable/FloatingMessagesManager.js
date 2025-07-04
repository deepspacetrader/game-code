import React from 'react';
import { useUI } from '../../context/UIContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import FloatingMessage from './FloatingMessage';
import './FloatingMessages.scss';

const FloatingMessagesManager = () => {
    const { floatingMessages = [] } = useMarketplace();
    const { improvedUILevel } = useUI();
    const messages = Array.isArray(floatingMessages)
        ? floatingMessages.filter((m) => m && m.target === 'global')
        : [];

    // scale animation duration based on UI level: 2s at low, down to 1s at UI>=100
    const animationDuration = `${Math.max(1, 2 - Math.min(improvedUILevel / 100, 1))}s`;

    return (
        <div className="floating-messages-portal">
            {messages.map((m) => (
                <FloatingMessage
                    key={m.id}
                    text={m.text}
                    color={m && m.type && m.type.includes('error') ? 'red' : '#aff'}
                    animation={`floatUp ${animationDuration} ease-out forwards`}
                />
            ))}
        </div>
    );
};

export default FloatingMessagesManager;
