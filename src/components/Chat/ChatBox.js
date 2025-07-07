import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAILevel } from '../../context/AILevelContext';
import ChatMessage from './ChatMessage';
import tradersData from '../../data/traders.json';
import chatMessagesData from '../../data/chat-messages.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './ChatBox.scss';

// Helper function to determine message type based on content
const getMessageType = (message) => {
    const lowerMessage = message.toLowerCase().trim();

    // Greeting patterns - Comprehensive list of greetings in multiple languages and styles
    const greetingPatterns = [
        // Common English greetings
        /^\s*(hi|hello|hey|greetings|salutations|yo|what's up|howdy|hola|sup|wassup|wazzup|yo|hiya|howdy|howdy\s*partner|hi\s+there|hey\s+there|hello\s+there|hi\s+y['']all|hey\s+y['']all)\b/i,

        // Time-based greetings
        /\b(good\s*(morning|afternoon|evening|night)|g'day|top\s*of\s*the\s*morning|good\s*day|good\s*evening|good\s*morning|good\s*afternoon|good\s*night|evenin['’]?g?)\b/i,

        // International greetings
        /^\s*(hola|ciao|salut|hallo|hallo\s*daar|guten\s*tag|bonjour|konnichiwa|ni\s*hao|namaste|salaam|shalom|privet|ol[aá]|zdravstvuyte|merhaba|sawubona|sawubona\s*nin|mhoro|mhoroi|molo|molweni|sannu|sannu\s*da|sannu\s*da\s*zuwa|sannu\s*da\s*zuwa\s*da|sannu\s*da\s*zuwa\s*da\s*zuwa)\b/i,

        // Slang and casual
        /^\s*(yo|sup|wassup|wazzup|hey\s*you|hi\s*you|hello\s*you|hiya|howdy|hey\s*hi|hi\s*hey|hey\s*ho|hi\s*ho|hey\s*now|hi\s*now|hey\s*you|hi\s*you|hey\s*everyone|hi\s*everyone|hey\s*all|hi\s*all|hey\s*guys|hi\s*guys|hey\s*folks|hi\s*folks|hey\s*people|hi\s*people|hey\s*everybody|hi\s*everybody|hey\s*y'|hi\s*y'|hey\s*ya|hi\s*ya|hey\s*ya'll|hi\s*ya'll)\b/i,

        // Formal and professional
        /^\s*(greetings|salutations|good\s*day|good\s*evening|good\s*morning|good\s*afternoon|good\s*night|dear\s*(sir|madam)|to\s*whom\s*it\s*may\s*concern|dear\s*(all|everyone|team|colleagues)|hello\s*there|hi\s*there|hey\s*there|hello\s*everyone|hello\s*all|hello\s*team|hello\s*guys|hello\s*folks|hello\s*people|hello\s*everybody|hello\s*everyone|hello\s*y'|hello\s*ya|hello\s*ya'll)\b/i,

        // Playful and creative
        /^\s*(ahoy|ahoy\s*there|ahoy\s*matey|ahoy\s*cap['’]?n|ahoy\s*hoy|ahoy\s*me\s*hearties|ahoy\s*me\s*hearties\s*yo\s*ho|ahoy\s*me\s*hearties\s*yo\s*ho\s*ho|ahoy\s*me\s*hearties\s*yo\s*ho\s*ho\s*and\s*a\s*bottle\s*of\s*rum|greetings\s*earthling|greetings\s*human|greetings\s*mortals|greetings\s*traveler|salutations\s*earthling|salutations\s*human|salutations\s*mortals|salutations\s*traveler)\b/i,

        // Sci-fi and fantasy
        /^\s*(live\s*long\s*and\s*prosper|peace\s*and\s*long\s*life|may\s*the\s*force\s*be\s*with\s*you|may\s*the\s*odds\s*be\s*ever\s*in\s*your\s*favor|by\s*the\s*power\s*of\s*grayskull|by\s*the\s*holy\s*light|by\s*the\s*ancient\s*power|by\s*the\s*power\s*of\s*the\s*moons|by\s*the\s*power\s*of\s*the\s*stars|by\s*the\s*power\s*of\s*the\s*void|by\s*the\s*power\s*of\s*the\s*cosmos|by\s*the\s*power\s*of\s*the\s*universe)\b/i,
    ];

    // News inquiry patterns - optimized to avoid duplicates and false positives
    const newsPatterns = [
        // Pattern 1: Direct questions starting with question words/phrases
        /^(what'?s|what is|what are|what was|what were|what'?s the|what is the|what are the|what was the|what were the|who|when|where|why|how|tell me|update me|inform me)\s+(me\s+)?(about\s+)?(the\s+)?(latest|recent|new|current|upcoming|happening|happened|going on|rumor|rumour|gossip|scandal|news|updates|info|information|story|stories|scoop|buzz|hype|word|talk|chatter|whisper|report|reports|bulletin|headline|headlines|scuttlebutt|tidbits?|happenings|developments|events?|occurrences?|incidents?)\b/i,

        // Pattern 2: Questions with helping verbs at the start
        /^(have you|do you|can you|could you|would you|will you|is there|are there|was there|were there|any|some|got)\s+(news|updates|gossip|rumors?|rumours?|scandals?|info|information|stories|scoops?|buzz|hype|word|talk|chatter|whispers?|reports?|bulletins?|headlines?|scuttlebutt|tidbits?|happenings?|developments?|events?|occurrences?|incidents?)\b/i,

        // Pattern 3: General news inquiries with action verbs
        /\b(hear|heard|know|tell|update|inform|give)\s+(me\s+)?(about|what'?s|what is|what are|what was|what were|the (latest|recent|new|current|updating|happening|happened|going on|rumor|rumour|gossip|scandal|news|updates|info|information|story|stories|scoop|buzz|hype|word|talk|chatter|whisper|report|reports|bulletin|headline|headlines|scuttlebutt|tidbits?|happenings|developments|events?|occurrences?|incidents?))\b/i,

        // Pattern 4: Standalone news keywords followed by a question mark (end of string)
        /\b(news|update|happening|happened|going on|rumor?|rumour?|gossip|scandal|info(?:rmation)?|stor(?:y|ies)|scoop|buzz|hype|word|talk|chatter|whisper|reports?|bulletin|headlines?|scuttlebutt|tidbits?|happenings?|developments?|events?|occurrences?|incidents?)\s*\?\s*$/i,
    ];

    // Swear word patterns with common character substitutions for NPC reactions
    const swearPatterns = [
        // Common profanity with variations
        /\b(f+[*!u]+[*!c]+[*!k]+[*!e]*[*!r]*s*)\b/gi, // f***, f***s, etc.
        /\b(s+[*!h]+[*!i]+[*!t]+s*)\b/gi, // sh**, etc.
        /\b(b+[*!i]+[*!t]+[*!c]*[*!h]*e*[*!s]*)\b/gi, // b****, etc.
        /\b(a+[*!s]+[*!s]+(?:e[ds]|h+o+[*!l]*e*)?)\b/gi, // a**, a**hole, etc.
        /\b(d+[*!a]+m+[*!n]*)\b/gi, // d**n, etc.
        /\b(p+[*!i]+s+[*!s]*)\b/gi, // p**s, etc.
        /\b(c+[*!u]+n+[*!t]*)\b/gi, // c**t, etc.
        /\b(w+[*!h]+o+[*!r]*e*)\b/gi, // wh**e, etc.
        /\b(s+[*!l]+u+[*!t]*s*)\b/gi, // sl*t, etc.
        /\b(c+[*!o]+c+[*!k]*s*)\b/gi, // c**k, etc.

        // Common phrases
        /\b(go to hell|fuck off|piss off|screw you|eat shit|suck my|suck it|motherfuck|son of a bitch|dick head|ass hole|ass face|ass wipe|ass hat|dumb ass|smart ass|jack ass|ass clown|ass kiss|ass wipe|ass munch|ass hat|ass clown|ass kiss|ass munch|ass hat|ass clown|ass kiss|ass munch)\b/gi,

        // Creative spellings and leetspeak
        /\b([fph]4[$s]?[s5]|[fph]4gg[o0]t|n[1i]gg[3e]r|n[1i][b8]b?[a4]|r[e3]t[a4]rd|d1ck|p[0o]rn|pr0n|w[0o]p|k[i1]k[3e]|j[1i]gg?[a4]b[0o][0o]|m[0o]th[3e]rf[*!u]ck[3e]r)\b/gi,
    ];

    // Check patterns in order of priority
    // 1. Swear words (highest priority)
    if (swearPatterns.some((pattern) => pattern.test(lowerMessage))) {
        return 'swear';
    }

    // 2. News inquiries (medium priority)
    if (newsPatterns.some((pattern) => pattern.test(lowerMessage))) {
        return 'news';
    }

    // 3. Greetings (lowest priority)
    if (greetingPatterns.some((pattern) => pattern.test(lowerMessage))) {
        return 'greeting';
    }

    // Default to casual if no other type matches
    return 'casual';
};

const { traders = [] } = tradersData;

const AIBadge = ({ tier }) => {
    const getTierName = (tier) => {
        return tier.charAt(0).toUpperCase() + tier.slice(1);
    };

    return (
        <span className="ai-tier-badge" data-tier={tier}>
            {getTierName(tier)}
        </span>
    );
};

const ChatBox = ({ statusEffects }) => {
    const [activeTier, setActiveTier] = useState('all');
    const [showTierSelector, setShowTierSelector] = useState(false);
    const [casualMessages, setCasualMessages] = useState([]);
    const { aiTier, aiLevel } = useAILevel();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    // Active traders state removed as it wasn't being used
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
    const containerRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize chat visibility based on AI level
    useEffect(() => {
        setIsOpen(aiLevel >= 1000);
    }, [aiLevel]);

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

                // Get available tiers based on AI level
                const availableTiers = ['low', 'medium', 'high'].slice(
                    0,
                    ['low', 'medium', 'high'].indexOf(aiTier) + 1
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
    }, [aiTier, isInitialized]);

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
                            ['low', 'medium', 'high'].indexOf(aiTier)
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
        const message = inputMessage.trim();
        if (!message) return;

        // Add player's message to chat
        const newMessage = {
            id: Date.now(),
            message: { EN: message },
            sender: 'You',
            isPlayer: true,
            tier: aiTier,
            timestamp: Date.now(),
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setInputMessage('');

        // Process the message and generate a response
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

            // Determine message type based on content
            const messageType = getMessageType(message);
            console.log(`Message type: ${messageType}`);

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
                <div className="header-content clickable" onClick={() => setIsOpen(!isOpen)}>
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
                                    {msg.senderTier && <AIBadge tier={msg.senderTier} />}
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
