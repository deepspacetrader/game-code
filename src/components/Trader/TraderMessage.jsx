import React, { useState, useEffect, useRef } from 'react';
import traders from '../../data/traders.json';

const TraderMessage = ({
    lastTrader,
    messageText,
    traderMessages = [],
    currentTrader,
    statusEffects = {},
    improvedAILevel = 0,
    secretOfferResult,
}) => {
    const [currentMessage, setCurrentMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const [tierClass, setTierClass] = useState('tier-low');
    const lastMessageTraderRef = useRef(null);

    // Update tier class based on AI level
    useEffect(() => {
        if (improvedAILevel >= 100) {
            setTierClass('tier-elite');
        } else if (improvedAILevel >= 75) {
            setTierClass('tier-ultra');
        } else if (improvedAILevel >= 25) {
            setTierClass('tier-medium');
        } else {
            setTierClass('tier-low');
        }
    }, [improvedAILevel]);

    // Update message when trader changes (not when status effects change)
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

        // Reset the ref if we're visiting a different trader
        if (lastMessageTraderRef.current !== null && lastMessageTraderRef.current !== traderId) {
            lastMessageTraderRef.current = null;
        }

        // Only show message once per trader per visit
        if (lastMessageTraderRef.current === traderId) {
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
        const hasCHIK =
            statusEffects['translate_CHIK'] ||
            statusEffects['Auto Translator CHIK']?.active ||
            false;
        const hasLAY =
            statusEffects['translate_LAY'] || statusEffects['Auto Translator LAY']?.active || false;

        // Determine if this is a goodbye message (lastTrader is set) or greeting (currentTrader is set)
        const isGoodbye = !!lastTrader && !currentTrader;
        const messages = isGoodbye ? goodbyes : greetings;

        // If we have a specific message to show, use that
        if (messageText) {
            let messageToShow = messageText;

            // If messageText is an array, pick a random message from it
            if (Array.isArray(messageText)) {
                // If it's an array of arrays (like the greetings object values), get a random language first
                if (messageText.some(Array.isArray)) {
                    const randomLang = messageText[Math.floor(Math.random() * messageText.length)];
                    if (Array.isArray(randomLang) && randomLang.length > 0) {
                        messageToShow = randomLang[Math.floor(Math.random() * randomLang.length)];
                    } else {
                        messageToShow = randomLang;
                    }
                } else {
                    // If it's a simple array of strings, pick one randomly
                    messageToShow = messageText[Math.floor(Math.random() * messageText.length)];
                }
            }

            // If we ended up with an array (shouldn't happen with the above logic, but just in case)
            if (Array.isArray(messageToShow)) {
                messageToShow = messageToShow[0] || '';
            }

            setCurrentMessage(messageToShow);
            setVisible(true);
            lastMessageTraderRef.current = traderId;
            return;
        }

        // Otherwise, select a random message in the trader's language
        const messageKeys = Object.keys(messages);
        if (messageKeys.length > 0) {
            // First, try to find a message in a language the player can translate
            let selectedLanguage = null;
            let selectedMessages = null;

            // Check if player has translators and if there are messages in those languages
            if (hasCHIK && messages['CHIK']) {
                selectedLanguage = 'CHIK';
                selectedMessages = messages['CHIK'];
            } else if (hasLAY && messages['LAY']) {
                selectedLanguage = 'LAY';
                selectedMessages = messages['LAY'];
            }

            // If no translatable language found, pick a random language
            if (!selectedLanguage) {
                const randomKey = messageKeys[Math.floor(Math.random() * messageKeys.length)];
                selectedLanguage = randomKey;
                selectedMessages = messages[randomKey];
            }

            // Pick a random message from the selected language
            if (Array.isArray(selectedMessages) && selectedMessages.length > 0) {
                selectedMessages =
                    selectedMessages[Math.floor(Math.random() * selectedMessages.length)];
            }

            // If player has a translator for this language, show the English version if available
            if (
                ((selectedLanguage === 'CHIK' && hasCHIK) ||
                    (selectedLanguage === 'LAY' && hasLAY)) &&
                messages['EN']
            ) {
                const enMessages = messages['EN'];
                selectedMessages = Array.isArray(enMessages)
                    ? enMessages[Math.floor(Math.random() * enMessages.length)]
                    : enMessages;
            }

            setCurrentMessage(selectedMessages);
            setVisible(true);
            lastMessageTraderRef.current = traderId;
        }

        // Add prop: secretOfferResult: { type: 'accept' | 'reject', language?: string }
        // In the effect, if secretOfferResult is set, pick a random message from traderMessages[traderId].secretAccepts or secretRejections, using the language (or EN if not available), and show it as the message.
        // If player has translation status effect (from MarketplaceContext), use EN if available.
        if (secretOfferResult) {
            const { type, language } = secretOfferResult;
            const secretMessages =
                type === 'accept'
                    ? traderMsg.secretAccepts || {}
                    : traderMsg.secretRejections || {};
            const secretMessageKeys = Object.keys(secretMessages);

            if (secretMessageKeys.length > 0) {
                let selectedSecretLanguage = null;
                let selectedSecretMessages = null;

                if (language) {
                    if (hasCHIK && secretMessages['CHIK']) {
                        selectedSecretLanguage = 'CHIK';
                        selectedSecretMessages = secretMessages['CHIK'];
                    } else if (hasLAY && secretMessages['LAY']) {
                        selectedSecretLanguage = 'LAY';
                        selectedSecretMessages = secretMessages['LAY'];
                    }
                }

                if (!selectedSecretLanguage) {
                    const randomKey =
                        secretMessageKeys[Math.floor(Math.random() * secretMessageKeys.length)];
                    selectedSecretLanguage = randomKey;
                    selectedSecretMessages = secretMessages[randomKey];
                }

                if (Array.isArray(selectedSecretMessages) && selectedSecretMessages.length > 0) {
                    selectedSecretMessages =
                        selectedSecretMessages[
                            Math.floor(Math.random() * selectedSecretMessages.length)
                        ];
                }

                if (
                    ((selectedSecretLanguage === 'CHIK' && hasCHIK) ||
                        (selectedSecretLanguage === 'LAY' && hasLAY)) &&
                    secretMessages['EN']
                ) {
                    const enSecretMessages = secretMessages['EN'];
                    selectedSecretMessages = Array.isArray(enSecretMessages)
                        ? enSecretMessages[Math.floor(Math.random() * enSecretMessages.length)]
                        : enSecretMessages;
                }

                setCurrentMessage(selectedSecretMessages);
                setVisible(true);
                lastMessageTraderRef.current = traderId;
            }
        }
    }, [currentTrader, lastTrader, messageText, traderMessages, statusEffects, secretOfferResult]);

    // Auto-hide after 5 seconds
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
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
