import React from 'react';
import { useAILevel } from '../../context/AILevelContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import FloatingMessage from './FloatingMessage';
import './FloatingMessages.scss';

const FloatingMessagesManager = () => {
    const { floatingMessages = [] } = useMarketplace();
    const { improvedAILevel } = useAILevel();
    const messages = Array.isArray(floatingMessages)
        ? floatingMessages.filter((m) => m && m.target === 'global')
        : [];

    // scale animation duration based on AI level: 2s at low, down to 1s at AI>=100
    const animationDuration = `${Math.max(1, 2 - Math.min(improvedAILevel / 100, 1))}s`;

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
