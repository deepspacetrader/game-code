import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import breakingNews from '../data/breaking-news.json';

export const NewsContext = createContext();

export const NewsProvider = ({ children }) => {
    // News and events state
    const [activeNews, setActiveNews] = useState([]);
    const [seenNews, setSeenNews] = useState(new Set());
    const [globalDangerLevel, setGlobalDangerLevel] = useState(0);
    const [floatingMessages, setFloatingMessages] = useState([]);
    const [showEventPopup, setShowEventPopup] = useState(false);
    const [currentEvent, setCurrentEvent] = useState(null);

    // Memoize events list from the imported JSON
    const eventsList = useMemo(() => (breakingNews?.events || []).map((e) => e || {}), []);

    // Add a floating message
    const addFloatingMessage = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        const newMessage = { id, message, type };
        
        setFloatingMessages((prev) => [...prev, newMessage]);
        
        // Auto-remove the message after duration
        setTimeout(() => {
            setFloatingMessages((prev) => prev.filter((msg) => msg.id !== id));
        }, duration);
    }, []);

    // Add a news item
    const addNews = useCallback((newsItem) => {
        if (!newsItem || !newsItem.id) return;
        
        setSeenNews((prev) => {
            const updated = new Set(prev);
            updated.add(newsItem.id);
            return updated;
        });
        
        setActiveNews((prev) => {
            // Prevent duplicates
            if (prev.some(item => item.id === newsItem.id)) return prev;
            return [newsItem, ...prev].slice(0, 50); // Keep only the 50 most recent
        });
    }, []);

    // Clear all news
    const clearNews = useCallback(() => {
        setActiveNews([]);
    }, []);

    // Show an event popup
    const showEvent = useCallback((event) => {
        if (!event) return;
        
        setCurrentEvent(event);
        setShowEventPopup(true);
        
        // Auto-hide after 5 seconds if not already hidden
        setTimeout(() => {
            setShowEventPopup(false);
        }, 5000);
    }, []);

    // Hide the current event popup
    const hideEvent = useCallback(() => {
        setShowEventPopup(false);
    }, []);

    // Update global danger level
    const updateDangerLevel = useCallback((level) => {
        setGlobalDangerLevel((prev) => {
            // Ensure level is between 0 and 10
            const newLevel = Math.max(0, Math.min(10, level));
            return newLevel !== prev ? newLevel : prev;
        });
    }, []);

    // Get a random event
    const getRandomEvent = useCallback(() => {
        if (eventsList.length === 0) return null;
        return eventsList[Math.floor(Math.random() * eventsList.length)];
    }, [eventsList]);

    // Context value
    const value = useMemo(
        () => ({
            // State
            activeNews,
            seenNews,
            globalDangerLevel,
            floatingMessages,
            showEventPopup,
            currentEvent,
            eventsList,
            
            // Actions
            addNews,
            clearNews,
            addFloatingMessage,
            showEvent,
            hideEvent,
            updateDangerLevel,
            getRandomEvent,
            
            // Setters
            setActiveNews,
            setGlobalDangerLevel,
        }),
        [
            activeNews,
            seenNews,
            globalDangerLevel,
            floatingMessages,
            showEventPopup,
            currentEvent,
            eventsList,
            addNews,
            clearNews,
            addFloatingMessage,
            showEvent,
            hideEvent,
            updateDangerLevel,
            getRandomEvent,
        ]
    );

    return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
};

export const useNews = () => {
    const context = useContext(NewsContext);
    if (!context) {
        throw new Error('useNews must be used within a NewsProvider');
    }
    return context;
};

export default NewsContext;