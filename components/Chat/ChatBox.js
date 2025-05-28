import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUI } from '../../context/UIContext';
import ChatMessage from './ChatMessage';
import tradersData from '../../data/traders.json';
import chatMessagesData from '../../data/chat-messages.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './ChatBox.scss';

const { traders = [] } = tradersData;

const UIBadge = ({ tier }) => {
    const getTierColor = () => {
        const colors = {
            zero: '#888888',
            worthless: '#999',
            awful: '#8a9b0f',
            bad: '#7f8c8d',
            verylow: '#7f8c8d',
            low: '#3498db',
            medium: '#2ecc71',
            high: '#f1c40f',
            ultra: '#e67e22',
            newbie: '#1abc9c',
            apprentice: '#9b59b6',
            journeyman: '#3498db',
            adventurer: '#2ecc71',
            explorer: '#f1c40f',
            professional: '#e67e22',
            skilled: '#e74c3c',
            knowledgeable: '#9b59b6',
            smart: '#8e44ad',
            expert: '#3498db',
            master: '#2ecc71',
            grandmaster: '#f1c40f',
            elite: '#e67e22',
            potential: '#e74c3c',
            endgame: '#c0392b',
        };
        return colors[tier] || '#3498db';
    };

    const getTierName = (tier) => {
        return tier.charAt(0).toUpperCase() + tier.slice(1);
    };

    const getTierStyle = () => {
        const baseStyle = {
            display: 'inline-block',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            marginLeft: '8px',
            verticalAlign: 'middle',
            lineHeight: '1',
        };

        const tierColor = getTierColor();

        // Add animation for higher tiers
        const animation = {
            medium: {},
            high: { animation: 'pulse 2s infinite' },
            ultra: {
                animation: 'pulse 1.5s infinite',
                textShadow: '0 0 5px rgba(255,255,255,0.5)',
            },
            apprentice: {
                animation: 'rainbow 3s infinite',
                textShadow: '0 0 5px rgba(255,255,255,0.5)',
            },
            expert: {
                background: `linear-gradient(45deg, ${tierColor}, #8e44ad, #3498db, #2ecc71, #f1c40f, #e67e22, #e74c3c, ${tierColor})`,
                backgroundSize: '300% 300%',
                animation: 'gradient 8s ease infinite',
                textShadow: '0 0 10px rgba(255,255,255,0.7)',
                boxShadow: '0 0 15px rgba(255,255,255,0.5)',
            },
            grandmaster: {
                background: `linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff, #ff0000)`,
                backgroundSize: '400% 400%',
                animation: 'rainbow 3s linear infinite',
                textShadow: '0 0 15px rgba(255,255,255,0.9)',
                boxShadow: '0 0 20px rgba(255,255,255,0.7)',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1,
            },
            endgame: {
                background:
                    'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff, #ff0000)',
                backgroundSize: '400% 400%',
                animation: 'rainbow 3s linear infinite',
                textShadow: '0 0 15px rgba(255,255,255,0.9)',
                boxShadow: '0 0 25px rgba(255,255,255,0.8)',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1,
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    right: '-50%',
                    bottom: '-50%',
                    background:
                        'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%)',
                    transform: 'rotate(45deg)',
                    animation: 'shine 3s infinite',
                    zIndex: -1,
                },
            },
        };

        const tierStyle = {
            ...baseStyle,
            backgroundColor: tierColor,
            ...(animation[tier] || {}),
        };

        return tierStyle;
    };

    return (
        <span className="ui-tier-badge" style={getTierStyle()}>
            {getTierName(tier)}
        </span>
    );
};

const ChatBox = ({ statusEffects }) => {
    const [activeTier, setActiveTier] = useState('all');
    const [showTierSelector, setShowTierSelector] = useState(false);
    const [casualMessages, setCasualMessages] = useState([]);
    const { uiTier, uiLevel } = useUI();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    // Active traders state removed as it wasn't being used
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
    const containerRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize chat visibility based on UI level
    useEffect(() => {
        setIsOpen(uiLevel >= 1000);
    }, [uiLevel]);

    // Add casual chatter at regular intervals
    useEffect(() => {
        if (!isInitialized) return;

        const addCasualMessage = () => {
            // Get all traders with casual messages
            const tradersWithCasual = chatMessagesData.chatMessages.filter(
                (trader) => trader.casual && trader.casual.length > 0
            );

            if (tradersWithCasual.length > 0) {
                // Select a random trader with casual messages
                const randomTrader =
                    tradersWithCasual[Math.floor(Math.random() * tradersWithCasual.length)];
                // Select a random casual message from that trader
                const randomMessage =
                    randomTrader.casual[Math.floor(Math.random() * randomTrader.casual.length)];

                // Get available tiers based on UI level
                const availableTiers = ['low', 'medium', 'high'].slice(
                    0,
                    ['low', 'medium', 'high'].indexOf(uiTier) + 1
                );

                setCasualMessages((prev) => [
                    ...prev.slice(-50), // Keep only last 50 messages for performance
                    {
                        id: Date.now(),
                        sender: randomTrader.name,
                        message: randomMessage,
                        isPlayer: false,
                        tier: availableTiers[Math.floor(Math.random() * availableTiers.length)],
                        timestamp: Date.now(),
                    },
                ]);
            }
        };

        const interval = setInterval(addCasualMessage, 10000); // Add new message every 10 seconds
        return () => clearInterval(interval);
    }, [uiTier, isInitialized]);

    // Initialize component
    useEffect(() => {
        setIsInitialized(true);
        return () => setIsInitialized(false);
    }, []);

    const renderTierSelector = () => (
        <div className="tier-selector">
            <div className="tier-toggle" onClick={() => setShowTierSelector(!showTierSelector)}>
                <span>
                    Channel:{' '}
                    {activeTier === 'all'
                        ? 'All'
                        : activeTier.charAt(0).toUpperCase() + activeTier.slice(1)}
                </span>
            </div>
            {showTierSelector && (
                <div className="tier-options">
                    <div
                        className={`tier-option ${activeTier === 'all' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTier('all');
                            setShowTierSelector(false);
                        }}
                    >
                        All Channels
                    </div>
                    {['low', 'medium', 'high'].map((tier) => {
                        if (
                            ['low', 'medium', 'high'].indexOf(tier) >
                            ['low', 'medium', 'high'].indexOf(uiTier)
                        ) {
                            return null;
                        }
                        return (
                            <div
                                key={tier}
                                className={`tier-option ${activeTier === tier ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTier(tier);
                                    setShowTierSelector(false);
                                }}
                            >
                                {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const filteredMessages = useMemo(() => {
        const allMessages = [...messages, ...casualMessages];
        if (activeTier === 'all') return allMessages;

        return allMessages.filter((msg) => {
            const msgTier = msg.tier || 'low';
            const tierOrder = { low: 0, medium: 1, high: 2 };
            const activeTierOrder = tierOrder[activeTier] || 0;
            const msgTierOrder = tierOrder[msgTier] || 0;
            return msgTierOrder <= activeTierOrder;
        });
    }, [messages, casualMessages, activeTier]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const newMessage = {
            id: Date.now(),
            message: { EN: inputMessage },
            sender: 'You',
            isPlayer: true,
            tier: uiTier,
            timestamp: Date.now(),
        };

        // Use functional update to ensure we have the latest state
        setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, newMessage];
            return updatedMessages;
        });

        setInputMessage('');

        setTimeout(() => {
            if (!traders || traders.length === 0) {
                console.warn('No traders available');
                return;
            }

            const randomTrader = traders[Math.floor(Math.random() * traders.length)];
            if (!randomTrader) {
                console.warn('Failed to select a random trader');
                return;
            }

            const messageType = ['casual', 'joke', 'boast', 'brag', 'swear'][
                Math.floor(Math.random() * 5)
            ];

            try {
                const response = getRandomResponse(randomTrader.traderId, messageType);
                if (response) {
                    setMessages((prevMessages) => {
                        const traderMessage = {
                            id: Date.now(),
                            message: response,
                            sender: randomTrader.name || 'Unknown Trader',
                            isPlayer: false,
                            tier: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                            timestamp: Date.now(),
                        };
                        return [...prevMessages, traderMessage];
                    });
                }
            } catch (error) {
                console.error('Error generating random response:', error);
            }
        }, 1000);
    };

    const handleScroll = useCallback((e) => {
        e.stopPropagation();
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
        setIsAutoScrollEnabled(isNearBottom);

        e.preventDefault();
        return false;
    }, []);

    useEffect(() => {
        if (isAutoScrollEnabled && messagesEndRef.current) {
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'start',
                });
            });
        }
    }, [messages, isAutoScrollEnabled]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const preventParentScroll = (e) => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isAtTop = scrollTop === 0 && e.deltaY < 0;
            const isAtBottom =
                Math.abs(scrollHeight - clientHeight - scrollTop) < 1 && e.deltaY > 0;

            if (isAtTop || isAtBottom) {
                e.preventDefault();
            }
        };

        container.addEventListener('wheel', preventParentScroll, { passive: false });
        container.addEventListener('touchmove', preventParentScroll, { passive: false });

        return () => {
            container.removeEventListener('wheel', preventParentScroll);
            container.removeEventListener('touchmove', preventParentScroll);
        };
    }, []);

    const generateNonsense = useCallback((traderId = 1) => {
        const vowels = 'aeiouy';
        const consonants = 'bcdfghjklmnpqrstvwxz';
        const wordCount = 2 + Math.floor(Math.random() * 4);
        let result = '';

        const getRandomChar = (str) => str.charAt(Math.floor(Math.random() * str.length));
        const getRandomBool = (chance = 0.5) => Math.random() < chance;
        const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        const traderStyles = {
            1: {
                prefixes: ['Zor', 'Vex', 'Qua', 'Xan', 'Plo', 'Kri'],
                suffixes: ['ix', 'ax', 'ox', 'ux', 'yx', 'argh', 'izzle'],
                wordEndings: ['ing', 'ong', 'ang', 'ung', 'ion', 'ary', 'ous'],
                commonConsonants: 'mnpqrstvwxz',
                commonVowels: 'aeiou',
                specialChars: '!?*',
                wordLength: [3, 8],
                excitement: 0.7,
            },
            2: {
                prefixes: ['Zyn', 'Xyl', 'Quor', 'Vex', 'Pry'],
                suffixes: ['th', 'nth', 'lyx', 'quor', 'vix'],
                wordEndings: ['ion', 'ous', 'ary', 'ent', 'ant'],
                commonConsonants: 'bcdfghjklmnpqrstvwxz',
                commonVowels: 'aeiouy',
                specialChars: '...',
                wordLength: [4, 10],
                excitement: 0.3,
            },
            3: {
                prefixes: ['Blip', 'Zoop', 'Floo', 'Wibble', 'Narf'],
                suffixes: ['zle', 'puff', 'muffin', 'snick', 'doodle'],
                wordEndings: ['oodle', 'ump', 'erino', 'snick', 'wump'],
                commonConsonants: 'bcdfghjklmnpqrstvwxz',
                commonVowels: 'aeiouy',
                specialChars: '!?*~',
                wordLength: [2, 6],
                excitement: 0.9,
            },
            default: {
                prefixes: ['Zor', 'Vex', 'Qua', 'Xan', 'Plo', 'Kri'],
                suffixes: ['ix', 'ax', 'ox', 'ux', 'yx'],
                wordEndings: ['ing', 'ong', 'ang', 'ung', 'ion'],
                commonConsonants: 'bcdfghjklmnpqrstvwxz',
                commonVowels: 'aeiouy',
                specialChars: '!?*',
                wordLength: [3, 8],
                excitement: 0.5,
            },
        };

        const style = traderStyles[traderId] || traderStyles.default;

        const generateWord = () => {
            const usePrefix = getRandomBool(0.3);
            const useSuffix = getRandomBool(0.3);
            const useEnding = getRandomBool(0.4);

            let word = '';

            if (usePrefix && style.prefixes) {
                word += style.prefixes[Math.floor(Math.random() * style.prefixes.length)];
            }

            const coreLength = getRandomInt(style.wordLength[0], style.wordLength[1]);
            let lastWasVowel = getRandomBool();

            for (let i = 0; i < coreLength; i++) {
                if (lastWasVowel) {
                    word += getRandomChar(style.commonConsonants || consonants);
                    if (getRandomBool(0.3) && i < coreLength - 1) {
                        word += getRandomChar(style.commonConsonants || consonants);
                        i++;
                    }
                } else {
                    word += getRandomChar(style.commonVowels || vowels);
                    if (getRandomBool(0.2) && i < coreLength - 1) {
                        word += getRandomChar(style.commonVowels || vowels);
                        i++;
                    }
                }
                lastWasVowel = !lastWasVowel;
            }

            if (useEnding && style.wordEndings) {
                word += style.wordEndings[Math.floor(Math.random() * style.wordEndings.length)];
            }

            if (useSuffix && style.suffixes) {
                word += style.suffixes[Math.floor(Math.random() * style.suffixes.length)];
            }

            if (getRandomBool(0.1)) {
                const pos = getRandomInt(1, word.length - 2);
                word = word.slice(0, pos) + "'" + word.slice(pos);
            }

            if (getRandomBool(0.2) && style.specialChars) {
                const special =
                    style.specialChars[Math.floor(Math.random() * style.specialChars.length)];
                word = special + word + special;
            }

            return word;
        };

        for (let w = 0; w < wordCount; w++) {
            let word = generateWord();

            if (w === 0 || getRandomBool(0.3)) {
                word = word.charAt(0).toUpperCase() + word.slice(1);
            }

            result += word;

            if (w < wordCount - 1) {
                if (getRandomBool(0.1)) {
                    result += ', ';
                } else if (getRandomBool(0.1)) {
                    result += '... ';
                } else {
                    result += ' ';
                }
            } else {
                const endings = ['.', '!', '?', '...', '?!', '!!!', '...'];
                result += endings[Math.floor(Math.random() * endings.length)];
            }
        }

        if (style.excitement > 0.7 && getRandomBool(style.excitement - 0.3)) {
            const exclamations = [' ZOOM!', ' WOW!', ' ZARK!', ' *sparkles*', ' KAPOW!', ' BAM!'];
            result += exclamations[Math.floor(Math.random() * exclamations.length)];
        }

        return result;
    }, []);

    const getRandomResponse = useCallback(
        (traderId, messageType = 'greetings') => {
            const trader = chatMessagesData.chatMessages.find((t) => t.traderId === traderId);
            if (!trader) {
                console.error('No valid traders found in chat-messages.json');
                return { EN: generateNonsense(traderId) };
            }

            const messages = trader[messageType] || trader.greetings || [];
            if (messages.length === 0) {
                return { EN: generateNonsense(traderId) };
            }

            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            return { EN: randomMessage };
        },
        [generateNonsense]
    );

    // ...

    return (
        <div className={`chat-box ${isOpen ? 'open' : 'closed'}`}>
            {renderTierSelector()}
            <div className="chat-messages" ref={messagesEndRef}>
                <div
                    className="header-content"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ cursor: 'pointer' }}
                >
                    <h3>Trader Network</h3>
                    <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`toggle-icon ${isOpen ? 'open' : ''}`}
                    />
                </div>
                {/* Active traders section removed as it wasn't being used */}
                <div className="messages-container" onScroll={handleScroll} ref={containerRef}>
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            <p>Connection Established</p>
                        </div>
                    ) : (
                        filteredMessages.map((msg, index) => (
                            <div
                                key={msg.id}
                                className={`message ${msg.isPlayer ? 'player' : 'trader'}`}
                            >
                                <div className="message-header">
                                    <span className="message-sender">{msg.sender}</span>
                                    {msg.senderTier && <UIBadge tier={msg.senderTier} />}
                                    <span className="message-timestamp">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="message-content">
                                    {typeof msg.message === 'string' ? (
                                        msg.message
                                    ) : (
                                        <ChatMessage
                                            message={msg.message}
                                            isPlayer={msg.isPlayer}
                                            statusEffects={statusEffects}
                                        />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="chat-input-container">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="chat-input"
                        autoComplete="off"
                    />
                    <button type="submit" className="send-button">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBox;
