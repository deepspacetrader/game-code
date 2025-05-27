import React, { useState, useEffect } from 'react';
import traders from '../data/traders.json';

const TraderMessage = ({
    lastTrader,
    messageText,
    traderMessages = [],
    currentTrader,
    statusEffects = {},
    improvedUILevel = 0,
}) => {
    const [currentMessage, setCurrentMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const [tierClass, setTierClass] = useState('tier-low');

    // Update tier class based on UI level
    useEffect(() => {
        if (improvedUILevel >= 100) {
            setTierClass('tier-elite');
        } else if (improvedUILevel >= 75) {
            setTierClass('tier-ultra');
        } else if (improvedUILevel >= 25) {
            setTierClass('tier-medium');
        } else {
            setTierClass('tier-low');
        }
    }, [improvedUILevel]);

    // Update message when dependencies change
    useEffect(() => {
        if (!traderMessages || traderMessages.length === 0) {
            setVisible(false);
            return;
        }

        // Use currentTrader if available, otherwise use lastTrader
        const traderId = currentTrader || lastTrader;
        if (!traderId) {
            setVisible(false);
            return;
        }

        // Get trader config (known languages) by traderId
        const traderConfig = traders.traders.find((t) => t.traderId === traderId);
        if (!traderConfig) {
            setVisible(false);
            return;
        }

        // Find the trader message entry by traderId
        const traderMsg = traderMessages.find((tm) => tm.traderId === traderId);
        if (!traderMsg) {
            setVisible(false);
            return;
        }

        const greetings = traderMsg.greetings || {};
        const goodbyes = traderMsg.goodbyes || {};

        // Check if player has any translators
        const hasCHIK = statusEffects['Auto Translator CHIK']?.active || false;
        const hasLAY = statusEffects['Auto Translator LAY']?.active || false;

        // Determine if this is a goodbye message (lastTrader is set) or greeting (currentTrader is set)
        const isGoodbye = !!lastTrader && !currentTrader;
        const messages = isGoodbye ? goodbyes : greetings;

        // If we have a specific message to show, use that
        if (messageText) {
            // Try to find the message in any language
            for (const lang of Object.values(messages)) {
                if (lang === messageText) {
                    setCurrentMessage(messageText);
                    setVisible(true);
                    return;
                }
            }
        }

        // Otherwise, select a random message in the trader's language
        const messageKeys = Object.keys(messages);
        if (messageKeys.length > 0) {
            const randomKey = messageKeys[Math.floor(Math.random() * messageKeys.length)];
            let selectedMessage = messages[randomKey];

            // If player has a translator for this language, show the English version if available
            if (
                ((randomKey === 'CHIK' && hasCHIK) || (randomKey === 'LAY' && hasLAY)) &&
                messages['EN']
            ) {
                selectedMessage = messages['EN'];
            }

            console.log('Selected message:', selectedMessage);
            setCurrentMessage(selectedMessage);
            setVisible(true);
        }
    }, [currentTrader, lastTrader, messageText, statusEffects, traderMessages]);

    // Auto-hide after 5 seconds
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                console.log('Auto-hiding message');
                setVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible || !currentMessage) return null;

    return (
        <div
            className={`trader-message ${tierClass}`}
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                cursor: 'pointer',
                padding: '10px',
                borderRadius: '5px',
                margin: '10px',
                maxWidth: '300px',
                textAlign: 'center',
            }}
            onClick={() => setVisible(false)}
        >
            <div className="message-content">{currentMessage}</div>
        </div>
    );
};

export default TraderMessage;
