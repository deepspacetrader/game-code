import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback,
} from 'react';
import itemsData from '../data/items.json';
import tradersData from '../data/traders.json';
import galaxiesData from '../data/galaxies.json';
import traderMessagesData from '../data/trader-messages.json';
import { randomInt, shuffle, randomFloatRange } from '../utils/helpers';
import { useAILevel } from './AILevelContext';
import { zzfx } from 'zzfx';
import { MAX_FUEL } from '../utils/constants';
import { useQuantum } from './QuantumContext';
import { useNews } from './NewsContext';
import { useEventContext } from './EventContext';
const MarketplaceContext = createContext();

// Helper: Check for illegal items in inventory
function hasIllegalItem(inventory, items) {
    return inventory.some((item) => {
        const def = items.find((i) => i.name === item.name);
        return def && def.illegal;
    });
}

export const MarketplaceProvider = ({ children }) => {
    // Hooks and context
    const { setImprovedAILevel, courierDrones, setCourierDrones, sortMode, sortAsc, handleSort } =
        useAILevel();
    const {
        updateQuantumProcessors,
        getTotalQuantumProcessors,
        checkQuantumTradeDelay,
        updateLastQuantumTradeTime,
        addQuantumProcessors,
        subtractQuantumProcessor,
    } = useQuantum();
    const { addFloatingMessage } = useNews();
    const { currentGameEvent, setCurrentGameEvent, eventsList } = useEventContext();

    const [showOnboarding, setShowOnboarding] = useState(false);

    const defaultFuel = 100;

    // Load game data - these are static imports, so we don't need dependency arrays
    const traderConfigs = useMemo(() => tradersData?.traders || [], []);
    const items = useMemo(() => itemsData?.items || [], []);

    // Core game state
    const [inventory, setInventory] = useState([]);

    const [credits, setCredits] = useState(10000);
    const [health, setHealth] = useState(100);
    const [fuel, setFuel] = useState(defaultFuel);
    const [isCheater, setIsCheater] = useState(false);

    // Keep a ref of health to ensure we always have the latest value in callbacks
    const healthRef = useRef(health);

    // Update the ref whenever health changes
    useEffect(() => {
        healthRef.current = health;
    }, [health]);

    // Event and enemy state
    const [currentEnemy, setCurrentEnemy] = useState(null);
    const [globalDangerLevel, setGlobalDangerLevel] = useState(0);
    const [lastEventTime, setLastEventTime] = useState(0);
    const [eventCooldown, setEventCooldown] = useState(300000); // 5 minutes base cooldown
    const [traders, setTraders] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Game mechanics
    const [insufficientCreditFails, setInsufficientCreditFails] = useState(0);
    const [fuelPrices, setFuelPrices] = useState([]);
    const [stockRegenRates, setStockRegenRates] = useState([]);
    const [stealthActive, setStealthActive] = useState(false);
    const [shieldActive, setShieldActive] = useState(false);
    const [deliveryQueue, setDeliveryQueue] = useState([]);
    const [tradeHistory, setTradeHistory] = useState([]);
    const [traderMessage, setTraderMessage] = useState(null);
    const [priceHistory, setPriceHistory] = useState({});

    // Trader state
    const [traderIds, setTraderIds] = useState([]);
    const [traderNames, setTraderNames] = useState([]);
    const [currentTrader, setCurrentTrader] = useState(null);
    const [currentGalaxy, setCurrentGalaxy] = useState(null);
    const [traderMessageTimeout, setTraderMessageTimeout] = useState(null);
    const [traderMessages, setTraderMessages] = useState(traderMessagesData.traderMessages || []);
    const [recordTimes, setRecordTimes] = useState({});

    const [purchaseHistory, setPurchaseHistory] = useState({});

    // Travel state
    const [inTravel, setInTravel] = useState(false);
    const [pendingTrader, setPendingTrader] = useState(null);
    const [travelTimeLeft, setTravelTimeLeft] = useState(0);
    const [travelTotalTime, setTravelTotalTime] = useState(0);

    // Star map state
    const [showStarMap, setShowStarMap] = useState(false);

    // Galaxy State
    const [galaxyName, setGalaxyName] = useState('');
    const [gameCompleted, setGameCompleted] = useState(false);

    // Volume State
    const [volume, setVolume] = useState(1);
    const volumeRef = useRef(volume);

    // Refs for event effects to handle circular dependencies
    const applyAdditionalEffectsRef = useRef();

    // Galaxy Travel State
    const [isJumping, setIsJumping] = useState(false);
    const [jumpTimeLeft, setJumpTimeLeft] = useState(0);
    const [jumpDuration, setJumpDuration] = useState(0);
    const [jumpFromCoord, setJumpFromCoord] = useState({ x: 0, y: 0, z: 0 });
    const [jumpToCoord, setJumpToCoord] = useState({ x: 0, y: 0, z: 0 });

    // Status effects
    const [statusEffects, setStatusEffects] = useState({
        'Quantum Processor': {
            level: 0,
            quantity: 0,
            lastTradeTime: 0,
            active: false,
        },
    });

    // Quantum system state
    const [quantumInventory, setQuantumInventory] = useState([]);
    const [quantumPower, setQuantumPower] = useState(false);
    const [isQuantumHoverEnabled, setIsQuantumHoverEnabled] = useState(false);
    const [isQuantumScanActive, setIsQuantumScanActive] = useState(false);
    const [quantumSlotsUsed, setQuantumSlotsUsed] = useState(0);
    const [lastQuantumTradeTime, setLastQuantumTradeTime] = useState(0);
    const [quantumProcessors, setQuantumProcessors] = useState(0);

    // Add a quantum ability to the inventory
    const addQuantumAbility = useCallback((ability) => {
        setQuantumInventory((prev) => [...new Set([...prev, ability])]); // Use Set to avoid duplicates
    }, []);

    // Toggle quantum scan
    const toggleQuantumScan = useCallback(() => {
        setIsQuantumScanActive((prev) => !prev);
    }, []);

    // Toggle all quantum abilities
    const toggleQuantumAbilities = useCallback(() => {
        // console.log(
        //     'Toggle quantum abilities called. Current quantumSlotsUsed:',
        //     quantumSlotsUsed,
        //     'Current quantumPower:',
        //     quantumPower
        // );

        if (quantumSlotsUsed >= 1) {
            setQuantumPower((prev) => {
                let newState = false;
                // console.log(typeof prev);
                if (typeof prev === 'undefined') {
                    // console.log('was undefined...');
                    newState = true;
                } else {
                    // console.log('flipping prev');
                    newState = !prev;
                }
                // console.log('Toggling quantum power from', prev, 'to', newState);
                return newState;
            });
        } else {
            console.log('Not enough quantum slots used');
        }
    }, [quantumSlotsUsed, quantumPower]);

    // Initialize game state from saved data - using the more complete implementation below

    // Quantum trade delay is now handled by QuantumContext

    // Define applyEventEffects first using a ref for applyAdditionalEffects
    const applyEventEffects = useCallback(
        (event) => {
            if (!event?.effect) return;

            // Apply market effects to items if there are affected items
            if (event.effect.affectedItems?.length) {
                // Get the price and stock multipliers
                const [pMin, pMax] = Array.isArray(event.effect.priceMultiplierRange)
                    ? event.effect.priceMultiplierRange
                    : [1, 1];

                const [sMin, sMax] = Array.isArray(event.effect.stockMultiplierRange)
                    ? event.effect.stockMultiplierRange
                    : [1, 1];

                // Apply market effects to items
                setTraders((prevTraders) =>
                    prevTraders.map((trader) => {
                        if (!Array.isArray(trader.inventory)) {
                            return trader;
                        }
                        return {
                            ...trader,
                            inventory: trader.inventory.map((item) => {
                                if (event.effect.affectedItems.includes(item.itemId)) {
                                    const priceMult = Math.random() * (pMax - pMin) + pMin;
                                    const stockMult = Math.random() * (sMax - sMin) + sMin;
                                    return {
                                        ...item,
                                        price: Math.max(1, Math.round(item.price * priceMult)),
                                        stock: Math.max(0, Math.round(item.stock * stockMult)),
                                        isAffected: true,
                                    };
                                }
                                return item;
                            }),
                        };
                    })
                );
            }

            // Apply any additional effects from the event using the ref
            if (event.effect.effects?.length && applyAdditionalEffectsRef.current) {
                applyAdditionalEffectsRef.current(event);
            }
        },
        [] // No dependencies needed as we're using refs
    );

    // Apply any additional effects from the event
    const applyAdditionalEffects = useCallback(
        (event) => {
            if (!event?.effect?.effects?.length) return;

            event.effect.effects.forEach(({ type, val, durationMs }) => {
                switch (type) {
                    case 'heal_player':
                        setHealth((h) => Math.max(0, h + val));
                        addFloatingMessage(`+${val} Health`, 'heal');
                        break;
                    case 'damage_player':
                        setHealth((h) => Math.max(0, h - val));
                        addFloatingMessage(`-${val} Damage`, 'damage');
                        break;
                    case 'fuel_amount':
                        setFuel((f) =>
                            Math.max(0, Math.min(MAX_FUEL, parseFloat(f) + parseFloat(val)))
                        );
                        addFloatingMessage(`${val > 0 ? '+' : ''}${val} Fuel`, 'fuel');
                        break;
                    case 'credit_balance':
                        setCredits((c) => c + val);
                        addFloatingMessage(`${val > 0 ? '+' : ''}${val} Credits`, 'credits');
                        break;
                    case 'improved_AI':
                        setImprovedAILevel((l) => l + Math.ceil(val));
                        addFloatingMessage(`AI Update! (+${Math.ceil(val)})`, 'global');
                        break;
                    case 'escape_chance':
                        setStealthActive(true);
                        if (durationMs) setTimeout(() => setStealthActive(false), durationMs);
                        break;
                    case 'shield_active':
                        setShieldActive(true);
                        if (durationMs) setTimeout(() => setShieldActive(false), durationMs);
                        break;
                    case 'courier_drones_change':
                        setCourierDrones((d) => Math.max(0, d + val));
                        break;
                    default:
                        break;
                }
            });
        },
        [
            addFloatingMessage,
            setCourierDrones,
            setImprovedAILevel,
            setCredits,
            setFuel,
            setHealth,
            setShieldActive,
            setStealthActive,
        ]
    );

    // Update the ref whenever applyAdditionalEffects changes
    useEffect(() => {
        applyAdditionalEffectsRef.current = applyAdditionalEffects;
    }, [applyAdditionalEffects]);

    // Trigger a random event
    const triggerRandomMajorEvent = useCallback(
        (force = false) => {
            const now = Date.now();

            // Only check cooldown if not forced
            if (!force && now - lastEventTime < eventCooldown) return null;

            // Filter out events that have cooldown requirements
            const eligibleEvents = eventsList.filter((event) => {
                if (!event.minCycleGap) return true;
                const lastTrigger = lastEventTime[event.randomEventId] || 0;
                return now - lastTrigger >= event.minCycleGap * 1000;
            });

            if (eligibleEvents.length === 0) return null;

            // Select a random event with weighted probability
            const totalRarity = eligibleEvents.reduce((sum, e) => sum + (e.rarity || 1), 0);
            let random = Math.random() * totalRarity;
            let selectedEvent = null;

            for (const event of eligibleEvents) {
                random -= event.rarity || 1;
                if (random <= 0) {
                    selectedEvent = event;
                    break;
                }
            }

            if (!selectedEvent) return null;

            setCurrentGameEvent(selectedEvent);
            setLastEventTime(now);

            // Apply market effects if the event has them
            if (selectedEvent.effect?.affectedItems) {
                applyEventEffects(selectedEvent);
            }

            // Trigger enemy if specified and in a dangerous area
            if (selectedEvent.spawnEnemyType && currentGalaxy?.danger) {
                const enemyType = selectedEvent.spawnEnemyType;
                const enemy = {
                    name: `Enemy ${Math.floor(Math.random() * 1000)}`,
                    type: Array.isArray(enemyType) ? enemyType[0] : enemyType,
                    health: 100 * (1 + globalDangerLevel * 0.2),
                    damage: 10 * (1 + globalDangerLevel * 0.15),
                    dangerLevel: globalDangerLevel,
                    credits: 100 * (1 + globalDangerLevel * 0.1),
                };
                setCurrentEnemy(enemy);
            }

            // Adjust cooldown based on danger level (faster events in more dangerous areas)
            const newCooldown = Math.max(30000, eventCooldown * (0.9 - globalDangerLevel * 0.05));
            setEventCooldown(newCooldown);

            return selectedEvent;
        },
        [
            eventsList,
            lastEventTime,
            eventCooldown,
            globalDangerLevel,
            currentGalaxy,
            applyEventEffects,
            setCurrentGameEvent,
        ]
    );

    // Global event loop
    useEffect(() => {
        const eventInterval = setInterval(() => {
            // 30% chance to trigger a random event each interval
            if (Math.random() < 0.3) {
                triggerRandomMajorEvent();
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(eventInterval);
    }, [triggerRandomMajorEvent]);

    // Update danger level based on game progress
    const updateDangerLevel = useCallback((newLevel) => {
        setGlobalDangerLevel((prev) => Math.max(0, Math.min(10, newLevel)));
    }, []);

    // Remove a quantum ability from the inventory
    const removeQuantumAbility = useCallback((ability) => {
        setQuantumInventory((prev) => prev.filter((a) => a !== ability));
    }, []);

    // prepareGalaxy function remains the same

    const prepareGalaxy = useCallback(
        (gName) => {
            const galaxyObj = galaxiesData.galaxies.find((g) => g.name === gName) || {};

            const traderIds = Array.isArray(galaxyObj.traders) ? galaxyObj.traders : [];
            const configs = traderIds
                .map((id) => traderConfigs.find((cfg) => cfg.traderId === id))
                .filter(Boolean);
            return configs.map((config) => {
                // determine number of items, price and stock ranges
                const [minI, maxI] = Array.isArray(config.numberOfItems)
                    ? config.numberOfItems
                    : [1, items.length];
                const count = Math.max(minI, maxI);
                const [pMin, pMax] = Array.isArray(config.priceMult) ? config.priceMult : [1, 2];
                const [vMin, vMax] = Array.isArray(config.volatilityRange)
                    ? config.volatilityRange
                    : [1, 1];
                const [sMin, sMax] = Array.isArray(config.stockRange) ? config.stockRange : [1, 10];

                // Get indices for reliable items (always included first)
                const reliableIndices = getReliableIndices(config.reliableItems, items);

                // Get all possible item indices
                const allItemIndices = items.map((_, i) => i);

                // Remove reliable items from the pool of available items
                const availableItemIndices = allItemIndices.filter(
                    (idx) => !reliableIndices.includes(idx)
                );

                // Shuffle the available items for random selection
                const shuffledAvailable = [...availableItemIndices].sort(() => Math.random() - 0.5);

                // Take the first (count - reliableIndices.length) items from the shuffled array
                const randomIndices = shuffledAvailable.slice(
                    0,
                    Math.max(0, count - reliableIndices.length)
                );

                // Combine reliable and random items (reliable first)
                let picks = [...reliableIndices, ...randomIndices];

                // If we have space and there are rare items, potentially replace one item with a rare one
                if (picks.length > 0 && config.rareItems?.length > 0 && Math.random() > 0.5) {
                    // Get a random rare item that's not already in picks
                    const availableRareItems = items.filter(
                        (item) =>
                            config.rareItems.includes(item.itemId) &&
                            !picks.some((idx) => items[idx].itemId === item.itemId)
                    );

                    if (availableRareItems.length > 0) {
                        const rareItem =
                            availableRareItems[
                                Math.floor(Math.random() * availableRareItems.length)
                            ];
                        const rareIndex = items.findIndex(
                            (item) => item.itemId === rareItem.itemId
                        );

                        // Replace a random item (but not a reliable one) with the rare item
                        const replaceableIndices = picks
                            .map((idx, i) => (reliableIndices.includes(idx) ? -1 : i))
                            .filter((i) => i !== -1);

                        if (replaceableIndices.length > 0) {
                            const replaceIndex =
                                replaceableIndices[
                                    Math.floor(Math.random() * replaceableIndices.length)
                                ];
                            picks[replaceIndex] = rareIndex;
                        }
                    }
                }

                // Defensive: filter out any invalid indices
                picks = picks.filter((i) => typeof i === 'number' && i >= 0 && i < items.length);

                // --- FILTER OUT ILLEGAL ITEMS IF TRADER IS NOT ALLOWED ---
                if (!config.illegalItems) {
                    picks = picks.filter((i) => !items[i].illegal);
                }

                // Convert indices to trader items
                const traderItems = picks
                    .map((i) => {
                        const def = items[i];
                        if (!def) return null;
                        const baseMult = Math.random() * (pMax - pMin) + pMin;
                        const volatility = Math.random() * (vMax - vMin) + vMin;
                        const mult = baseMult * volatility;
                        let stockVal = randomInt(sMin, sMax);
                        if (
                            (reliableIndices.includes(i) ||
                                config.rareItems?.includes(def.itemId)) &&
                            stockVal < 1
                        ) {
                            stockVal = 1;
                        }
                        return {
                            name: def.name,
                            price: Math.round(def.basePrice * mult),
                            basePrice: def.basePrice,
                            stock: stockVal,
                            itemId: def.itemId,
                            VO: def.VO,
                            volatilityRange: config.volatilityRange || [vMin, vMax],
                            illegal: def.illegal,
                        };
                    })
                    .filter(Boolean);

                return Array.isArray(traderItems) ? traderItems : [];
            });
        },
        [items, traderConfigs, getReliableIndices, randomInt]
    );

    // jump to a new galaxy: use galaxyId or name
    const jumpToGalaxy = useCallback(
        (target) => {
            // Determine destination galaxy by id or name
            let toObj = null;
            if (typeof target === 'string') {
                toObj = galaxiesData.galaxies.find((g) => g.name === target);
            } else if (typeof target === 'number') {
                toObj = galaxiesData.galaxies.find((g) => g.galaxyId === target);
            }
            if (!toObj) {
                toObj = galaxiesData.galaxies[randomInt(0, galaxiesData.galaxies.length - 1)];
            }
            const toName = toObj.name;
            const toId = toObj.galaxyId;
            // Update galaxy states
            setNextGalaxyName(toName);
            setGalaxyName(toName);
            setCurrentGalaxy(toId);
            // Prepare trader listings for new galaxy
            const newGalaxy = prepareGalaxy(toName);
            setTraders(newGalaxy.map((t) => (Array.isArray(t) ? t : [])));
            // Update traderIds and names based on toObj.traders
            const newTraderIds = toObj.traders || [];
            setTraderIds(newTraderIds);
            const newTraderConfigs = newTraderIds
                .map((id) => traderConfigs.find((cfg) => cfg.traderId === id))
                .filter(Boolean);
            setTraderNames(newTraderConfigs.map((cfg) => cfg.name));
            // Select the first trader in the new galaxy so items display correctly
            if (newTraderIds.length) setCurrentTrader(newTraderIds[0]);

            // Initialize fuel prices and stock regen rates
            setFuelPrices(
                newTraderIds.map(() =>
                    randomInt(
                        (toObj.fuelPriceRange || [5, 15])[0],
                        (toObj.fuelPriceRange || [5, 15])[1]
                    )
                )
            );

            setStockRegenRates(
                newTraderIds.map((id) => {
                    const cfg = traderConfigs.find((cfg) => cfg.traderId === id) || {};
                    const [min, max] = cfg.stockRange || [0, 0];
                    return randomInt(min, max);
                })
            );
            // Update price history keyed by traderId and cell index
            setPriceHistory((prev) => {
                const ph = { ...prev };
                const now = Date.now();
                newGalaxy.forEach((cells, idx) => {
                    const tid = newTraderIds[idx];
                    cells.forEach((c, ci) => {
                        if (c) {
                            ph[`${tid}-${ci}`] = [
                                ...(ph[`${tid}-${ci}`] || []),
                                { p: c.price, t: now },
                            ];
                        }
                    });
                });
                return ph;
            });
            // Advance turn and reset jumping state
            setIsJumping(false);
            setNextGalaxyName(pickRandomGalaxyFromJSON());
            return toObj;
        },
        [prepareGalaxy, traderConfigs]
    );

    // Define travelToGalaxy function at the component level
    const travelToGalaxy = useCallback(
        (target) => {
            // Get the current galaxy object
            const currentGalaxyObj =
                galaxiesData.galaxies.find((g) => g.galaxyId === currentGalaxy) ||
                galaxiesData.galaxies[0];

            // Determine destination galaxy by id or name
            let toObj = null;
            if (typeof target === 'string') {
                toObj = galaxiesData.galaxies.find((g) => g.name === target);
            } else if (typeof target === 'number') {
                toObj = galaxiesData.galaxies.find((g) => g.galaxyId === target);
            }

            // If no target or random travel, select a different galaxy than current one
            if (!toObj) {
                const availableGalaxies = galaxiesData.galaxies.filter(
                    (g) => g.galaxyId !== currentGalaxy
                );
                toObj = availableGalaxies[randomInt(0, availableGalaxies.length - 1)];
                if (!toObj) {
                    // Fallback in case there's only one galaxy
                    toObj = galaxiesData.galaxies[0];
                }
            }

            // Don't do anything if we're already at the target galaxy
            if (toObj.galaxyId === currentGalaxy) {
                addFloatingMessage(`Already at ${toObj.name}`, 'info');
                return false;
            }

            // Check if we have enough fuel to travel
            const fuelCost = 10; // Base fuel cost for travel
            if (fuel < fuelCost) {
                addFloatingMessage('Not enough fuel to travel!', 'error');
                return false;
            }

            // Deduct fuel
            setFuel((prev) => Math.max(0, Math.min(MAX_FUEL, prev - fuelCost)));

            // Set up travel coordinates for animation
            setJumpFromCoord(currentGalaxyObj.coordinates || { x: 0, y: 0, z: 0 });
            setJumpToCoord(toObj.coordinates || { x: 0, y: 0, z: 0 });

            // Set up jump animation
            const duration = 3000;
            setJumpDuration(duration);
            setJumpTimeLeft(duration);
            setIsJumping(true);

            // Calculate drainRate for use in setJumpTimeLeft
            let drainRate = fuelCost / (duration / 100);

            // Countdown timer for jump animation
            const iv = setInterval(() => {
                setJumpTimeLeft((t) => {
                    if (t <= 100) {
                        clearInterval(iv);
                        // Update galaxy state using jumpToGalaxy
                        jumpToGalaxy(toObj.galaxyId);
                        setIsJumping(false);
                        addFloatingMessage(`Arrived at ${toObj.name}`, 'success');
                        // --- MARKET POLICE CHECKS ---
                        const totalQPs = getTotalQuantumProcessors(inventory, quantumSlotsUsed);
                        const hasIllegal = hasIllegalItem(inventory, items);
                        const galaxyObj = galaxiesData.galaxies.find(
                            (g) => g.galaxyId === toObj.galaxyId
                        );
                        if (totalQPs > 6) {
                            setCurrentEnemy({
                                name: 'Market Police (Quantum Regulation)',
                                type: 'market_police',
                                rank: 'S',
                                health: 300,
                                damage: 35,
                                statusEffects: ['Quantum Dampening', 'Reinforced Armor'],
                                isHostile: true,
                                isMarketPolice: true,
                                reason: 'quantum_processor_limit',
                            });
                        } else if (hasIllegal && !(galaxyObj.danger || galaxyObj.war)) {
                            setCurrentEnemy({
                                name: 'Market Police (Illegal Goods)',
                                type: 'market_police',
                                rank: 'A',
                                health: 250,
                                damage: 20,
                                statusEffects: ['Lawful Presence', 'System Scan'],
                                isHostile: true,
                                isMarketPolice: true,
                                reason: 'illegal_item',
                            });
                        }
                        return 0;
                    }
                    setFuel((f) => Math.max(0, Math.min(MAX_FUEL, f - drainRate)));
                    return t - 100;
                });
            }, 100);

            return true;
        },
        [
            jumpToGalaxy,
            fuel,
            currentGalaxy,
            addFloatingMessage,
            inventory,
            getTotalQuantumProcessors,
            quantumSlotsUsed,
            items,
        ]
    );

    // Function to initialize game state from saved data
    const initializeGameState = useCallback(
        async (savedState) => {
            // console.log('Initializing game state with:', savedState);
            try {
                // Set basic state with validation
                if (savedState.health !== undefined) setHealth(Number(savedState.health));
                if (savedState.fuel !== undefined)
                    setFuel(Math.max(0, Math.min(MAX_FUEL, Number(savedState.fuel))));
                if (savedState.credits !== undefined) setCredits(Number(savedState.credits));

                // Set cheater status from saved state
                if (savedState.isCheater !== undefined) {
                    setIsCheater(!!savedState.isCheater);
                } else {
                    // Fallback to check localStorage directly if not in saved state
                    const savedGame = localStorage.getItem('scifiMarketSave');
                    if (savedGame) {
                        try {
                            const gameState = JSON.parse(savedGame);
                            if (gameState?.isCheater !== undefined) {
                                setIsCheater(!!gameState.isCheater);
                            }
                        } catch (e) {
                            console.error('Error loading cheater status from localStorage:', e);
                        }
                    }
                }

                // Fix: Use savedState.courierDrones instead of savedState.setCourierDrones
                if (savedState.courierDrones !== undefined) {
                    setCourierDrones(Number(savedState.courierDrones));
                }

                if (savedState.shieldActive !== undefined)
                    setShieldActive(!!savedState.shieldActive);
                if (savedState.stealthActive !== undefined)
                    setStealthActive(!!savedState.stealthActive);

                // Handle inventory with validation
                if (Array.isArray(savedState.inventory)) {
                    const validInventory = savedState.inventory
                        .filter((item) => item && item.name && item.quantity > 0)
                        .map((item) => ({
                            name: String(item.name),
                            quantity: Number(item.quantity) || 0,
                            price: Number(item.price) || 0,
                        }));
                    setInventory(validInventory);
                } else {
                    setInventory([]);
                }

                if (savedState.quantumProcessors !== undefined)
                    setQuantumProcessors(Number(savedState.quantumProcessors));
                if (savedState.aiLevel !== undefined)
                    setImprovedAILevel(Number(savedState.aiLevel));
                // if (savedState.deliverySpeed !== undefined) setCourierDrones(Number(savedState.deliverySpeed));

                // Travel to the saved galaxy if specified
                if (savedState.galaxyName) {
                    // console.log('Traveling to saved galaxy:', savedState.galaxyName);
                    await travelToGalaxy(savedState.galaxyName);
                }

                // console.log('Game state initialized successfully');
                return true;
            } catch (error) {
                console.error('Failed to initialize game state:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    savedState: savedState,
                });
                return false;
            }
        },
        [
            setHealth,
            setFuel,
            setCredits,
            setCourierDrones,
            setShieldActive,
            setStealthActive,
            setInventory,
            setQuantumProcessors,
            setImprovedAILevel,
            travelToGalaxy,
        ]
    );

    const pickRandomGalaxyFromJSON = () => {
        const names = shuffle(galaxiesData.galaxies.map((g) => g.name));
        return names[randomInt(0, names.length - 1)];
    };

    const memoizedPickRandomGalaxy = useMemo(() => pickRandomGalaxyFromJSON(), []);
    const [nextGalaxyName, setNextGalaxyName] = useState(memoizedPickRandomGalaxy);
    const GLOBAL_TICK_MS = 50;
    const [priceTick, setPriceTick] = useState(Date.now());
    const [itemTickMeta, setItemTickMeta] = useState({});

    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    useEffect(() => {
        const decayInterval = setInterval(() => {
            setImprovedAILevel((level) => (level > 0 ? level - 1 : 0));
        }, 4000);
        return () => clearInterval(decayInterval);
    }, [setImprovedAILevel]);

    // Helper to map reliableItems (itemId) to item indices
    function getReliableIndices(reliableItemIds, items) {
        return Array.isArray(reliableItemIds)
            ? reliableItemIds
                  .map((id) => items.findIndex((it) => it.itemId === id))
                  .filter((idx) => idx >= 0)
            : [];
    }

    // Memoize traderConfigs to prevent unnecessary recalculations
    const memoizedTraderConfigs = useMemo(() => traderConfigs, [traderConfigs]);

    // ----- INIT -----
    useEffect(() => {
        // Skip if already initialized
        if (isInitialized) return;

        // Initialize starting galaxy by galaxyId
        const startGalaxyObj = galaxiesData.galaxies.find((g) => g.galaxyId === 10) || {};

        setGalaxyName(startGalaxyObj.name);
        // console.log('Initializing traders for galaxy:', startGalaxyObj.name);

        // Prepare traders' listings for the galaxy
        const prepared = prepareGalaxy(startGalaxyObj.name);
        setTraders(prepared.map((t) => (Array.isArray(t) ? t : [])));
        // console.log('Traders prepared:', prepared);

        // Resolve trader configs by traderId for this galaxy
        const tradersInGalaxy = (startGalaxyObj.traders || [])
            .map((id) => memoizedTraderConfigs.find((cfg) => cfg.traderId === id))
            .filter(Boolean);
        // console.log('Found traders in galaxy:', tradersInGalaxy);

        // Track traderIds and names
        const ids = tradersInGalaxy.map((t) => t.traderId);
        const names = tradersInGalaxy.map((t) => t.name);
        setTraderIds(ids);
        setTraderNames(names);
        // console.log('Trader IDs set:', ids);

        // Select the first trader by traderId
        if (ids.length) {
            setCurrentTrader(ids[0]);
            // console.log('Selected trader:', ids[0]);
        } else {
            // console.log('No traders found in galaxy');
        }

        // Initialize fuel prices and stock regen rates for each trader
        const fuelPrices = tradersInGalaxy.map(() =>
            randomInt(
                (startGalaxyObj.fuelPriceRange || [5, 15])[0],
                (startGalaxyObj.fuelPriceRange || [5, 15])[1]
            )
        );
        setFuelPrices(fuelPrices);
        // console.log('Fuel prices initialized:', fuelPrices);

        const stockRates = tradersInGalaxy.map((trader) => {
            const [min, max] = trader.stockRange || [0, 0];
            return randomInt(min, max);
        });
        setStockRegenRates(stockRates);
        // console.log('Stock regen rates initialized:', stockRates);

        // Initialize price history keyed by traderId and cell index
        const initialPH = {};
        prepared.forEach((cells, tIdx) => {
            const tid = ids[tIdx];
            cells.forEach((cell, idx) => {
                if (cell) initialPH[`${tid}-${idx}`] = [{ p: cell.price, t: Date.now() }];
            });
        });
        setPriceHistory(initialPH);
        // console.log('Price history initialized');

        // Set currentGalaxy to its galaxyId
        setCurrentGalaxy(startGalaxyObj.galaxyId);
        // console.log('Current galaxy set to:', startGalaxyObj.galaxyId);

        // Mark initialization as complete
        setIsInitialized(true);
        // console.log('Initialization complete');
        // We can safely omit galaxiesData.galaxies from deps as it's static data
    }, [
        isInitialized,
        prepareGalaxy,
        memoizedTraderConfigs,
        setHealth,
        setFuel,
        setCredits,
        setCourierDrones,
        setShieldActive,
        setStealthActive,
        setInventory,
        setQuantumProcessors,
        setImprovedAILevel,
        travelToGalaxy,
    ]);

    // Helper: Pick a random greeting for a trader
    const pickTraderMessage = useCallback(
        (type = 'greetings') => {
            if (!currentTrader || !traderMessages) return '';

            // console.log('pickTraderMessage called with type:', type, 'for trader:', currentTrader);

            // Get messages for the current trader and message type
            const traderData = traderMessages.find((tm) => tm.traderId === currentTrader);
            if (!traderData) {
                console.warn('No trader data found for trader ID:', currentTrader);
                return '';
            }

            const messages = traderData[type];
            // console.log('Messages for trader:', messages);

            if (!messages) {
                console.warn('No messages found for trader', currentTrader, 'and type', type);
                return '';
            }

            const hasCHIKTranslator =
                statusEffects['translate_CHIK'] || statusEffects['Auto Translator CHIK']?.active;
            const hasLAYTranslator =
                statusEffects['translate_LAY'] || statusEffects['Auto Translator LAY']?.active;
            const langs = Object.keys(messages);
            let msg = '';

            // console.log('Available languages:', langs);
            // console.log(
            //     'Has CHIK translator:',
            //     hasCHIKTranslator,
            //     'Has LAY translator:',
            //     hasLAYTranslator
            // );

            // If player has a relevant translator and English exists, always show English
            if (messages.EN && Array.isArray(messages.EN) && messages.EN.length > 0) {
                msg = messages.EN[randomInt(0, messages.EN.length - 1)];
                // console.log('Selected EN message:', msg);
                return msg;
            }

            // Try to find a message in any available language
            for (const lang of ['CHIK', 'LAY', 'EN', ...langs]) {
                if (messages[lang] && Array.isArray(messages[lang]) && messages[lang].length > 0) {
                    msg = messages[lang][randomInt(0, messages[lang].length - 1)];
                    // console.log(`Selected ${lang} message:`, msg);
                    return msg;
                }
            }

            console.warn('No suitable message found for trader', currentTrader, 'type', type);
            return '';
        },
        [currentTrader, traderMessages, statusEffects]
    );

    // Handle trader messages when in travel or when arriving
    useEffect(() => {
        // Store the current timeout in a ref to avoid dependency on traderMessageTimeout
        const currentTimeout = traderMessageTimeout;

        if (inTravel) {
            const goodbyeMessage = pickTraderMessage('goodbyes');
            if (goodbyeMessage) {
                if (currentTimeout) clearTimeout(currentTimeout);
                setTraderMessage(goodbyeMessage);
                const newTimeout = setTimeout(() => setTraderMessage(null), 3000);
                setTraderMessageTimeout(newTimeout);
            }
        } else {
            if (currentTimeout) clearTimeout(currentTimeout);
            setTraderMessage(null);
            const newTimeout = setTimeout(() => setTraderMessage(null), 4200);
            setTraderMessageTimeout(newTimeout);
        }

        // Cleanup function
        return () => {
            if (currentTimeout) clearTimeout(currentTimeout);
        };
    }, [pickTraderMessage, currentTrader, traderMessages, inTravel]); // Removed traderMessageTimeout from deps

    // regenerate stock on each cap at 1000
    useEffect(() => {
        if (!stockRegenRates.length) return;
        setTraders((ts) =>
            ts.map((cells, idx) =>
                cells.map((c) =>
                    c ? { ...c, stock: Math.min((c.stock || 0) + stockRegenRates[idx], 1000) } : c
                )
            )
        );
    }, [stockRegenRates]);

    function getEffectiveTickRateMs(itemDef, event) {
        let baseRate = 1000; // default 1s
        if (itemDef && Array.isArray(itemDef.priceTickRate)) {
            const [rMin, rMax] = itemDef.priceTickRate;
            baseRate = Math.random() * (rMax - rMin) + rMin; // convert seconds to ms
        }

        if (event && event.effect && event.effect.priceTickRateMultiplier) {
            const mod = event.effect.priceTickRateMultiplier;
            if (typeof mod === 'number') return baseRate * mod;
            if (Array.isArray(mod)) {
                const [mMin, mMax] = mod;
                return baseRate * (Math.random() * (mMax - mMin) + mMin);
            }
        }

        // console.log(baseRate);
        return baseRate;
    }

    // prepare items for current trader, apply sorting
    const displayCells = useMemo(() => {
        // Determine index for current trader via traderIds array
        const traderIdx = traderIds.findIndex((tid) => tid === currentTrader);
        const list = traders[traderIdx] || [];
        let pricedList;
        if (inTravel && travelTotalTime > 0) {
            const elapsed = travelTotalTime - travelTimeLeft;
            const markupFraction = elapsed / travelTotalTime;
            pricedList = list.map((c) =>
                c ? { ...c, price: Math.ceil(c.price * (1 + markupFraction)) } : c
            );
        } else {
            pricedList = list;
        }
        if (sortMode === 'alpha') {
            return [...pricedList].sort((a, b) =>
                sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
            );
        }
        if (sortMode === 'price') {
            return [...pricedList].sort((a, b) =>
                sortAsc ? a.price - b.price : b.price - a.price
            );
        }
        if (sortMode === 'stock') {
            return [...pricedList].sort((a, b) =>
                sortAsc ? a.stock - b.stock : b.stock - a.stock
            );
        }
        // default: sort by itemId ascending
        return [...pricedList].sort((a, b) => a.itemId - b.itemId);
    }, [
        traders,
        currentTrader,
        traderIds,
        sortMode,
        sortAsc,
        inTravel,
        travelTimeLeft,
        travelTotalTime,
    ]);

    // compute number of columns for MarketGrid
    const numCellsX = displayCells.length;

    // Initialize fuel prices and stock regen rates for the current galaxy
    useEffect(() => {
        if (!traderIds.length || !traderConfigs) return;

        setFuelPrices(
            traderIds.map(
                () => randomInt(5, 15) // Default fuel price range
            )
        );

        setStockRegenRates(
            traderIds.map((id) => {
                const cfg = traderConfigs.find((cfg) => cfg.traderId === id) || {};
                const [min, max] = cfg.stockRange || [0, 0];
                return randomInt(min, max);
            })
        );
    }, [traderIds, traderConfigs]);

    // Update price history when traders change
    const updatePriceHistory = useCallback(
        (prevHistory) => {
            const now = Date.now();
            const newHistory = { ...prevHistory };
            let hasChanges = false;

            traders.forEach((cells, idx) => {
                const tid = traderIds[idx];
                if (!tid) return;

                cells.forEach((cell, cellIdx) => {
                    if (!cell) return;
                    const key = `${tid}-${cellIdx}`;
                    const lastPrice = prevHistory[key]?.[prevHistory[key]?.length - 1]?.price;

                    // Only update if price has changed or this is a new item
                    if (lastPrice === undefined || lastPrice !== cell.price) {
                        if (!newHistory[key]) {
                            newHistory[key] = [];
                        }
                        newHistory[key] = [
                            ...newHistory[key],
                            { price: cell.price, timestamp: now },
                        ].slice(-10);
                        hasChanges = true;
                    }
                });
            });

            return hasChanges ? newHistory : prevHistory;
        },
        [traders, traderIds]
    );

    // Use a ref to track the last update time to prevent rapid updates
    // const lastUpdateRef = useRef(0);
    // const updateInterval = 1000; // Update at most once per second

    // // Update price history with debounce
    // useEffect(() => {
    //     if (!traders.length || !traderIds.length) return;

    //     const now = Date.now();
    //     if (now - lastUpdateRef.current < updateInterval) return;

    //     setPriceHistory(prev => {
    //         const updated = updatePriceHistory(prev);
    //         if (updated !== prev) {
    //             lastUpdateRef.current = now;
    //         }
    //         return updated;
    //     });
    // }, [traders, traderIds, updatePriceHistory]);

    // trigger an enemy encounter with optional type
    const triggerEnemyEncounter = useCallback(
        (encounterType = 'random') => {
            // Sound Enemy Encounter
            // zzfx(volumeRef.current, 1.5, .8, 270, 0, .1, 0, 1, 1.5, 0, 0, 0, 0, 0, 0, .1, .01, 0, 0, 0);

            let filteredEnemies = [...eventsList];

            // Filter enemies based on encounter type if specified
            if (encounterType !== 'random') {
                filteredEnemies = eventsList.filter((e) => {
                    // Match by event type or dialog tags if available
                    const matchesType =
                        e.type === encounterType || (e.tags && e.tags.includes(encounterType));
                    // For market police encounters, check if it has a dialog
                    const hasDialog = !!e.dialog;
                    return matchesType && hasDialog;
                });
            } else {
                // For random encounters, just filter for those with dialogs
                filteredEnemies = eventsList.filter((e) => e.dialog);
            }

            if (!filteredEnemies.length) {
                // Fallback to any enemy with dialog if no matches found
                filteredEnemies = eventsList.filter((e) => e.dialog);
                if (!filteredEnemies.length) return;
            }

            const ev = filteredEnemies[randomInt(0, filteredEnemies.length - 1)];
            setCurrentGameEvent(ev);

            // Create enemy data based on encounter type
            const enemyData = {
                name: '',
                rank: 'D',
                health: 100,
                damage: 10,
                homeGalaxy: 'Unknown',
                language: 'EN',
                credits: 0,
                statusEffects: [],
                isHostile: true,
                isMarketPolice: false,
                reason: encounterType,
            };

            // Customize enemy based on encounter type
            switch (encounterType) {
                case 'quantum_processor_limit':
                    enemyData.name = 'Quantum Regulation Unit';
                    enemyData.rank = 'S';
                    enemyData.health = 300;
                    enemyData.damage = 35;
                    enemyData.statusEffects = ['Quantum Dampening', 'Reinforced Armor'];
                    enemyData.isMarketPolice = true;
                    break;
                case 'ILLEGAL_AI_increase':
                    enemyData.name = 'Compliance Officer';
                    enemyData.rank = 'A';
                    enemyData.health = 250;
                    enemyData.damage = 20;
                    enemyData.statusEffects = ['Lawful Presence', 'System Scan'];
                    enemyData.isMarketPolice = true;
                    break;
                case 'random_inspection':
                    enemyData.name = 'Market Inspector';
                    enemyData.rank = 'B';
                    enemyData.health = 180;
                    enemyData.damage = 15;
                    enemyData.credits = 200;
                    enemyData.isMarketPolice = true;
                    break;
                case 'trader_combat':
                    enemyData.name = 'Hostile Trader';
                    enemyData.rank = 'C';
                    enemyData.health = 150;
                    enemyData.damage = 25;
                    enemyData.credits = 500;
                    enemyData.statusEffects = ['Combat Ready'];
                    break;
                case 'bounty_hunter':
                    enemyData.name = 'Bounty Hunter';
                    enemyData.rank = 'A';
                    enemyData.health = 200;
                    enemyData.damage = 30;
                    enemyData.credits = 1000;
                    enemyData.statusEffects = ['Tracking', 'Combat Ready'];
                    break;
                default:
                    enemyData.name = 'Unknown Threat';
                    enemyData.rank = 'D';
                    enemyData.health = 100;
                    enemyData.damage = 10;
            }

            setCurrentEnemy(enemyData);

            // Add floating message with appropriate prefix
            const prefix =
                {
                    quantum_processor_limit: 'Quantum Regulation Unit: ',
                    ILLEGAL_AI_increase: 'Compliance Officer: ',
                    random_inspection: 'Market Inspector: ',
                    trader_combat: 'Hostile Trader: ',
                    bounty_hunter: 'Bounty Hunter: ',
                }[encounterType] || 'Alert: ';

            addFloatingMessage(
                `${prefix}${ev.dialog?.text || 'Enemy encountered!'}${
                    ev.dialog?.cost ? ' Cost: ' + ev.dialog.cost : ''
                }`
            );
        },
        [eventsList, setCurrentGameEvent, setCurrentEnemy, addFloatingMessage]
    );

    // ----- NEXT TRADER -----
    const handleNextTrader = useCallback(() => {
        const currentIdx = traderIds.findIndex((tid) => tid === currentTrader);
        const nextIdx = (currentIdx + 1) % traderIds.length;
        const nextTraderId = traderIds[nextIdx];
        const cost = fuelPrices[nextIdx] || 0;
        if (fuel < cost) {
            addFloatingMessage('Not enough fuel to travel');
            return;
        }
        const duration = 3000;
        const drainRate = cost / (duration / 100);
        setPendingTrader(nextTraderId);
        setInTravel(true);
        setTravelTimeLeft(duration);
        setTravelTotalTime(duration);

        const iv = setInterval(() => {
            setTravelTimeLeft((t) => {
                if (t <= 100) {
                    clearInterval(iv);
                    setFuel((f) => Math.max(0, Math.min(MAX_FUEL, f - drainRate)));
                    setCurrentTrader(nextTraderId);
                    setPendingTrader(null);
                    setTravelTotalTime(0);
                    setInTravel(false);

                    // post-travel random encounter chance modified by shield/stealth
                    const baseRate = 0.2;
                    const rate = baseRate * (shieldActive ? 0.7 : 1) * (stealthActive ? 0.5 : 1);
                    if (Math.random() < rate) triggerEnemyEncounter();
                    return 0;
                }
                setFuel((f) => Math.max(0, Math.min(MAX_FUEL, f - drainRate)));
                return t - 100;
            });
        }, 100);
        const timeSound = duration / 1000;
        const timeSoundHalf = timeSound / 2;
        // NEXT TRADER SOUND
        zzfx(
            volumeRef.current, // Volume
            0, //0.042, // Randomness
            50, // Freq
            0.1337, // Attack
            0, // Sustain
            timeSound, // Release
            1, //  Wave Shape (0,1,2,3,4)
            1.337, // Shape curve
            0.69, //  Slide
            0.42, // Delta Slide
            500, // Pitch Jump
            timeSoundHalf, // Pitch Jump Time
            0.001, // Repeat Time
            0.5, // Noise
            0, // Modulation
            0, // Bit Crush
            0, // Delay
            1, // Sustain Volume
            0, // Decay
            0, // Tremolo
            0 // Filter
        );
    }, [
        triggerEnemyEncounter,
        addFloatingMessage,
        currentTrader,
        fuel,
        fuelPrices,
        shieldActive,
        stealthActive,
        traderIds,
    ]);

    // ----- PREVIOUS TRADER -----
    const handlePrevTrader = useCallback(() => {
        const currentIdx = traderIds.findIndex((tid) => tid === currentTrader);
        const prevIdx = (currentIdx - 1 + traderIds.length) % traderIds.length;
        const prevTraderId = traderIds[prevIdx];
        const cost = fuelPrices[prevIdx] || 0;
        if (fuel < cost) {
            addFloatingMessage('Not enough fuel to travel');
            return;
        }
        const duration = 3000;
        const drainRate = cost / (duration / 100);
        setPendingTrader(prevTraderId);
        setInTravel(true);
        setTravelTimeLeft(duration);
        setTravelTotalTime(duration);

        const iv = setInterval(() => {
            setTravelTimeLeft((t) => {
                if (t <= 100) {
                    clearInterval(iv);
                    setFuel((f) => Math.max(0, Math.min(MAX_FUEL, f - drainRate)));
                    setCurrentTrader(prevTraderId);
                    setPendingTrader(null);
                    setTravelTotalTime(0);
                    setInTravel(false);

                    // post-travel random encounter chance modified by shield/stealth
                    const baseRate = 0.2;
                    const rate = baseRate * (shieldActive ? 0.7 : 1) * (stealthActive ? 0.5 : 1);
                    if (Math.random() < rate) triggerEnemyEncounter();
                    return 0;
                }
                setFuel((f) => Math.max(0, Math.min(MAX_FUEL, f - drainRate)));
                return t - 100;
            });
        }, 100);

        const timeSound = duration / 1000;
        const timeSoundHalf = timeSound / 2;
        // PREV TRADER SOUND
        zzfx(
            volumeRef.current, // Volume
            0, //0.042, // Randomness
            500, // Freq
            0.1337, // Attack
            0, // Sustain
            timeSound, // Release
            0, // Wave Shape (0,1,2,3,4)
            1.337, // Shape curve
            0.69, //  Slide
            0.42, // Delta Slide
            50, // Pitch Jump
            timeSoundHalf, // Pitch Jump Time
            0.01, // Repeat Time
            0.5, // Noise
            0, // Modulation
            0, // Bit Crush
            0, // Delay
            1, // Sustain Volume
            0, // Decay
            0, // Tremolo
            0 // Filter
        );
    }, [
        triggerEnemyEncounter,
        addFloatingMessage,
        currentTrader,
        fuel,
        fuelPrices,
        shieldActive,
        stealthActive,
        traderIds,
    ]);

    // ----- BUY SINGLE -----
    const handleBuyClick = useCallback(
        (identifier) => {
            // Determine the trader index in the traders array based on traderIds
            const traderIdx = traderIds.findIndex((tid) => tid === currentTrader);
            if (inTravel) {
                const receiver = statusEffects['tool_receiver'];
                if (!receiver?.active) {
                    addFloatingMessage('Requires Particle Beam Receiver to buy during travel');
                    return false;
                }
            }

            // If identifier is a cell object, use it directly
            let cell, idx;
            if (typeof identifier === 'object' && identifier !== null) {
                cell = identifier;
                const list = traders[traderIdx] || [];
                idx = list.findIndex((c) => c && c.itemId === cell.itemId);
            } else {
                // Handle legacy case where identifier is index or name/itemId
                const list = traders[traderIdx] || [];
                if (typeof identifier === 'number' && Number.isInteger(identifier)) {
                    idx = identifier;
                    cell = list[idx];
                } else {
                    // match by itemId or name
                    idx = list.findIndex(
                        (c) => c && (c.itemId === identifier || c.name === identifier)
                    );
                    cell = list[idx];
                }
            }
            if (!cell) return false;
            // Check stock level and prevent purchase if out of stock
            if (!cell || cell.stock <= 0) {
                addFloatingMessage('Out of stock');
                console.log('Purchase failed: Out of stock', {
                    item: cell?.name,
                    stock: cell?.stock,
                });
                return false;
            }
            const name = cell.name;
            const price = cell.price;

            if (credits < price) {
                // insufficient credits for standard purchase
                const nextFail = insufficientCreditFails + 1;
                setInsufficientCreditFails(nextFail);
                const variants = [
                    'ERROR!',
                    'ERROR INSUFFICIENT CREDITS',
                    'E R R O R - NOT ENOUGH CREDITS',
                ];
                addFloatingMessage(variants[(nextFail - 1) % variants.length]);
                return false;
            }
            // deduct immediate
            setCredits((c) => c - price);
            // Update stock in a single atomic operation
            setTraders((ts) =>
                ts.map((g, i) =>
                    i === traderIdx
                        ? g.map((c, j) =>
                              j === idx
                                  ? {
                                        ...c,
                                        stock: Math.max(0, c.stock - 1), // Ensure stock never goes below 0
                                    }
                                  : c
                          )
                        : g
                )
            );

            // If we just bought the last item, update the display
            if (cell.stock === 1) {
                addFloatingMessage('Last one sold out!', 'global');
                // Force a re-render to update the AI immediately
                setTraders((prevTraders) => [...prevTraders]);
            }
            // reset fail counter on successful buy
            setInsufficientCreditFails(0);
            // Don't update inventory immediately - it will be updated when delivery completes

            // update purchase history
            setPurchaseHistory((ph) => ({
                ...ph,
                [name]: [...(ph[name] || []), price],
            }));
            // schedule delivery based on item deliveryTime and courierDrones
            const itemData = items.find((i) => i.name === name);
            const rawTime = (itemData?.deliveryTime || 0) * 1000;
            const deliverTime = rawTime / (1 + courierDrones);
            const timeSound = deliverTime / 1000;
            const timeSoundHalf = timeSound / 2;
            setDeliveryQueue((q) => {
                const newQ = [
                    ...q,
                    {
                        id: Date.now() + Math.random(),
                        name,
                        itemId: cell.itemId,
                        quantity: 1,
                        price,
                        timeLeft: deliverTime,
                        totalTime: deliverTime,
                    },
                ];
                return newQ;
            });

            // console.log('deliver now.!');
            // DELIVERY SOUND (switches halfway)
            zzfx(
                volumeRef.current, //Volume
                420, //Randomness
                5, //Freq
                0, //Attack
                0, //Sustain
                timeSound, //Release
                2, //Wave Shape (0,1,2,3,4)
                1.337, //Shape curve
                0.69, //Slide
                0.47, //Delta Slide
                750, //Pitch Jump
                timeSoundHalf, //Pitch Jump Time
                0, //Repeat Time
                0.1337, //Noise
                105, //Modulation
                0.015, //Bit Crush
                0, //Delay
                0.025, //Sustain Volume
                0, //Decay
                0, //Tremolo
                0 // Filter
            );

            setTradeHistory((h) => [
                ...h,
                { time: Date.now(), type: 'buy', name, quantity: 1, price, profit: -price },
            ]);

            // Buy Sound
            let buySoundChange = randomFloatRange(22, 25);
            zzfx(
                volumeRef.current, // Volume
                69, // Randomness
                13.37, //Freq
                0.02, //Attack
                0, //Sustain
                0.01, // Release
                0, //  Wave Shape (0,1,2,3,4)
                buySoundChange.toFixed(2) * 1.25, // Shape curve
                buySoundChange.toFixed(2), //  Slide
                0, // Delta Slide
                475, // Pitch Jump
                0.01, // Pitch Jump Time
                buySoundChange.toFixed(2), // Repeat Time
                0.5, // Noise
                0, // Modulation
                0, // Bit Crush
                0, // Delay
                1, // Sustain Volume
                0, // Decay
                0, // Tremolo
                0 // Filter
            );
            return true;
        },
        [
            addFloatingMessage,
            courierDrones,
            credits,
            currentTrader,
            inTravel,
            insufficientCreditFails,
            items,
            statusEffects,
            traderIds,
            traders,
        ]
    );

    // ----- SELL SINGLE -----
    const handleSellClick = useCallback(
        (identifier) => {
            // Determine the trader index in the traders array based on traderIds
            const traderIdx = traderIds.findIndex((tid) => tid === currentTrader);

            // If identifier is a cell object, use it directly
            let cell, idx;
            if (typeof identifier === 'object' && identifier !== null) {
                cell = identifier;
                const list = traders[traderIdx] || [];
                idx = list.findIndex((c) => c && c.itemId === cell.itemId);
            } else {
                // Handle legacy case where identifier is index or name
                const list = traders[traderIdx] || [];
                if (typeof identifier === 'number' && Number.isInteger(identifier)) {
                    idx = identifier;
                    cell = list[idx];
                } else if (typeof identifier === 'string') {
                    // match by name
                    idx = list.findIndex((c) => c && c.name === identifier);
                    cell = list[idx];
                }
            }

            if (!cell) return false;
            const itemName = cell.name;
            // max 4 Quantum Processors: trader won't buy more
            if (itemName === 'Quantum Processor' && cell.stock >= 4) {
                addFloatingMessage('Trader cannot hold more Quantum Processors');
                return false;
            }
            // Disable selling during travel if not allowed or no Particle Beam Reverter
            if (inTravel) {
                const itemDef = items.find((i) => i.name === cell.name);
                if (!itemDef) {
                    addFloatingMessage('Cannot sell: item definition not found', 'error');
                    return false;
                }
                if (!itemDef.travelSell) {
                    console.log('no travel sell for this item allowed');
                    addFloatingMessage('Cannot sell during travel', 'global');
                    return false;
                }
                if (!statusEffects['tool_reverter']) {
                    addFloatingMessage('Requires Particle Beam Reverter to sell during travel');
                    console.log('no reverter installed');
                    return false;
                }
            }
            const sale = cell.price;
            const inventoryItem = inventory.find((i) => i.name === itemName);
            if (!inventoryItem) return;
            setCredits((c) => c + sale);
            // Sell Sound
            zzfx(volumeRef.current, 0, 150, 0.05, 0, 0.05, 0, 1.3, 0, 0, 0, 0, 0, 3);
            addFloatingMessage(`Sold ${itemName} (+${sale})`, 'global');
            addFloatingMessage(`+${sale}`, 'credits');
            setInventory((prev) =>
                prev
                    .map((i) => (i.itemId === cell.itemId ? { ...i, quantity: i.quantity - 1 } : i))
                    .filter((i) => i.quantity > 0)
            );
            const newT = [...traders];
            const g = newT[traderIdx] || [];
            g[idx] = {
                ...g[idx],
                name: itemName,
                price: sale,
                stock: (g[idx]?.stock || 0) + 1,
                itemId: cell.itemId, // Preserve the itemId
            };
            const itemData = items.find((i) => i.itemId === cell.itemId);
            newT[traderIdx] = g;
            setTraders(newT);
            // Get purchase history for this item
            const historyArr = [...(purchaseHistory[itemName] || [])];

            // Calculate average cost based on remaining items in inventory
            const remainingItems = (inventory.find((i) => i.name === itemName)?.quantity || 1) - 1;
            const purchasePrice = historyArr.length > 0 ? historyArr.shift() : sale; // Remove oldest purchase
            const profit = +(sale - purchasePrice).toFixed(2);

            // Update purchase history by removing the sold item's purchase record
            if (historyArr.length > 0) {
                setPurchaseHistory((ph) => ({
                    ...ph,
                    [itemName]: historyArr,
                }));
            } else {
                // Remove the item from purchase history if no more items left
                setPurchaseHistory(({ [itemName]: _, ...rest }) => rest);
            }

            // Record sell event with detailed profit information
            setTradeHistory((h) => [
                ...h,
                {
                    time: Date.now(),
                    type: 'sell',
                    name: itemName,
                    quantity: 1,
                    price: sale,
                    purchasePrice: purchasePrice,
                    profit,
                    remainingInInventory: remainingItems,
                    avgCost:
                        historyArr.length > 0
                            ? +(historyArr.reduce((a, v) => a + v, 0) / historyArr.length).toFixed(
                                  2
                              )
                            : 0,
                },
            ]);
            return true;
        },
        [
            addFloatingMessage,
            currentTrader,
            inTravel,
            inventory,
            items,
            purchaseHistory,
            statusEffects,
            traderIds,
            traders,
        ]
    );

    // ----- BUY ALL (Entire Market) -----
    // bulk buy: purchase all stock at once or nothing
    const handleBuyAll = useCallback(() => {
        if (inTravel) {
            const receiver = statusEffects['tool_receiver'];
            if (!receiver?.active) {
                addFloatingMessage('Requires Particle Beam Receiver to buy during travel');
                return false;
            }
        }
        // Purchase items for the active trader
        const traderIdx = traderIds.findIndex((tid) => tid === currentTrader);
        const list = traders[traderIdx] || [];
        const totalCost = list.reduce((sum, cell) => sum + cell.price * (cell.stock || 0), 0);
        if (credits < totalCost) return false;
        // deduct credits
        setCredits((c) => c - totalCost);
        // prepare deliveries
        const now = Date.now();
        const newItems = list.flatMap((cell) => {
            if (!cell || cell.stock <= 0) return [];
            const itemData = items.find((i) => i.name === cell.name);
            const rawTime = (itemData?.deliveryTime || 0) * 1000;
            const deliverTime = rawTime / (1 + courierDrones);
            return [
                {
                    id: now + Math.random(),
                    name: cell.name,
                    quantity: cell.stock,
                    price: cell.price,
                    timeLeft: deliverTime,
                    totalTime: deliverTime,
                },
            ];
        });
        setDeliveryQueue((q) => [...q, ...newItems]);
        // record history
        setPurchaseHistory((ph) => {
            const copy = { ...ph };
            list.forEach((cell) => {
                if (!cell || cell.stock <= 0) return;
                const arr = copy[cell.name] || [];
                copy[cell.name] = [...arr, ...Array(cell.stock).fill(cell.price)];
            });
            return copy;
        });
        // clear stock
        setTraders((ts) =>
            ts.map((group, i) =>
                i === traderIdx ? group.map((c) => (c ? { ...c, stock: 0 } : c)) : group
            )
        );
        addFloatingMessage('Bulk purchase completed', 'global');
        return true;
    }, [
        addFloatingMessage,
        courierDrones,
        credits,
        currentTrader,
        inTravel,
        items,
        statusEffects,
        traderIds,
        traders,
    ]);

    // ----- SELL ALL -----
    // sell all quantity of an item
    const handleSellAll = useCallback(
        (name) => {
            // Disable bulk selling during travel if not allowed or no Particle Beam Reverter
            if (inTravel) {
                const itemDef = items.find((i) => i.name === name);
                if (!itemDef) {
                    addFloatingMessage('Cannot sell: item definition not found', 'error');
                    return false;
                }
                if (!itemDef.travelSell) {
                    console.log('no travel sell for this item allowed');
                    addFloatingMessage('Cannot sell during travel', 'global');
                    return false;
                }
                const hasReverter = Object.entries(statusEffects).some(
                    ([key, effect]) =>
                        effect.name === 'Particle Beam Reverter' && effect.expiresAt > Date.now()
                );
                if (!hasReverter) {
                    addFloatingMessage('Requires Particle Beam Reverter to sell during travel');
                    console.log('no reverter installed');
                    return false;
                }
            }
            const invItem = inventory.find((i) => i.name === name);
            if (!invItem) return;
            const qty = invItem.quantity;
            // Determine trader index based on currentTrader id
            const traderIdx = traderIds.findIndex((tid) => tid === currentTrader);
            const list = traders[traderIdx] || [];
            const idx = list.findIndex((c) => c && c.name === name);
            const cell = list[idx];
            if (!cell) return;
            // trader capacity for Quantum Processors
            if (name === 'Quantum Processor' && cell.stock >= 4) {
                addFloatingMessage('Trader cannot hold more Quantum Processors');
                return false;
            }
            const sale = cell.price;
            setCredits((c) => c + sale * qty);
            addFloatingMessage(`Sold All ${name} (+${sale * qty})`, 'global');
            addFloatingMessage(`+${sale * qty}`, 'credits');
            // record single combined sell event with profit
            const historyArr = purchaseHistory[name] || [];
            const avgCost = historyArr.length
                ? historyArr.reduce((a, v) => a + v, 0) / historyArr.length
                : sale;
            const totalProfit = +(sale * qty - avgCost * qty).toFixed(2);
            setTradeHistory((h) => [
                ...h,
                {
                    time: Date.now(),
                    type: 'sell',
                    name,
                    quantity: qty,
                    price: sale,
                    profit: totalProfit,
                },
            ]);

            // remove from inventory
            setInventory((prev) => prev.filter((i) => i.name !== name));

            // Remove the correct number of oldest purchase prices (FIFO)
            setPurchaseHistory((ph) => {
                const newPh = { ...ph };
                if (newPh[name]) {
                    newPh[name] = newPh[name].slice(qty); // Remove first qty entries
                    if (newPh[name].length === 0) delete newPh[name];
                }
                return newPh;
            });

            // restore stock to trader, but don't exceed maximum capacity
            setTraders((ts) =>
                ts.map((g, i) =>
                    i === traderIdx
                        ? g.map((c, j) => {
                              if (j !== idx) return c;
                              const itemDef = items.find((item) => item.name === name);
                              const maxStock = itemDef?.maxStock || 99; // Default to 99 if no maxStock defined
                              const newStock = Math.min(maxStock, c.stock + qty);
                              return { ...c, stock: newStock };
                          })
                        : g
                )
            );
            if (totalProfit >= 0) {
                // Volume, Randomness, Freq, Wav Shape, Shape, Attack, Decay, sustain, Release, Sustain Volume, Slide, Delta Slide, Pitch Jump, Pitch Jump Time, Repeat Time, Tremolo, Noise, Bitch Crush, Delay, Modulation, Filter

                // SELL ALL (profit) sound
                zzfx(
                    volumeRef.current,
                    0.05,
                    60,
                    0,
                    0.02,
                    0.23,
                    4,
                    1.6,
                    0,
                    4,
                    0,
                    0,
                    0,
                    0,
                    19,
                    0,
                    0.41,
                    0.96,
                    0.18,
                    0,
                    235
                );
            } else {
                // SELL ALL (loss) sound
                zzfx(
                    volumeRef.current,
                    0.1,
                    9220,
                    0.01,
                    0,
                    0,
                    0,
                    5,
                    0,
                    0,
                    0,
                    0,
                    9,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                );
            }
        },
        [
            addFloatingMessage,
            currentTrader,
            inTravel,
            inventory,
            items,
            purchaseHistory,
            statusEffects,
            traderIds,
            traders,
        ]
    );

    // ----- USE ITEM -----
    const handleUseItem = useCallback(
        (name) => {
            // Sound Use Item
            // zzfx(volumeRef.current, 0, 20, .1337, .13, .25, 1, 13.37, 0, 0, 420, .1, 0, 0, 0, .6, 0, .81, .2, .16, 0); // Random 4
            const item = inventory.find((i) => i.name === name);
            if (!item || item.quantity <= 0) return;

            setInventory((prevInv) =>
                prevInv
                    .map((i) => (i.name === name ? { ...i, quantity: i.quantity - 1 } : i))
                    .filter((i) => i.quantity > 0)
            );

            const itemDef = items.find((it) => it.name === name);
            if (!itemDef || !itemDef.effects) return;
            Object.entries(itemDef.effects).forEach(([effectKey, effectValue]) => {
                const isAdd = effectKey.startsWith('+');
                const isSub = effectKey.startsWith('-');
                const type = effectKey.replace(/^\+|^\-/, '');
                let value;
                if (Array.isArray(effectValue)) {
                    const [min, max] = effectValue;
                    value = Math.floor(Math.random() * (max - min + 1)) + min;
                } else if (typeof effectValue === 'string' && effectValue === 'true') {
                    value = true;
                } else if (typeof effectValue === 'boolean') {
                    value = effectValue;
                } else if (typeof effectValue === 'number') {
                    value = effectValue;
                } else {
                    value = effectValue;
                }

                switch (type) {
                    case 'heal_player':
                        setHealth((h) => Math.min(100, isAdd ? h + value : h - value));
                        addFloatingMessage(
                            `${isAdd ? '+' : '-'}${value} Health`,
                            'global',
                            'current_health'
                        );
                        zzfx(
                            volumeRef.current,
                            0.04,
                            125,
                            0.07,
                            0.31,
                            0.03,
                            0,
                            36,
                            0,
                            0,
                            550,
                            0.09,
                            0.12,
                            0.147,
                            0.33,
                            0.036,
                            0.04,
                            0.8,
                            0.47,
                            0,
                            0
                        ); // Random 19
                        break;

                    case 'damage_player':
                        // Implement as needed
                        addFloatingMessage(
                            `${isAdd ? '-' : '+'}${value} Damage Received`,
                            'global',
                            'current_health'
                        );
                        break;

                    case 'fuel_amount':
                        setFuel((f) => {
                            const newFuel = isAdd ? parseFloat(f) + value : parseFloat(f) - value;
                            return Math.max(0, Math.min(MAX_FUEL, newFuel));
                        });
                        isAdd &&
                            zzfx(
                                volumeRef.current,
                                0.05,
                                60,
                                0,
                                0.02,
                                0.23,
                                4,
                                1.6,
                                -6,
                                4,
                                0,
                                0,
                                0,
                                0,
                                19,
                                0,
                                0.41,
                                0.96,
                                0.18,
                                0,
                                235
                            );

                        break;

                    case 'fuel_cost':
                        if (value !== 0) {
                            addFloatingMessage(
                                `Fuel cost reduced by ${Math.abs(value)} (${itemDef.name})`,
                                'global',
                                'fuel_cost'
                            );
                            // Play sound effect
                            zzfx(volumeRef.current, 0.1, 500, 0.3, 0.2, 0.1, 1, 0.5, 0.1);

                            // Calculate duration in ms (if itemDef.duration is an array, pick a random value in range)
                            let durationMs = null;
                            if (Array.isArray(itemDef.duration)) {
                                // Pick a random value between min and max (inclusive), in seconds
                                const [min, max] = itemDef.duration;
                                const randomSeconds =
                                    Math.floor(Math.random() * (max - min + 1)) + min;
                                durationMs = randomSeconds * 1000;
                            } else if (typeof itemDef.duration === 'number') {
                                durationMs = itemDef.duration * 1000;
                            }

                            // Generate a unique key for this effect
                            const effectKey = `${itemDef.name}-${Date.now()}`;
                            setStatusEffects((prev) => ({
                                ...prev,
                                [effectKey]: {
                                    type: 'fuel_cost',
                                    value,
                                    expiresAt: durationMs ? Date.now() + durationMs : null,
                                    itemName: itemDef.name,
                                    duration: durationMs,
                                    remainingTime: durationMs,
                                },
                            }));
                        }
                        break;

                    case 'trolled':
                        addFloatingMessage(
                            'Nothing happened...',
                            'global',
                            'trolled',
                            'psionic-amplifier'
                        );
                        zzfx(
                            volumeRef.current,
                            0.1,
                            200,
                            0,
                            0.1,
                            0.2,
                            1,
                            0.5,
                            -1,
                            0.5,
                            150,
                            0.1,
                            0.1,
                            0,
                            0,
                            0,
                            0.1
                        );
                        break;

                    case 'credit_balance':
                        setCredits((c) => (isAdd ? c + value : c - value));
                        addFloatingMessage(`${isAdd ? '+' : '-'}${value} Credits!`, 'global');
                        zzfx(
                            volumeRef.current,
                            0.05,
                            369,
                            0,
                            0.08,
                            0.18,
                            1,
                            0.7,
                            0,
                            5,
                            258,
                            0.05,
                            0.05,
                            0,
                            0,
                            0.1,
                            0,
                            0.76,
                            0.1337,
                            0,
                            -1337
                        ); // Pickup 51 // Pickup 51
                        break;

                    case 'improved_AI':
                        setImprovedAILevel((prevLevel) => {
                            const safePrev =
                                typeof prevLevel === 'number' && !isNaN(prevLevel) ? prevLevel : 0;
                            const safeValue =
                                typeof value === 'number' && !isNaN(value) ? value : 0;
                            return safePrev + (isAdd ? safeValue : -safeValue);
                        });

                        zzfx(
                            volumeRef.current,
                            0.1,
                            539,
                            0,
                            0.04,
                            0.29,
                            1,
                            1.92,
                            0.3,
                            0.4,
                            567,
                            0.02,
                            0.02,
                            0,
                            0,
                            0,
                            0.04
                        ); // AI Level up
                        addFloatingMessage(
                            `AI Update! (+${Math.ceil(value)})`,
                            'global',
                            'quantum-processor'
                        );
                        break;

                    case 'delivery_speed':
                        setCourierDrones((d) => {
                            const newDrones = isAdd ? d + value : Math.max(0, d - value);
                            return newDrones;
                        });
                        // Scale up small delivery speed values for better visibility
                        const scaledValue = value * 100000; // Scale up by 100000x
                        const displayValue = scaledValue.toFixed(1); // Show 1 decimal place
                        addFloatingMessage(
                            `${isAdd ? '+' : '-'}${displayValue}% Delivery Speed`,
                            'global'
                        );

                        zzfx(
                            volumeRef.current,
                            0.05,
                            302,
                            0.01,
                            0.04,
                            0.2,
                            1,
                            1.4,
                            3,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0.09,
                            0.88
                        ); // Pickup 27

                        break;

                    case 'damage_enemy':
                        // Implement as needed
                        addFloatingMessage(
                            `${isAdd ? '+' : '-'}${value} Damage to Enemy`,
                            'global'
                        );
                        break;

                    case 'escape_chance':
                        setStealthActive(true);
                        addFloatingMessage('Stealth Activated!', 'global', 'stealth-module');
                        // Optionally set timeout for duration if needed
                        break;

                    case 'tool_receiver':
                    case 'tool_reverter': {
                        // Check for duration in itemDef
                        let durationMs = null;
                        if (Array.isArray(itemDef.duration)) {
                            const [min, max] = itemDef.duration;
                            const randomSeconds = Math.floor(Math.random() * (max - min + 1)) + min;
                            durationMs = randomSeconds * 1000;
                        } else if (typeof itemDef.duration === 'number' && itemDef.duration > 0) {
                            durationMs = itemDef.duration * 1000;
                        }
                        setStatusEffects((prev) => ({
                            ...prev,
                            [type]: durationMs
                                ? {
                                      active: !!value,
                                      expiresAt: Date.now() + durationMs,
                                      duration: durationMs,
                                      remainingTime: durationMs,
                                      type,
                                  }
                                : { active: !!value, type },
                        }));
                        addFloatingMessage(
                            `${type.replace('_', ' ')} ${value ? 'Activated' : 'Deactivated'}`,
                            'global'
                        );
                        break;
                    }
                    case 'translate_CHIK':
                    case 'translate_LAY': {
                        let durationMs = null;
                        if (Array.isArray(itemDef.duration)) {
                            const [min, max] = itemDef.duration;
                            const randomSeconds = Math.floor(Math.random() * (max - min + 1)) + min;
                            durationMs = randomSeconds * 1000;
                        } else if (typeof itemDef.duration === 'number' && itemDef.duration > 0) {
                            durationMs = itemDef.duration * 1000;
                        }
                        setStatusEffects((prev) => ({
                            ...prev,
                            [type]: durationMs
                                ? {
                                      active: !!value,
                                      expiresAt: Date.now() + durationMs,
                                      duration: durationMs,
                                      remainingTime: durationMs,
                                      type,
                                  }
                                : { active: !!value, type },
                        }));
                        addFloatingMessage(
                            `${type.replace('_', ' ')} ${value ? 'Enabled' : 'Disabled'}`,
                            'global'
                        );
                        zzfx(
                            volumeRef.current,
                            0.05,
                            303,
                            0.01,
                            0.47,
                            0.23,
                            0,
                            4.5,
                            5,
                            70,
                            -30,
                            0.57,
                            0.17,
                            0,
                            2.9,
                            0,
                            0,
                            0.56,
                            0.14,
                            0.13,
                            0
                        ); // Random 16
                        break;
                    }
                    case '+improved_AI':
                        const def = items.find((i) => i.name === name);
                        if (def && def.illegal) {
                            setImprovedAILevel((prevLevel) => {
                                const safePrev =
                                    typeof prevLevel === 'number' && !isNaN(prevLevel)
                                        ? prevLevel
                                        : 0;
                                const safeValue = Array.isArray(effectValue)
                                    ? effectValue[1]
                                    : typeof effectValue === 'number'
                                    ? effectValue
                                    : 0;
                                const newLevel = safePrev + safeValue;
                                if (safePrev <= 1000 && newLevel > 1000) {
                                    setCurrentEnemy({
                                        name: 'Market Police (Illegal AI)',
                                        type: 'market_police',
                                        rank: 'A',
                                        health: 250,
                                        damage: 20,
                                        statusEffects: ['Lawful Presence', 'System Scan'],
                                        isHostile: true,
                                        isMarketPolice: true,
                                        reason: 'ILLEGAL_AI_increase',
                                    });
                                }
                                return newLevel;
                            });
                        }
                        break;
                    default:
                        console.warn(`Unknown item effect type: ${type}`, effectKey, effectValue);
                }
            });
        },
        [
            addFloatingMessage,
            inventory,
            items,
            setCourierDrones,
            setImprovedAILevel,
            setCurrentEnemy,
        ]
    );

    // ----- TOGGLE SHIELD -----
    const toggleShield = useCallback(() => {
        setShieldActive((s) => {
            const newS = !s;
            addFloatingMessage(`Shield ${newS ? 'Activated' : 'Deactivated'}`, 'global');
            return newS;
        });
    }, [addFloatingMessage]);

    // ----- TOGGLE STEALTH -----
    const toggleStealth = useCallback(() => {
        setStealthActive((s) => {
            const newS = !s;
            addFloatingMessage(`Stealth ${newS ? 'Activated' : 'Deactivated'}`, 'global');
            return newS;
        });
    }, [addFloatingMessage]);

    // Trigger a random market event immediately
    const triggerRandomMarketEvent = () => {
        // zzfx(volumeRef.current, 925, .04, .3, .6, 1, .3, 0, 6.27, -184, .09, .17, 0, 0, 0, 0, 0, 0, 0);
        const ev = eventsList[randomInt(0, eventsList.length - 1)];
        setCurrentGameEvent(ev);

        // Only apply effects if the event has them
        if (ev.effect) {
            const { affectedItems, priceMultiplierRange, stockMultiplierRange } = ev.effect;
            const pMin = Math.min(...priceMultiplierRange);
            const pMax = Math.max(...priceMultiplierRange);
            const sMin = Math.min(...stockMultiplierRange);
            const sMax = Math.max(...stockMultiplierRange);

            // Create effect description strings
            const priceChange =
                pMax > 1
                    ? `↑${Math.round((pMax - 1) * 100)}%`
                    : pMax < 1
                    ? `↓${Math.round((1 - pMax) * 100)}%`
                    : '±0%';
            const stockChange =
                sMax > 1
                    ? `↑${Math.round((sMax - 1) * 100)}%`
                    : sMax < 1
                    ? `↓${Math.round((1 - sMax) * 100)}%`
                    : '±0%';

            // Find affected item names
            const affectedItemsData = items.filter((item) => affectedItems.includes(item.itemId));
            const affectedNames = affectedItemsData.map((item) => item.name);

            // Display event effects
            addFloatingMessage(
                `${ev.name}! ${affectedNames.join(
                    ', '
                )}: Prices ${priceChange}, Stock ${stockChange}`,
                'global',
                'event'
            );

            setTraders((prev) =>
                prev.map((trader) =>
                    trader.map((cell) => {
                        if (!cell) return null;
                        if (affectedItems.includes(cell.itemId)) {
                            const pm = Math.random() * (pMax - pMin) + pMin;
                            const sm = Math.random() * (sMax - sMin) + sMin;
                            return {
                                ...cell,
                                price: Math.max(1, Math.round(cell.price * pm)),
                                stock: Math.max(0, Math.round(cell.stock * sm)),
                            };
                        }
                        return cell;
                    })
                )
            );
        }
    };

    // Helper: Get volatility from event effect
    function getEventVolatility(event) {
        if (!event || !event.effect) return null;
        // Prefer priceMultiplierRange, fallback to volatilityRange
        if (event.effect.priceMultiplierRange) {
            const [min, max] = event.effect.priceMultiplierRange;
            return Math.abs(max - min);
        }
        if (event.effect.volatilityRange) {
            const [min, max] = event.effect.volatilityRange;
            return Math.abs(max - min);
        }
        return null;
    }

    // Create buyFuel function
    const buyFuel = useCallback(
        (amount = 5) => {
            // Calculate fuel cost reduction from active status effects (per unit reduction)
            const fuelCostReduction = inventory
                .map((invItem) => {
                    const def = items.find((i) => i.name === invItem.name);
                    return def?.fuel_cost || 0;
                })
                .reduce((acc, curr) => acc + curr, 0);

            const traderIdx = traderIds.findIndex((tid) => tid === currentTrader);
            const costPerUnit = fuelPrices[traderIdx] || 0;
            const effectiveCostPerUnit = Math.max(costPerUnit - fuelCostReduction, 0);
            const totalCost = effectiveCostPerUnit * amount;

            if (credits < totalCost) {
                addFloatingMessage('Not enough credits');
                return;
            }

            setCredits((c) => Number(c) - Number(totalCost));
            setFuel((f) => Math.max(0, Math.min(MAX_FUEL, Number(f) + Number(amount))));
        },
        [credits, traderIds, currentTrader, fuelPrices, inventory, items]
    );

    // Sync delivery speed with courierDrones from AILevelContext
    // useEffect(() => {
    //     setCourierDrones(courierDrones || 0);
    // }, [courierDrones, setCourierDrones]);

    // Handle travel completion
    useEffect(() => {
        if (inTravel && travelTimeLeft <= 0) {
            setInTravel(false);
            if (pendingTrader) {
                setCurrentTrader(pendingTrader);
                setPendingTrader(null);
            }
        }
    }, [inTravel, travelTimeLeft, pendingTrader]);

    // Manage status effects and their durations
    useEffect(() => {
        let mounted = true;

        const checkStatusEffects = () => {
            if (!mounted) return;

            setStatusEffects((prev) => {
                const now = Date.now();
                let changed = false;
                const updated = {};

                // First, check which effects need to be removed
                const effectsToRemove = [];

                Object.entries(prev).forEach(([key, effect]) => {
                    if (effect.expiresAt && effect.expiresAt <= now) {
                        effectsToRemove.push({ key, effect });
                        changed = true;
                    } else {
                        updated[key] = effect;
                    }
                });

                // If no changes, return previous state to prevent re-renders
                if (!changed) return prev;

                // Process effects to be removed
                effectsToRemove.forEach(({ key, effect }) => {
                    if (effect.type === 'fuel_cost') {
                        addFloatingMessage(
                            `Fuel cost reduction from ${effect.itemName} expired.`,
                            'global',
                            'fuel-cost'
                        );
                    } else if (
                        [
                            'tool_receiver',
                            'tool_reverter',
                            'translate_CHIK',
                            'translate_LAY',
                        ].includes(effect.type)
                    ) {
                        addFloatingMessage(`${effect.type.replace('_', ' ')} expired.`, 'global');
                    }
                });

                // Update remaining time for active effects
                Object.entries(updated).forEach(([key, effect]) => {
                    if (effect.expiresAt) {
                        const newRemaining = Math.max(0, effect.expiresAt - now);
                        if (effect.remainingTime !== newRemaining) {
                            changed = true;
                            updated[key] = { ...effect, remainingTime: newRemaining };
                        }
                    }
                });

                return changed ? updated : prev;
            });
        };

        // Run immediately and then every second
        checkStatusEffects();
        const interval = setInterval(checkStatusEffects, 1000);

        return () => {
            clearInterval(interval);
            mounted = false;
        };
    }, [addFloatingMessage]);

    // DELIVERY PROCESSING EFFECT
    useEffect(() => {
        if (!deliveryQueue.length) return;
        const interval = setInterval(() => {
            setDeliveryQueue((q) => {
                const updated = q.map((item) => ({ ...item, timeLeft: item.timeLeft - 100 }));
                const remaining = updated.filter((item) => item.timeLeft > 0);

                // Process items that have completed delivery
                updated.forEach((item) => {
                    if (item.timeLeft <= 0) {
                        // Find item by ID
                        const itemDef = items.find((i) => i.itemId === item.itemId);
                        if (!itemDef) return;

                        setInventory((inv) => {
                            const existingItem = inv.find((i) => i.itemId === itemDef.itemId);
                            if (existingItem) {
                                return inv.map((i) =>
                                    i.itemId === itemDef.itemId
                                        ? { ...i, quantity: i.quantity + item.quantity }
                                        : i
                                );
                            }
                            return [...inv, { ...itemDef, quantity: item.quantity }];
                        });

                        // REMOVE this block (do not add to purchaseHistory on delivery)
                        // setPurchaseHistory((ph) => ({
                        //     ...ph,
                        //     [itemDef.name]: [...(ph[itemDef.name] || []), item.price],
                        // }));
                    }
                });

                return remaining;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [deliveryQueue, items]);

    // Track the latest itemTickMeta with a ref to avoid dependency issues
    const itemTickMetaRef = useRef(itemTickMeta);

    // Keep the ref in sync with state
    useEffect(() => {
        itemTickMetaRef.current = itemTickMeta;
    }, [itemTickMeta]);

    // Only tick priceTick periodically; guard inside with GLOBAL_TICK_MS
    const lastTickRef = useRef(0);
    const tickIntervalRef = useRef();

    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            // Only update if GLOBAL_TICK_MS has actually passed
            if (now - lastTickRef.current >= GLOBAL_TICK_MS) {
                lastTickRef.current = now;
                setPriceTick(now);
            }
        };

        // Initial tick
        tick();

        // Set up interval for subsequent ticks using GLOBAL_TICK_MS cadence
        tickIntervalRef.current = setInterval(tick, GLOBAL_TICK_MS);

        return () => {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
            }
        };
    }, []);

    // Only update traders/prices when priceTick changes
    // Only update traders/prices when priceTick changes, not on every render
    useEffect(() => {
        const now = Date.now();
        let newMeta = { ...itemTickMeta };
        setTraders((prev) =>
            prev.map((trader, tIdx) =>
                trader.map((cell, cIdx) => {
                    if (!cell) return null;
                    const itemDef = items.find((i) => i.name === cell.name);
                    const metaKey = `${tIdx}-${cIdx}`;
                    const meta = itemTickMeta[metaKey] || {
                        last: now,
                        rateMs: getEffectiveTickRateMs(itemDef, currentGameEvent),
                    };
                    if (now - meta.last < meta.rateMs) {
                        // Not time to update yet
                        newMeta[metaKey] = meta;
                        return { ...cell };
                    }

                    // Determine affected goods from event
                    const affected = (currentGameEvent &&
                        currentGameEvent.effect &&
                        currentGameEvent.effect.priceMultiplierRange) || [0.8, 1.5];
                    const [pMin, pMax] = cell.priceRange || [0.8, 1.5];
                    let newCell;
                    if (affected.includes(cell.name)) {
                        const pm = Math.random() * (pMax - pMin) + pMin;
                        newCell = {
                            ...cell,
                            price: Math.max(1, Math.round(cell.basePrice * pm)),
                        };
                    } else {
                        const drift = Math.random() < 0.5 ? 1 : -1;
                        const [vMin, vMax] = cell.volatilityRange || [1, 1];
                        const change = Math.round(randomInt(vMin, vMax) * drift);
                        newCell = { ...cell, price: Math.max(1, cell.price + change) };
                    }
                    newMeta[metaKey] = {
                        last: now,
                        rateMs: getEffectiveTickRateMs(itemDef, currentGameEvent),
                    };
                    return newCell;
                })
            )
        );
        setItemTickMeta(newMeta);
    }, [priceTick]);

    // Add: Helper to check if quantum trading is allowed (buy/sell) based on travel and status effects
    const canQuantumBuy = useMemo(() => {
        if (isJumping) return false;
        if (
            inTravel &&
            (!statusEffects['tool_receiver'] || !statusEffects['tool_receiver'].active)
        ) {
            return false;
        }
        return true;
    }, [inTravel, isJumping, statusEffects]);
    const canQuantumSell = useMemo(() => {
        if (isJumping) return false;
        if (
            inTravel &&
            (!statusEffects['tool_reverter'] || !statusEffects['tool_reverter'].active)
        ) {
            return false;
        }
        return true;
    }, [inTravel, isJumping, statusEffects]);

    // Automatically disable quantumPower when travelling between galaxies
    useEffect(() => {
        if (isJumping) {
            setQuantumPower(false);
        }
    }, [isJumping]);

    // Create the context value object
    const value = useMemo(() => {
        // Compute derived values
        const fuelCostReductions = inventory
            .map((invItem) => {
                const def = items.find((i) => i.name === invItem.name);
                if (!def || !def.effects || def.effects['-fuel_cost'] === undefined) return null;
                const effect = def.effects['-fuel_cost'];
                let value = 0;
                if (Array.isArray(effect)) {
                    value = effect[0];
                } else if (typeof effect === 'number') {
                    value = effect;
                }
                return {
                    name: invItem.name,
                    value,
                    quantity: invItem.quantity,
                };
            })
            .filter(Boolean);

        const totalFuelCostReduction = inventory
            .map((invItem) => {
                const def = items.find((i) => i.name === invItem.name);
                return (def?.fuel_cost || 0) * invItem.quantity;
            })
            .reduce((acc, curr) => acc + curr, 0);

        const quantumState = {
            quantumInventory,
            quantumProcessors,
            quantumPower,
            setQuantumInventory,
            checkQuantumTradeDelay,
            // Quantum state is now managed by QuantumContext
        };

        return {
            // Spread quantum state
            ...quantumState,

            // Core state
            credits,
            inventory,
            health,
            fuel,
            MAX_FUEL,

            // Game state
            currentEnemy,
            currentEvent: currentGameEvent,
            currentGameEvent,
            gameCompleted,
            inTravel,
            isJumping,
            traders,
            traderIds,
            traderNames,
            traderMessages,
            currentTrader,
            TRADER_COUNT: traderIds?.length || 0,

            // AI state
            sortMode,
            sortAsc,
            displayCells: displayCells || [],
            numCellsX: 10,

            // Game mechanics
            stealthActive,
            shieldActive,
            deliveryQueue,
            tradeHistory,
            priceHistory,
            purchaseHistory,
            statusEffects,
            quantumSlotsUsed,

            // Travel state
            travelTimeLeft,
            jumpTimeLeft,
            jumpDuration,
            jumpFromCoord,
            jumpToCoord,

            // Star map state
            showStarMap,
            setShowStarMap,

            // Galaxy state
            galaxyName,
            nextGalaxyName: nextGalaxyName || '',

            // Items and inventory
            items: items || [],
            fuelPrices,
            volume,
            volumeRef,

            // Quantum state
            ...quantumState,
            setQuantumInventory,
            checkQuantumTradeDelay,
            updateLastQuantumTradeTime,
            toggleQuantumAbilities,
            setQuantumSlotsUsed,

            // State setters
            setHealth,
            setStatusEffects,
            setCredits,
            setGameCompleted,
            setTraderMessage,
            setVolume,
            // Quantum state is now managed by QuantumContext
            setRecordTimes: () => {},
            setPurchaseHistory: () => {},

            // Actions
            travelToGalaxy,
            handleBuyClick,
            handleBuyAll,
            handleSellClick,
            handleSellAll,
            handleUseItem,
            handleSort,
            buyFuel,
            handleNextTrader,
            handlePrevTrader,
            toggleShield,
            toggleStealth,

            // Other utilities
            courierDrones: [],
            recordTimes: {},
            traderMessage: null,
            currentGalaxy,
            traderMessageTimeout: null,
            pendingTrader: null,
            travelTotalTime: 0,

            // Empty function implementations for backward compatibility
            onBuyAll: () => {},
            resetQuantumProcessors: () => {},
            subtractQuantumProcessor: () => {},
            triggerRandomMarketEvent: () => {},

            // Empty function implementations for backward compatibility

            triggerEnemyEncounter: () => {},
            addQuantumProcessors,
            updateQuantumProcessors,
            initializeGameState: async (savedState) => {
                console.log('Initializing game state with:', savedState);

                // Set basic game state
                if (savedState.health !== undefined) setHealth(savedState.health);
                if (savedState.fuel !== undefined)
                    setFuel(Math.max(0, Math.min(MAX_FUEL, savedState.fuel)));
                if (savedState.credits !== undefined) setCredits(savedState.credits);
                // Delivery speed is handled by courierDrones in the AI
                if (savedState.shieldActive !== undefined) setShieldActive(savedState.shieldActive);
                if (savedState.stealthActive !== undefined)
                    setStealthActive(savedState.stealthActive);
                if (savedState.quantumProcessors !== undefined)
                    setQuantumProcessors(savedState.quantumProcessors);
                if (savedState.galaxyName) {
                    setGalaxyName(savedState.galaxyName);
                    // Find and set the current galaxy from the saved name
                    const galaxy = galaxiesData.galaxies.find(
                        (g) => g.name === savedState.galaxyName
                    );
                    if (galaxy) {
                        setCurrentGalaxy(galaxy);
                    }
                }

                // Set inventory if it exists and is an array
                if (Array.isArray(savedState.inventory)) {
                    setInventory(savedState.inventory);
                }

                // Update AI level if specified
                if (savedState.aiLevel !== undefined) {
                    setImprovedAILevel(savedState.aiLevel);
                }

                // Mark as initialized
                setIsInitialized(true);

                // console.log('Game state initialization complete');
                return true;
            },
            canQuantumBuy,
            canQuantumSell,
        };
    }, [
        // State dependencies
        buyFuel,

        handleBuyAll,
        handleBuyClick,
        handleNextTrader,
        handlePrevTrader,
        handleSellAll,
        handleSellClick,
        handleUseItem,
        setStatusEffects,
        setCredits,
        setGameCompleted,
        setTraderMessage,
        setVolume,
        toggleQuantumAbilities,
        toggleShield,
        toggleStealth,
        travelToGalaxy,
        setImprovedAILevel,
        credits,
        items,
        inventory,
        health,
        fuel,
        fuelPrices,
        currentEnemy,
        currentGameEvent,
        currentGalaxy,
        showStarMap,
        gameCompleted,
        inTravel,
        isJumping,
        traders,
        traderNames,
        currentTrader,
        traderIds,
        traderMessages,
        handleSort,
        sortMode,
        sortAsc,
        displayCells,
        stealthActive,
        shieldActive,
        deliveryQueue,
        tradeHistory,
        priceHistory,
        purchaseHistory,
        statusEffects,
        travelTimeLeft,
        jumpTimeLeft,
        jumpDuration,
        jumpFromCoord,
        jumpToCoord,
        galaxyName,
        nextGalaxyName,
        volume,
        volumeRef,
        quantumSlotsUsed,
        quantumInventory,
        updateQuantumProcessors,
        quantumPower,
        quantumProcessors,
        checkQuantumTradeDelay,
        canQuantumBuy,
        canQuantumSell,
        updateLastQuantumTradeTime,
    ]);

    // Compute derived values
    const fuelCostReductions = useMemo(() => {
        return inventory
            .map((invItem) => {
                const def = items.find((i) => i.name === invItem.name);
                if (!def || !def.effects || def.effects['-fuel_cost'] === undefined) return null;
                const effect = def.effects['-fuel_cost'];
                let value = 0;
                if (Array.isArray(effect)) {
                    value = effect[0];
                } else if (typeof effect === 'number') {
                    value = effect;
                }
                return {
                    name: invItem.name,
                    value,
                    quantity: invItem.quantity,
                };
            })
            .filter(Boolean);
    }, [inventory, items]);

    const totalFuelCostReduction = useMemo(() => {
        return inventory
            .map((invItem) => {
                const def = items.find((i) => i.name === invItem.name);
                return (def?.fuel_cost || 0) * invItem.quantity;
            })
            .reduce((acc, curr) => acc + curr, 0);
    }, [inventory, items]);

    // Create the context value with all necessary state and functions
    const contextValue = useMemo(
        () => ({
            // State
            inventory,
            credits,
            health,
            fuel,
            isCheater,
            currentEnemy,
            currentGameEvent,
            gameCompleted,
            inTravel,
            isJumping,
            traders,
            traderIds,
            traderNames,
            traderMessages,
            currentTrader,
            sortMode,
            sortAsc,
            displayCells: displayCells || [],
            numCellsX: 10,
            stealthActive,
            shieldActive,
            deliveryQueue,
            tradeHistory,
            priceHistory,
            purchaseHistory,
            statusEffects,
            travelTimeLeft,
            jumpTimeLeft,
            jumpDuration,
            jumpFromCoord,
            jumpToCoord,
            galaxyName,
            nextGalaxyName: nextGalaxyName || '',
            volume,
            quantumSlotsUsed,
            quantumInventory,
            quantumProcessors,
            items: items || [],
            fuelPrices,
            volumeRef,
            quantumPower,
            showOnboarding,

            // Star map state
            showStarMap,
            setShowStarMap,
            // State setters
            setInventory,
            setCredits,
            setHealth,
            setFuel,
            setCurrentEnemy,
            setGameCompleted,
            setInTravel,
            setIsJumping,
            setTraders,
            setCurrentTrader,
            setStealthActive,
            setShieldActive,
            setDeliveryQueue,
            setTradeHistory,
            setPriceHistory,
            setPurchaseHistory,
            setStatusEffects,
            setTravelTimeLeft,
            setJumpTimeLeft,
            setJumpDuration,
            setJumpFromCoord,
            setJumpToCoord,
            setGalaxyName,
            setNextGalaxyName,
            setVolume,
            setQuantumSlotsUsed,
            setQuantumPower,
            setQuantumInventory,
            setQuantumProcessors,
            setShowOnboarding,

            // Derived values and utilities
            fuelCostReductions,
            totalFuelCostReduction,
            courierDrones: [],
            recordTimes: {},
            traderMessage: null,
            currentGalaxy,
            traderMessageTimeout: null,
            pendingTrader: null,
            travelTotalTime: 0,

            // Game functions
            initializeGameState,
            handleBuyClick,
            handleBuyAll,
            handleSellClick,
            handleSellAll,
            handleUseItem,
            handleSort,
            buyFuel,
            handleNextTrader,
            handlePrevTrader,
            toggleShield,
            toggleStealth,
            addFloatingMessage,
            applyEventEffects,
            triggerRandomMajorEvent,
            travelToGalaxy,
            toggleQuantumAbilities,
            toggleQuantumScan,
            addQuantumAbility,
            removeQuantumAbility,

            // Placeholder functions for backward compatibility
            onBuyAll: () => {},
            resetQuantumProcessors: () => {},
            subtractQuantumProcessor,
            triggerRandomMarketEvent: () => {},
            setRecordTimes: () => {},
            setPurchaseHistory: () => {},
            // Quantum state is now managed by QuantumContext
            canQuantumBuy: () => false,
            canQuantumSell: () => false,
        }),
        [
            // Dependencies array
            inventory,
            credits,
            health,
            fuel,
            isCheater,
            currentEnemy,
            currentGameEvent,
            gameCompleted,
            inTravel,
            isJumping,
            traders,
            traderIds,
            traderNames,
            traderMessages,
            currentTrader,
            sortMode,
            sortAsc,
            displayCells,
            stealthActive,
            shieldActive,
            deliveryQueue,
            tradeHistory,
            priceHistory,
            purchaseHistory,
            statusEffects,
            travelTimeLeft,
            jumpTimeLeft,
            jumpDuration,
            jumpFromCoord,
            jumpToCoord,
            galaxyName,
            nextGalaxyName,
            volume,
            quantumSlotsUsed,
            quantumInventory,
            quantumProcessors,
            items,
            fuelPrices,
            volumeRef,
            fuelCostReductions,
            totalFuelCostReduction,
            initializeGameState,
            handleBuyClick,
            handleBuyAll,
            handleSellClick,
            handleSellAll,
            handleUseItem,
            handleSort,
            buyFuel,
            handleNextTrader,
            handlePrevTrader,
            toggleShield,
            toggleStealth,
            addFloatingMessage,
            applyEventEffects,
            triggerRandomMajorEvent,
            travelToGalaxy,
            showOnboarding,
            setShowOnboarding,
            showStarMap,
            setShowStarMap,
            addQuantumAbility,
            currentGalaxy,
            quantumPower,
            removeQuantumAbility,
            toggleQuantumAbilities,
            toggleQuantumScan,
        ]
    );

    return (
        <MarketplaceContext.Provider value={contextValue}>{children}</MarketplaceContext.Provider>
    );
};

// Create custom hook for using the context
export const useMarketplace = () => {
    const context = useContext(MarketplaceContext);
    if (context === undefined) {
        throw new Error('useMarketplace must be used within a MarketplaceProvider');
    }
    return context;
};

export default MarketplaceContext;
