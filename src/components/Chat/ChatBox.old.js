import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAILevel } from '../context/AILevelContext';
import ChatMessage from './ChatMessage';
import tradersData from '../data/traders.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChevronDown, 
    faPaperPlane, 
    faRobot, 
    faUserAstronaut,
    faCog,
    faTimes,
    faCheck,
    faExclamationTriangle,
    faInfoCircle,
    faComments
} from '@fortawesome/free-solid-svg-icons';
import './ChatBox.scss';

const { traders = [] } = tradersData || {};

// Default messages if none are provided
const DEFAULT_MESSAGES = [
    {
        id: 'welcome-1',
        sender: 'System',
        message: 'Welcome to the Galactic Trade Network',
        timestamp: new Date().toISOString(),
        type: 'system'
    },
    {
        id: 'welcome-2',
        sender: 'System',
        message: 'Connecting to network nodes...',
        timestamp: new Date(Date.now() + 1000).toISOString(),
        type: 'system'
    },
    {
        id: 'welcome-3',
        sender: 'System',
        message: 'Authentication successful. Secure channel established.',
        timestamp: new Date(Date.now() + 2000).toISOString(),
        type: 'success'
    }
];

const AIBadge = ({ tier }) => {
    const getTierColor = () => {
        const colors = {
            zero: '#888',
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
        return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : '';
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

        return {
            ...baseStyle,
            backgroundColor: tierColor,
            border: `1px solid ${tierColor}`,
        };
    };

    if (!tier) return null;

    return (
        <span className="ai-badge" style={getTierStyle()}>
            {getTierName(tier)}
        </span>
    );
};

AIBadge.propTypes = {
    tier: PropTypes.string,
};
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
        <span className="ai-tier-badge" style={getTierStyle()}>
            {getTierName(tier)}
        </span>
    );
};

const ChatBox = ({ 
    statusEffects = {},
    aiTier = 1,
    onSendMessage,
    messages: externalMessages,
    activeTraders = [],
    isConnected = true,
    isTyping = false,
    onTyping,
    onTraderSelect,
    onClearChat,
    onToggleSettings,
    className = ''
}) => {
    // State
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const [messages, setMessages] = useState(externalMessages || DEFAULT_MESSAGES);
    const [showSettings, setShowSettings] = useState(false);
    const [showTradersMenu, setShowTradersMenu] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Get AI context
    const { theme, toggleTheme } = useAILevel();
    
    // State for tier filtering
    const [activeTier, setActiveTier] = useState('all');
    const [showTierSelector, setShowTierSelector] = useState(false);
    const [casualMessages, setCasualMessages] = useState([]);
    const [tradeMessages, setTradeMessages] = useState([]);
    const [systemMessages, setSystemMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [showMessageMenu, setShowMessageMenu] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollTimeout, setScrollTimeout] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartY, setDragStartY] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Handle external messages update
    useEffect(() => {
        if (externalMessages && externalMessages.length > 0) {
            setMessages(externalMessages);
        }
    }, [externalMessages]);
    
    // Auto-scroll to bottom when new messages arrive and user is at bottom
    useEffect(() => {
        if (isAtBottom && messagesEndRef.current) {
            scrollToBottom();
        }
        
        // Update unread count when closed and new messages arrive
        if (!isOpen && messages.length > 0) {
            setUnreadCount(prev => prev + 1);
        }
    }, [messages, isOpen]);
    
    // Handle scroll events
    const handleScroll = useCallback(() => {
        if (!messagesContainerRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const threshold = 50; // pixels from bottom
        const isNearBottom = scrollHeight - (scrollTop + clientHeight) < threshold;
        
        setIsAtBottom(isNearBottom);
        
        // Mark messages as read when scrolling through them
        if (isNearBottom && unreadCount > 0) {
            setUnreadCount(0);
        }
    }, [unreadCount]);
    
    // Scroll to bottom of messages
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    }, []);
    
    // Toggle chat window
    const toggleChat = useCallback(() => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        
        if (newIsOpen && unreadCount > 0) {
            setUnreadCount(0);
        }
        
        // Focus input when opening
        if (newIsOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, unreadCount]);
    
    // Handle input change
    const handleInputChange = useCallback((e) => {
        setInputValue(e.target.value);
        if (onTyping) {
            onTyping(e.target.value.length > 0);
        }
    }, [onTyping]);
    
    // Handle send message
    const handleSendMessage = useCallback((e) => {
        e.preventDefault();
        
        const trimmedValue = inputValue.trim();
        if (!trimmedValue) return;
        
        // Create new message
        const newMessage = {
            id: `msg-${Date.now()}`,
            sender: 'You',
            message: trimmedValue,
            timestamp: new Date().toISOString(),
            isPlayer: true,
            status: 'sent'
        };
        
        // Update local state
        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        
        // Call external handler if provided
        if (onSendMessage) {
            onSendMessage(trimmedValue, (response) => {
                // Handle response from parent
                if (response) {
                    setMessages(prev => [...prev, {
                        id: `resp-${Date.now()}`,
                        sender: response.sender || 'Trader',
                        message: response.message,
                        timestamp: new Date().toISOString(),
                        isPlayer: false,
                        status: 'delivered'
                    }]);
                }
            });
        }
        
        // Focus input after sending
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [inputValue, onSendMessage]);
    
    // Handle key down in input
    const handleKeyDown = useCallback((e) => {
        // Send message on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSendMessage(e);
        }
    }, [handleSendMessage]);
    
    // Render messages
    const renderMessages = useCallback(() => {
        if (!messages || messages.length === 0) {
            return (
                <div className="empty-state">
                    <FontAwesomeIcon icon={faInfoCircle} className="empty-icon" />
                    <p>No messages yet. Start a conversation!</p>
                </div>
            );
        }
        
        return messages.map((msg, index) => {
            const isPlayerMessage = msg.isPlayer || msg.sender.toLowerCase() === 'you';
            const messageType = msg.type || 'normal';
            
            return (
                <ChatMessage
                    key={msg.id || `msg-${index}`}
                    message={msg.message}
                    sender={msg.sender}
                    isPlayer={isPlayerMessage}
                    statusEffects={statusEffects}
                    timestamp={msg.timestamp}
                    status={msg.status}
                    type={messageType}
                    aiTier={aiTier}
                    data-index={index}
                    style={{
                        '--animation-delay': `${index * 50}ms`
                    }}
                />
            );
        });
    }, [messages, statusEffects, aiTier]);
    
    // Render trader list
    const renderTradersMenu = useCallback(() => {
        if (!showTradersMenu || !activeTraders || activeTraders.length === 0) return null;
        
        return (
            <div className="traders-dropdown">
                <div className="dropdown-header">
                    <span>Active Traders</span>
                    <button 
                        className="close-button"
                        onClick={() => setShowTradersMenu(false)}
                        aria-label="Close traders list"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="traders-list">
                    {activeTraders.map((trader, index) => (
                        <button
                            key={trader.id || `trader-${index}`}
                            className={`trader-item ${trader.isActive ? 'active' : ''}`}
                            onClick={() => {
                                if (onTraderSelect) {
                                    onTraderSelect(trader);
                                }
                                setShowTradersMenu(false);
                            }}
                        >
                            <span className="trader-icon">
                                <FontAwesomeIcon icon={trader.isBot ? faRobot : faUserAstronaut} />
                            </span>
                            <span className="trader-name">{trader.name}</span>
                            {trader.unread > 0 && (
                                <span className="unread-badge">{trader.unread}</span>
                            )}
                            {trader.isTyping && (
                                <span className="typing-indicator">typing...</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    }, [showTradersMenu, activeTraders, onTraderSelect]);
    
    // Render settings panel
    const renderSettings = useCallback(() => {
        if (!showSettings) return null;
        
        return (
            <div className="settings-panel">
                <div className="settings-header">
                    <h4>Chat Settings</h4>
                    <button 
                        className="close-button"
                        onClick={() => setShowSettings(false)}
                        aria-label="Close settings"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="settings-content">
                    <div className="setting-item">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={isOpen}
                                onChange={() => setIsOpen(!isOpen)}
                            />
                            <span>Show chat window</span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={theme === 'dark'}
                                onChange={toggleTheme}
                            />
                            <span>Dark Mode</span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <button 
                            className="clear-chat-button"
                            onClick={() => {
                                if (onClearChat) {
                                    onClearChat();
                                } else {
                                    setMessages(DEFAULT_MESSAGES);
                                }
                                setShowSettings(false);
                            }}
                        >
                            Clear Chat History
                        </button>
                    </div>
                </div>
            </div>
        );
    }, [showSettings, theme, toggleTheme, isOpen, onClearChat]);
    
    // Connection status indicator
    const renderConnectionStatus = useCallback(() => {
        if (isConnected) {
            return (
                <span className="connection-status connected" title="Connected">
                    <FontAwesomeIcon icon={faCheck} />
                    {aiTier >= 2 && <span>Connected</span>}
                </span>
            );
        }
        
        return (
            <span className="connection-status disconnected" title="Disconnected">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                {aiTier >= 2 && <span>Disconnected</span>}
            </span>
        );
    }, [isConnected, aiTier]);
    
    // Render typing indicator
    const renderTypingIndicator = useCallback(() => {
        if (!isTyping) return null;
        
        return (
            <div className="typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                {aiTier >= 2 && <span className="text">typing...</span>}
            </div>
        );
    }, [isTyping, aiTier]);
    
    // Render unread badge
    const renderUnreadBadge = useCallback(() => {
        if (unreadCount <= 0 || isOpen) return null;
        
        return (
            <span className="unread-badge">
                {Math.min(unreadCount, 99)}
            </span>
        );
    }, [unreadCount, isOpen]);
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
                        timestamp: Date.now()
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
        if (!inputMessage.trim()) return;

        const newMessage = {
            id: Date.now(),
            message: { EN: inputMessage },
            sender: 'You',
            isPlayer: true,
            tier: aiTier,
            timestamp: Date.now()
        };

        // Use functional update to ensure we have the latest state
        setMessages(prevMessages => {
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
                    setMessages(prevMessages => {
                        const traderMessage = {
                            id: Date.now(),
                            message: response,
                            sender: randomTrader.name || 'Unknown Trader',
                            isPlayer: false,
                            tier: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                            timestamp: Date.now()
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

    return (
        <div 
            className={`chat-container ${className} ai-tier-${aiTier} ${isOpen ? 'open' : 'closed'}`}
            data-ai-tier={aiTier}
        >
            {/* Chat Header */}
            <div 
                className="chat-header"
                onClick={toggleChat}
                aria-expanded={isOpen}
                role="button"
                tabIndex="0"
            >
                <div className="header-left">
                    <h3>
                        <FontAwesomeIcon icon={faComments} className="header-icon" />
                        Galactic Chat
                    </h3>
                    {renderConnectionStatus()}
                    {renderUnreadBadge()}
                </div>
                
                <div className="header-actions">
                    {activeTraders && activeTraders.length > 0 && (
                        <button 
                            className="traders-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTradersMenu(!showTradersMenu);
                                setShowSettings(false);
                            }}
                            aria-label="Show traders"
                            title="Active traders"
                        >
                            <FontAwesomeIcon icon={faUserAstronaut} />
                            {aiTier >= 2 && (
                                <span className="traders-count">
                                    {activeTraders.length}
                                </span>
                            )}
                        </button>
                    )}
                    
                    <button 
                        className="settings-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSettings(!showSettings);
                            setShowTradersMenu(false);
                        }}
                        aria-label="Settings"
                        title="Settings"
                    >
                        <FontAwesomeIcon icon={faCog} />
                    </button>
                    
                    <button 
                        className="toggle-button"
                        onClick={toggleChat}
                        aria-label={isOpen ? 'Minimize chat' : 'Maximize chat'}
                    >
                        <FontAwesomeIcon 
                            icon={faChevronDown} 
                            className={`toggle-icon ${isOpen ? 'open' : ''}`} 
                        />
                    </button>
                </div>
                
                {renderTradersMenu()}
                {renderSettings()}
            </div>
            
            {/* Messages Container */}
            <div 
                className="messages-container"
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                <div className="messages-content">
                    {renderMessages()}
                    {renderTypingIndicator()}
                    <div ref={messagesEndRef} className="messages-end" />
                </div>
            </div>
            
            {/* Input Area */}
            <form className="chat-input-container" onSubmit={handleSendMessage}>
                <div className="input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={!isConnected}
                        aria-label="Type your message"
                    />
                    <button 
                        type="submit" 
                        className="send-button"
                        disabled={!inputValue.trim() || !isConnected}
                        aria-label="Send message"
                    >
                        {aiTier >= 2 ? 'Send' : ''}
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
                
                {aiTier >= 2 && (
                    <div className="input-actions">
                        <span className="character-count">
                            {inputValue.length}/500
                        </span>
                        {!isConnected && (
                            <span className="connection-warning">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                Connection lost. Reconnecting...
                            </span>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

ChatBox.propTypes = {
    /** The current AI tier (1-3) that determines visual enhancements */
    aiTier: PropTypes.oneOf([1, 2, 3]),
    /** Callback when a message is sent */
    onSendMessage: PropTypes.func,
    /** Array of message objects to display */
    messages: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        sender: PropTypes.string.isRequired,
        message: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                EN: PropTypes.string,
                CHIK: PropTypes.string,
                LAY: PropTypes.string
            })
        ]).isRequired,
        timestamp: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.instanceOf(Date),
            PropTypes.number
        ]),
        isPlayer: PropTypes.bool,
        status: PropTypes.oneOf(['sending', 'sent', 'delivered', 'read', 'error']),
        type: PropTypes.oneOf(['normal', 'system', 'error', 'success', 'warning'])
    })),
    /** Array of active traders */
    activeTraders: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        isBot: PropTypes.bool,
        isActive: PropTypes.bool,
        unread: PropTypes.number,
        isTyping: PropTypes.bool
    })),
    /** Whether the chat is connected to the server */
    isConnected: PropTypes.bool,
    /** Whether the other party is typing */
    isTyping: PropTypes.bool,
    /** Callback when the user starts/stops typing */
    onTyping: PropTypes.func,
    /** Callback when a trader is selected */
    onTraderSelect: PropTypes.func,
    /** Callback to clear the chat */
    onClearChat: PropTypes.func,
    /** Callback when settings are toggled */
    onToggleSettings: PropTypes.func,
    /** Additional CSS class name */
    className: PropTypes.string,
    /** Status effects that might affect message display */
    statusEffects: PropTypes.object
};

ChatBox.defaultProps = {
    aiTier: 1,
    messages: [],
    activeTraders: [],
    isConnected: true,
    isTyping: false,
    statusEffects: {}
};

export default ChatBox;
