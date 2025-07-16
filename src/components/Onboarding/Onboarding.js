import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
    const [maskStyle, setMaskStyle] = useState({});
    const [cutout, setCutout] = useState({ left: 0, top: 0, width: 0, height: 0 });
    const overlayRef = useRef(null);
    const [overlayHidden, setOverlayHidden] = useState(false);

    const onboardingSteps = useMemo(
        () => [
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
                content:
                    'Right-click on the item in the market to sell it back for a profit or loss.',
                arrow: 'right',
                validate: () =>
                    completedActions.buyFirstQBit &&
                    sellCount >= 1 &&
                    !completedActions.sellFirstQBit,
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
                    "<p>Other traders in the galaxy have powerful <strong>Quantum Processors</strong> with self-improving AI trading algorithms which increase market volatility.</p> <p>This results in <strong>AI Level</strong> decay over time because older hardware simply can't keep up.</p> <p>To see trade opportunities more easily you'll want to increase and maintain your <strong>AI Level</strong> by buying and using as much tech as you can afford.</p>",
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
        ],
        [buyCount, useCount, sellCount, completedActions]
    );

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
        // Track sells - increment sellCount on every decrement
        if (currentQty < prevQty) {
            if (completedActions.buyFirstQBit && !completedActions.sellFirstQBit) {
                setSellCount((prev) => prev + (prevQty - currentQty));
            }
        }
        // If user is on or past step 3 and has no QBits left to use, reset to buy step
        if (step >= 3 && (!item || item.quantity === 0) && !completedActions.useFirstQBit) {
            setStep(2); // Go to buy second QBit step
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

    // Hide overlay on Next/Previous trader, re-show on final step
    useEffect(() => {
        if (!showOnboarding) return;
        // Handler for trader navigation
        const handleTraderNav = (e) => {
            if (e.target.closest('.btn--travel__next') || e.target.closest('.btn--travel__prev')) {
                setOverlayHidden(true);
            }
        };
        // Handler for next galaxy on final step
        const handleNextGalaxy = (e) => {
            if (step === 6 && e.target.closest('.next-galaxy-button')) {
                if (onboardingSteps[step].onAction) onboardingSteps[step].onAction();
                setShowOnboarding(false);
            }
        };
        document.addEventListener('click', handleTraderNav, true);
        document.addEventListener('click', handleNextGalaxy, true);
        return () => {
            document.removeEventListener('click', handleTraderNav, true);
            document.removeEventListener('click', handleNextGalaxy, true);
        };
    }, [showOnboarding, step, onboardingSteps, setShowOnboarding]);

    // Re-show overlay when on final step
    useEffect(() => {
        if (step === 6) {
            setOverlayHidden(false);
        }
    }, [step]);

    // Re-show overlay after travel when on step 5 (Travel Between Traders)
    useEffect(() => {
        let intervalId;
        if (overlayHidden && step === 5) {
            intervalId = setInterval(() => {
                if (document.querySelector('.btn--travel__next')) {
                    setOverlayHidden(false);
                    clearInterval(intervalId);
                }
            }, 200);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [overlayHidden, step]);

    // Listen for Next Trader button click on step 5 (Travel Between Traders) and advance onboarding
    useEffect(() => {
        if (step !== 5) return;
        const handleNextTraderClick = (e) => {
            if (e.target.closest('.btn--travel__next')) {
                setOverlayHidden(true); // Hide overlay during travel
                if (onboardingSteps[step].onAction) onboardingSteps[step].onAction();
                // Step advancement will occur after overlay is shown again
            }
        };
        document.addEventListener('click', handleNextTraderClick, true);
        return () => {
            document.removeEventListener('click', handleNextTraderClick, true);
        };
    }, [step, onboardingSteps]);

    // After travel, when overlay is shown again, advance to the final step
    useEffect(() => {
        let intervalId;
        if (overlayHidden && step === 5) {
            intervalId = setInterval(() => {
                if (document.querySelector('.btn--travel__next')) {
                    setOverlayHidden(false);
                    clearInterval(intervalId);
                    setTimeout(() => {
                        setStep(step + 1);
                    }, 0);
                }
            }, 200);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [overlayHidden, step]);

    // Helper to get the current target element
    const getTargetRect = () => {
        const el = document.querySelector(currentStepData?.target);
        if (!el) return null;
        return el.getBoundingClientRect();
    };

    // Update cutout on step, scroll, resize, or onboarding visibility
    useEffect(() => {
        if (!showOnboarding || !currentStepData) {
            setCutout({ left: 0, top: 0, width: 0, height: 0 });
            return;
        }
        const updateCutout = () => {
            const rect = getTargetRect();
            if (!rect) {
                setCutout({ left: 0, top: 0, width: 0, height: 0 });
                return;
            }
            const padding = 12;
            setCutout({
                left: Math.max(rect.left - padding, 0),
                top: Math.max(rect.top - padding, 0),
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
            });
        };
        updateCutout();
        window.addEventListener('scroll', updateCutout, true);
        window.addEventListener('resize', updateCutout);
        return () => {
            window.removeEventListener('scroll', updateCutout, true);
            window.removeEventListener('resize', updateCutout);
        };
        // eslint-disable-next-line
    }, [step, showOnboarding, currentStepData]);

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

    // Hide overlay if overlayHidden is true
    if (overlayHidden) {
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
                top = targetRect.top - boxWidth + 110;
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

    // SVG mask dimensions
    const svgWidth = window.innerWidth;
    const svgHeight = window.innerHeight;

    return (
        <div
            className="onboarding-overlay"
            ref={overlayRef}
            style={{
                background: 'transparent',
                pointerEvents: 'none', // allow clicks to pass through overlay
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 10000,
            }}
        >
            <svg
                width={svgWidth}
                height={svgHeight}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    pointerEvents: 'none', // ensure SVG does not block clicks
                    zIndex: 10001,
                }}
            >
                <defs>
                    <mask id="onboarding-mask">
                        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="white" />
                        <rect
                            x={cutout.left}
                            y={cutout.top}
                            width={cutout.width}
                            height={cutout.height}
                            rx={16}
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width={svgWidth}
                    height={svgHeight}
                    fill="rgba(0,0,0,0.7)"
                    mask="url(#onboarding-mask)"
                />
            </svg>
            <div
                className="onboarding-box"
                style={{ ...style, zIndex: 10002, position: 'fixed', pointerEvents: 'auto' }}
            >
                <div
                    className={`onboarding-arrow ${
                        currentStepData.arrow ? `arrow arrow-${currentStepData.arrow}` : ''
                    }`}
                />
                <div className="onboarding-content">
                    <h4>{currentStepData.title}</h4>
                    <p dangerouslySetInnerHTML={{ __html: currentStepData.content }} />
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
