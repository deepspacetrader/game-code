import React, { useEffect, useCallback } from 'react';
import './Danger.scss';

const SUCCESS_TITLES = ['SAFE!', 'MADE IT!', 'CLOSE ONE!', 'NARROW ESCAPE!', 'GOT AWAY!', 'CLEAR!'];

const DANGER_TYPES = {
    INDIRECT_FIRE: {
        title: 'INDIRECT FIRE!',
        message: 'A fight breaks out nearby and lasers are being fired! Take cover!',
        damageRange: [25, 50],
        duration: [3000, 4000], // Duration in milliseconds (3-4 seconds)
        successMessages: [
            'You dove out of the way just in time.',
            'You found some cover.',
            'You barely avoided the incoming fire.',
        ],
        failureMessage: 'You were struck by random weapon fire and took {damage} damage!',
    },
    EXPLOSION: {
        title: 'EXPLOSION!',
        message: 'A nearby explosion rocks the area! Choose a side to take cover!',
        damageRange: [30, 60],
        duration: [3500, 4500], // Duration in milliseconds (3.5-4.5 seconds)
        successMessages: [
            'You found cover just in time!',
            'The explosion rocks the area but you remain unharmed!',
            'Shrapnel almost hit you but you managed to avoid it.',
        ],
        failureMessage: 'A piece of shrapnel from blast struck you for {damage} damage!',
    },
    COLLAPSE: {
        title: 'COLLAPSE!',
        message: 'The structure is collapsing! Move to safety!',
        damageRange: [20, 40],
        duration: [2500, 3500], // Duration in milliseconds (2.5-3.5 seconds)
        successMessages: [
            'You barely made it to safety!',
            'The structure crumbles behind you as you escape!',
            'You manage to find stable ground just in time!',
        ],
        failureMessage: 'You were caught in the collapse and receive {damage} damage!',
    },
    // AMBUSH: {
    //     title: 'AMBUSH!',
    //     message: "You've been ambushed! Quick, choose a direction!",
    //     damageRange: [15, 35],
    //     duration: [3000, 4000], // Duration in milliseconds (3-4 seconds)
    //     successMessages: [
    //         'You evaded the ambush!',
    //         'You slip away from the attackers!',
    //         'Your quick reflexes saved you from the ambush!',
    //     ],
    //     failureMessage: 'The attackers got a hit in! Took {damage} damage!',
    // },
};

const Danger = ({ type = 'INDIRECT_FIRE', onChoice, onClose, onDamage, autoCloseDelay = 2000 }) => {
    const dangerType = DANGER_TYPES[type] || DANGER_TYPES.INDIRECT_FIRE;
    const [message, setMessage] = React.useState('');
    const [showChoices, setShowChoices] = React.useState(true);
    const [damageDealt, setDamageDealt] = React.useState(0);
    const [outcome, setOutcome] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState(0);
    const [maxTime, setMaxTime] = React.useState(0);
    const [isAutoChoosing, setIsAutoChoosing] = React.useState(false);
    const [successTitle, setSuccessTitle] = React.useState('');
    const animationFrameRef = React.useRef(null);
    const endTimeRef = React.useRef(0);
    const timerActiveRef = React.useRef(false);

    const handleChoice = useCallback(
        (choice, isAuto = false) => {
            // If already showing outcome, don't process another choice
            if (outcome) return;

            // Stop the timer
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            const isSuccess = Math.random() > 0.5; // 50% chance of success
            const damageRange = dangerType.damageRange;
            const damage = Math.floor(
                damageRange[0] + Math.random() * (damageRange[1] - damageRange[0])
            );
            const successMessage =
                dangerType.successMessages[
                    Math.floor(Math.random() * dangerType.successMessages.length)
                ];

            setShowChoices(false);

            if (isSuccess) {
                setOutcome('success');
                setMessage(successMessage);
                setSuccessTitle(SUCCESS_TITLES[Math.floor(Math.random() * SUCCESS_TITLES.length)]);
                setDamageDealt(0);
            } else {
                setOutcome('failure');
                setMessage(dangerType.failureMessage.replace('{damage}', damage.toString()));
                setDamageDealt(damage);
                if (onDamage) onDamage(damage);
            }
        },
        [dangerType, onDamage, onClose]
    );

    // Timer effect
    useEffect(() => {
        if (!showChoices) return;

        const [minDuration, maxDuration] = dangerType.duration;
        const duration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;

        setMaxTime(duration);
        setTimeLeft(duration);

        const startTime = Date.now();
        const endTime = startTime + duration;
        endTimeRef.current = endTime;

        let animationId;
        let lastUpdate = startTime;

        const updateTimer = () => {
            const now = Date.now();
            // Only update at most every 16ms (~60fps)
            if (now - lastUpdate < 16) {
                animationId = requestAnimationFrame(updateTimer);
                return;
            }
            lastUpdate = now;

            const remaining = Math.max(0, endTime - now);
            setTimeLeft(remaining);

            if (remaining <= 0) {
                // Time's up! Make an automatic choice
                const choices = ['left', 'right'];
                const randomChoice = choices[Math.floor(Math.random() * choices.length)];
                handleChoice(randomChoice, true);
                return;
            }

            animationId = requestAnimationFrame(updateTimer);
        };

        // Start the animation
        animationId = requestAnimationFrame(updateTimer);

        // Cleanup
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [showChoices, dangerType.duration]); // Removed handleChoice from deps

    // Calculate progress (1 to 0) for the timer with easing for smoother animation
    const progress = React.useMemo(() => {
        if (maxTime === 0) return 1;
        // Use a simple ease-out function for smoother deceleration
        const rawProgress = timeLeft / maxTime;
        return Math.pow(rawProgress, 0.9); // Slight ease-out effect
    }, [timeLeft, maxTime]);

    return (
        <div
            className={`danger-overlay ${outcome === 'success' ? 'success' : ''}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`danger-content ${outcome || ''}`}>
                <div className="danger-title">
                    {outcome === 'success' ? successTitle : dangerType.title}
                </div>
                {!showChoices ? (
                    <div className="danger-message">{message}</div>
                ) : (
                    <div className="danger-message">{dangerType.message}</div>
                )}
                {showChoices && (
                    <div className="danger-timer">
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar left"
                                style={{
                                    transform: `scaleX(${1 - progress})`,
                                    backgroundColor: '#ff0000',
                                }}
                            />
                            <div
                                className="progress-bar right"
                                style={{
                                    transform: `scaleX(${1 - progress})`,
                                    backgroundColor: '#ff0000',
                                }}
                            />
                        </div>
                    </div>
                )}
                {showChoices ? (
                    <div className="danger-choices">
                        <button className="danger-choice left" onClick={() => handleChoice('left')}>
                            LEFT
                        </button>
                        <button
                            className="danger-choice right"
                            onClick={() => handleChoice('right')}
                        >
                            RIGHT
                        </button>
                    </div>
                ) : (
                    <div className="danger-outcome">
                        <button
                            className={`danger-close ${outcome}`}
                            onClick={() => {
                                if (onClose) onClose(outcome, damageDealt);
                            }}
                        >
                            Continue
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export { Danger, DANGER_TYPES };
