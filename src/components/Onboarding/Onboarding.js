import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import './Onboarding.scss';
import { FaLock, FaLockOpen } from 'react-icons/fa';

export let onboardingUseQBit = null;
export let onboardingSellQBit = null;

const Onboarding = () => {
    const [step, setStep] = useState(0);
    const [completedActions, setCompletedActions] = useState({
        buyFirstQBit: false,
        sellFirstQBit: false,
        buySecondQBit: false,
        useFirstQBit: false,
        explainedAILevel: false,
        explainedTraderTravel: false,
        explainedGalaxyTravel: false,
    });
    const { inventory, showOnboarding, setShowOnboarding } = useMarketplace();
    const [buyCount, setBuyCount] = useState(0);
    const [useCount, setUseCount] = useState(0);
    const [sellCount, setSellCount] = useState(0);

    const prevQBitQty = useRef(0);
    const [skipLocked, setSkipLocked] = useState(true);
    const [skipHovered, setSkipHovered] = useState(false);

    const onboardingSteps = [
        {
            // STEP 1 - Buy First QBit
            target: '.market-item[data-item-id="1"]',
            title: 'Buying Items',
            content:
                'Click on the "Basic QBit Inverter" to buy it. This will add it to your inventory.',
            arrow: 'right',
            validate: () => buyCount >= 1 && !completedActions.buyFirstQBit,
            onAction: () => {
                setCompletedActions((prev) => ({ ...prev, buyFirstQBit: true }));
            },
        },
        {
            // STEP 2 - Sell First QBit
            target: '.market-item[data-item-id="1"]',
            title: 'Selling Items',
            content: 'Right-click on the item in the market to sell it back for a profit or loss.',
            arrow: 'right',
            validate: () =>
                completedActions.buyFirstQBit && sellCount >= 1 && !completedActions.sellFirstQBit,
            onAction: () => {
                setCompletedActions((prev) => ({ ...prev, sellFirstQBit: true }));
            },
        },
        {
            // STEP 3 - Buy Second QBit
            target: '.market-item[data-item-id="1"]',
            title: 'Buy Again',
            content: 'Buy another Basic QBit Inverter from the market.',
            arrow: 'right',
            validate: () =>
                completedActions.buyFirstQBit &&
                completedActions.sellFirstQBit &&
                buyCount >= 2 &&
                !completedActions.buySecondQBit,
            onAction: () => {
                setCompletedActions((prev) => ({ ...prev, buySecondQBit: true }));
            },
        },
        {
            // STEP 4 - Use QBit
            target: '.inv-item[data-item-id="1"] .use-buttons',
            title: 'Using Items',
            content:
                'Each item can be used to activate its effects or sold on the market for a profit.',
            arrow: 'left',
            validate: () =>
                completedActions.buyFirstQBit &&
                completedActions.sellFirstQBit &&
                completedActions.buySecondQBit &&
                useCount >= 1 &&
                !completedActions.useFirstQBit,
            onAction: () => {
                setCompletedActions((prev) => ({ ...prev, useFirstQBit: true }));
            },
        },
        {
            // Step 5 - AI Level Decay
            target: '.hud-item--ai-level',
            title: 'AI Level Decay',
            content:
                "Other traders in the galaxy have powerful Quantum Processors with self-improving AI trading algorithms. This is the main reason why market prices change so frequently and unpredictably. As a result your AI Level decays over time because the old hardware just can't keep up. To see trade opportunities more easily you'll want to increase and maintain your AI Level by buying and using as much tech as you can afford.",
            arrow: 'right',
            validate: () =>
                completedActions.buyFirstQBit &&
                completedActions.sellFirstQBit &&
                completedActions.buySecondQBit &&
                completedActions.useFirstQBit &&
                !completedActions.explainedAILevel,
            onAction: () => {
                setCompletedActions((prev) => ({ ...prev, explainedAILevel: true }));
            },
        },
        {
            // Step 6 - Travel Between Traders
            target: '.btn--travel__next',
            title: 'Travel Between Traders',
            content:
                'Traders offer different items so travel around the current galaxy to see what they have.',
            arrow: 'right',
            validate: () =>
                completedActions.buyFirstQBit &&
                completedActions.sellFirstQBit &&
                completedActions.buySecondQBit &&
                completedActions.useFirstQBit &&
                completedActions.explainedAILevel &&
                !completedActions.explainedTraderTravel,
            onAction: () => {
                setCompletedActions((prev) => ({ ...prev, explainedTraderTravel: true }));
            },
        },
        {
            // Step 7 - Travel Between Galaxies
            target: '.next-galaxy-button',
            title: 'Visit Another Galaxy',
            content:
                'Explore other galaxies to encounter more traders but be warned not everyone is friendly.',
            arrow: 'right',
            validate: () =>
                completedActions.buyFirstQBit &&
                completedActions.sellFirstQBit &&
                completedActions.buySecondQBit &&
                completedActions.useFirstQBit &&
                completedActions.explainedAILevel &&
                completedActions.explainedTraderTravel &&
                !completedActions.explainedGalaxyTravel,
            onAction: () => {
                setCompletedActions((prev) => ({ ...prev, explainedGalaxyTravel: true }));
            },
        },
    ];

    const currentStepData = onboardingSteps[step];

    // Check if the current step's validation condition is met
    const isStepCompleted = useCallback(() => {
        if (!currentStepData?.validate) return false;
        return currentStepData.validate();
    }, [currentStepData]);

    // Onboarding event handlers for use/sell actions
    const handleOnboardingUseQBit = () => {
        if (step === 3 && !completedActions.useFirstQBit) {
            setUseCount((prev) => prev + 1);
            setCompletedActions((prev) => ({ ...prev, useFirstQBit: true }));
            setTimeout(() => setStep(4), 0); // advance to step 5
        }
    };
    const handleOnboardingSellQBit = () => {
        // Always revert to step 1 if on step 2, regardless of completedActions state
        if (step === 1) {
            setStep(0);
            setCompletedActions((prev) => ({
                ...prev,
                buyFirstQBit: false,
                sellFirstQBit: false,
            }));
            setBuyCount(0);
            setSellCount(0);
        }
    };

    // Assign to exported variables for use in InventoryList.js
    onboardingUseQBit = handleOnboardingUseQBit;
    onboardingSellQBit = handleOnboardingSellQBit;

    useEffect(() => {
        // Track buy/sell counts for QBit (itemId 1)
        const item = inventory.find((i) => i.itemId === 1);
        const currentQty = item ? item.quantity : 0;
        const prevQty = prevQBitQty.current;

        // If quantity increased, increment buyCount
        if (currentQty > prevQty) {
            setBuyCount((prev) => prev + (currentQty - prevQty));
        }
        // Track sells - only when item quantity goes to 0 (complete sell)
        if (currentQty < prevQty && currentQty === 0) {
            if (completedActions.buyFirstQBit && !completedActions.sellFirstQBit) {
                setSellCount((prev) => prev + (prevQty - currentQty));
            }
        }
        prevQBitQty.current = currentQty;
        // eslint-disable-next-line
    }, [inventory]);

    useEffect(() => {
        if (!currentStepData) return;
        // Only proceed if step is not already completed
        if (
            completedActions[Object.keys(completedActions)[step]] &&
            step < onboardingSteps.length - 1
        )
            return;

        // Check if current step is completed
        const isCompleted = isStepCompleted();
        if (isCompleted) {
            setTimeout(() => {
                if (isStepCompleted()) {
                    currentStepData.onAction();
                    // Auto-advance for steps 0-3 only
                    if (step < 4) {
                        setTimeout(() => {
                            setStep(step + 1);
                        }, 200);
                    }
                    // For steps 4-6, require user to click Continue/Finish
                }
            }, 200);
        }
    }, [
        currentStepData,
        completedActions,
        isStepCompleted,
        inventory,
        step,
        onboardingSteps.length,
    ]);

    // Custom step advance for Continue/Finish Tutorial
    const handleContinue = () => {
        if (onboardingSteps[step].onAction) {
            onboardingSteps[step].onAction();
            setTimeout(() => {
                if (step < onboardingSteps.length - 1) {
                    setStep(step + 1);
                }
            }, 0); // next tick, after state update
        } else if (step < onboardingSteps.length - 1) {
            setStep(step + 1);
        }
    };
    const handleFinish = () => {
        if (onboardingSteps[step].onAction) onboardingSteps[step].onAction();
        setShowOnboarding(false);
    };
    const handleSkip = () => {
        if (skipLocked) {
            setSkipLocked(false);
        } else {
            setShowOnboarding(false);
        }
    };

    if (!showOnboarding || !currentStepData) {
        return null;
    }

    // Hide onboarding overlay if on step 3 (use step) and player has zero Basic QBiT Inverters
    if (
        step === 3 &&
        (!inventory.find((i) => i.itemId === 1) ||
            inventory.find((i) => i.itemId === 1).quantity === 0)
    ) {
        return null;
    }

    const targetElement = document.querySelector(currentStepData.target);

    const style = {
        position: 'fixed',
        zIndex: 1000,
        // Calculate box position based on target element and position/arrow settings
        ...(() => {
            const boxWidth = 300;
            const padding = 15;
            let top, left;

            // Get target element dimensions
            const targetRect = targetElement?.getBoundingClientRect() || {
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: 0,
                height: 0,
            };

            // Handle positioning for each step
            if (step === 0) {
                left = targetRect.left - boxWidth - padding;
                top = targetRect.top;
            } else if (step === 1) {
                left = targetRect.left - boxWidth - padding;
                top = targetRect.top;
            } else if (step === 2) {
                left = targetRect.left - boxWidth - padding;
                top = targetRect.top;
            } else if (step === 3) {
                left = targetRect.left + boxWidth / 2 - padding;
                top = targetRect.top - targetRect.height - padding * 3;
            } else if (step === 4) {
                // Position above and to the right of the AI Level HUD element
                left = targetRect.left - boxWidth + 30;
                top = targetRect.top - boxWidth / 2;
            } else if (step === 5) {
                // Position above and to the right of the AI Level HUD element
                left = targetRect.left - boxWidth - 20;
                top = targetRect.top - boxWidth / 5;
            } else if (step === 6) {
                // Position above and to the right of the AI Level HUD element
                left = targetRect.left - boxWidth - 20;
                top = targetRect.top - boxWidth / 4;
            }

            // Remove viewport constraints since we're using relative positioning
            return { top: `${top}px`, left: `${left}px` };
        })(),
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-box" style={style}>
                <div
                    className={`onboarding-arrow ${
                        currentStepData.arrow ? `arrow arrow-${currentStepData.arrow}` : ''
                    }`}
                />
                <div className="onboarding-content">
                    <h4>{currentStepData.title}</h4>
                    <p>{currentStepData.content}</p>
                </div>
                <div className="onboarding-footer">
                    <span>{`${step + 1} / ${onboardingSteps.length}`}</span>
                    {/* Show Skip Tutorial for steps 1-4, Continue for 5/6, Finish for last */}
                    {step === onboardingSteps.length - 1 ? (
                        <button onClick={handleFinish}>Finish Tutorial</button>
                    ) : step === 4 || step === 5 ? (
                        <button onClick={handleContinue}>Continue</button>
                    ) : step >= 0 && step < 4 ? (
                        <button
                            onClick={handleSkip}
                            onMouseEnter={() => setSkipHovered(true)}
                            onMouseLeave={() => setSkipHovered(false)}
                            style={{ position: 'relative', overflow: 'hidden' }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    marginRight: 6,
                                }}
                            >
                                {skipLocked && (skipHovered ? <FaLockOpen /> : <FaLock />)}
                            </span>
                            Skip Tutorial
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
