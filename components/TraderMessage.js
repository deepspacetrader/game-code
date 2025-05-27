import React, { useState, useEffect } from 'react';
import traders from '../data/traders.json';

const TraderMessage = ({
    lastTrader,
    messageText,
    traderMessages,
    currentTrader,
    statusEffects,
    improvedUILevel,
}) => {
    const [visible, setVisible] = useState(false);
    const [clickedClose, setClickedClose] = useState(false);

    useEffect(() => {
        if (!messageText || !traderMessages || !currentTrader) {
            setVisible(false);
            return;
        }
        // Get trader config (known languages) by traderId
        const traderConfig = traders.traders.find((t) => t.traderId === currentTrader);
        if (!traderConfig) {
            setVisible(false);
            return;
        }

        // Find the trader message entry by traderId
        const traderMsg = traderMessages.find((tm) => tm.traderId === currentTrader);
        if (!traderMsg) {
            setVisible(false);
            return;
        }
        const greetings = traderMsg.greetings || {};
        const goodbyes = traderMsg.goodbyes || {};

        // Get the trader's known languages
        const availableLangs = traderConfig.languageRange || [];
        // Randomly select a language from that range

        // If player has translator for selected language, show English instead
        const hasCHIK = statusEffects['Auto Translator CHIK']?.active;
        const hasLAY = statusEffects['Auto Translator LAY']?.active;

        // Exclude 'EN' from random selection, but keep it in the data for translation
        const randomizableLangs = availableLangs.filter((l) => l !== 'EN');
        let lang =
            randomizableLangs.length > 0
                ? randomizableLangs[Math.floor(Math.random() * randomizableLangs.length)]
                : availableLangs.includes('EN')
                ? 'EN'
                : availableLangs[0] || '';
        let originalLang = lang;
        let displayLang = lang;

        // Unify language translation logic for both greetings and goodbyes
        const allLangs = new Set([...Object.keys(greetings || {}), ...Object.keys(goodbyes || {})]);
        if (allLangs.has('CHIK') || allLangs.has('LAY')) {
            if ((lang === 'CHIK' && hasCHIK) || (lang === 'LAY' && hasLAY)) {
                displayLang = 'EN'; // Show EN translation
                console.log('Translating to EN due to translator, originalLang:', originalLang);
            }
        }

        // Get the message array in the selected language (displayLang)
        // Use greetings or goodbyes depending on which contains the messageText
        let messageArr = greetings[displayLang];
        if (!messageArr || !messageArr.includes(messageText)) {
            messageArr = goodbyes[displayLang];
        }

        // Find the index of our current message in the array
        const messageIndex = messageArr ? messageArr.indexOf(messageText) : -1;
        if (messageIndex !== -1 && !clickedClose) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [messageText, traderMessages, currentTrader, statusEffects, clickedClose]);

    useEffect(() => {
        if (clickedClose) {
            setVisible(false);
            setClickedClose(true);
        }
    }, [clickedClose]);

    // determine tier style
    let tierClass = 'tier-low';
    if (improvedUILevel >= 25) tierClass = 'tier-medium';
    if (improvedUILevel >= 75) tierClass = 'tier-high';
    if (improvedUILevel >= 50) tierClass = 'tier-ultra';
    if (improvedUILevel >= 100) tierClass = 'tier-elite';

    return (
        !clickedClose && (
            <div
                className={`trader-message ${lastTrader ? 'goodbye' : 'greeting'}  ${tierClass}`}
                onClick={() => setClickedClose(true)}
            >
                <p>{messageText}</p>
            </div>
        )
    );
};
export default TraderMessage;
