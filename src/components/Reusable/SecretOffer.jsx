import React, { useState, useEffect } from 'react';
import './SecretOffer.scss';

const SECRET_PERSONAS = [
    {
        name: 'The Broker',
        avatar: null, // Add avatar path if available
        message:
            'Psst... Interested in expanding your business? I can get you access to a market few know exists.',
    },
    {
        name: 'Madame Nyx',
        avatar: null,
        message: 'I see potential in you, trader. The Red Market awaits, if you dare.',
    },
    {
        name: 'Cipher',
        avatar: null,
        message: 'I deal in secrets and shadows. Want in on a little extra profit?',
    },
    {
        name: 'Doctor Vex',
        avatar: null,
        message: 'I have wares that heal and harm. The choice is yours, if you accept my offer.',
    },
    {
        name: 'The Smuggler',
        avatar: null,
        message: 'Not everything is on the up-and-up. Want to see what the real market looks like?',
    },
];

const getRandomPersona = () => SECRET_PERSONAS[Math.floor(Math.random() * SECRET_PERSONAS.length)];

const SecretOffer = ({ show, onResult }) => {
    const [persona, setPersona] = useState(getRandomPersona());

    useEffect(() => {
        if (show) setPersona(getRandomPersona());
    }, [show]);

    if (!show) return null;

    return (
        <div className="secret-offer-overlay">
            <div className="secret-offer-modal">
                <div className="secret-offer-header">
                    <div className="secret-offer-avatar">
                        {persona.avatar ? (
                            <img src={persona.avatar} alt={persona.name} />
                        ) : (
                            <span className="avatar-placeholder">?</span>
                        )}
                    </div>
                    <div className="secret-offer-title">{persona.name}</div>
                </div>
                <div className="secret-offer-message">{persona.message}</div>
                <div className="secret-offer-actions">
                    <button className="accept" onClick={() => onResult('accept')}>
                        Accept
                    </button>
                    <button className="decline" onClick={() => onResult('decline')}>
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecretOffer;
