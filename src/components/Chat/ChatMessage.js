import React from 'react';
import './ChatMessage.scss';

const ChatMessage = ({ message, sender, isPlayer, statusEffects }) => {
    const getTranslatedMessage = (msg) => {
        if (!msg || typeof msg !== 'object') return msg;

        // If it's a language object, handle translation based on status effects
        if (msg.EN) {
            const hasCHIK = statusEffects?.['Auto Translator CHIK']?.active;
            const hasLAY = statusEffects?.['Auto Translator LAY']?.active;

            if (msg.EN) return msg.EN;
            if (hasCHIK && msg.CHIK) return msg.CHIK;
            if (hasLAY && msg.LAY) return msg.LAY;

            // Return first available language if no translation available
            return Object.values(msg)[0] || '???? ??? ??????? ?? ??? ????????? ???? ?????';
        }

        return msg;
    };

    return (
        <div className="chat-message">
            <div className="message-content">{getTranslatedMessage(message)}</div>
        </div>
    );
};

export default ChatMessage;
