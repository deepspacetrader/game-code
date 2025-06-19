import { useEffect, useCallback, useMemo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useUI } from '../../context/UIContext';
import { ENEMY_TYPES as ENEMY_TYPES_IMPORT } from './Enemy';
import galaxiesData from '../../data/galaxies.json';

const ENEMY_SPAWN_INTERVAL = 30000; // 30 seconds between spawn checks in dangerous zones
const DANGER_LEVEL_INTERVAL = 60000; // 1 minute between danger level checks

const EnemySpawner = () => {
    const { setCurrentEnemy } = useUI();
    const { triggerRandomEvent, currentGalaxy: currentGalaxyId } = useMarketplace();
    // Get the full galaxy object using the currentGalaxy ID
    const currentGalaxy = useMemo(() => {
        if (!currentGalaxyId) return null;
        return galaxiesData.galaxies.find(g => g.galaxyId === currentGalaxyId) || null;
    }, [currentGalaxyId]);

    // Function to get a random enemy type based on the spawnEnemyType
    const getRandomEnemyType = useCallback((spawnEnemyType) => {
        const enemyTypes = Object.values(ENEMY_TYPES_IMPORT);
        // If a specific type is requested, try to use it, otherwise pick a random one
        if (spawnEnemyType && enemyTypes[spawnEnemyType - 1]) {
            return enemyTypes[spawnEnemyType - 1];
        }
        return enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    }, []);

    // Function to handle enemy spawn attempt
    const attemptEnemySpawn = useCallback(() => {
        if (!currentGalaxy) return;

        // Only attempt to spawn enemies in dangerous or war zones
        if (currentGalaxy.danger || currentGalaxy.war) {
            const randomEvent = triggerRandomEvent();

            if (randomEvent?.spawnEnemyType) {
                const enemyType = getRandomEnemyType(randomEvent.spawnEnemyType);
                setCurrentEnemy({
                    type: enemyType,
                    rank: 'D', // Default rank, can be randomized if needed
                    reason: 'random_encounter',
                    homeGalaxy: currentGalaxy.name,
                });
            }
        }
    }, [currentGalaxy, getRandomEnemyType, setCurrentEnemy, triggerRandomEvent]);

    // Set up timers for enemy spawning and danger level checks
    useEffect(() => {
        if (!currentGalaxy) {
            // If currentGalaxy is not available yet, don't proceed
            return;
        }

        // Only set up timers in dangerous or war zones
        let spawnInterval;
        let dangerInterval;

        if (currentGalaxy.danger || currentGalaxy.war) {
            spawnInterval = setInterval(attemptEnemySpawn, ENEMY_SPAWN_INTERVAL);

            // Check danger level periodically
            dangerInterval = setInterval(() => {
                console.log('Checking danger level in', currentGalaxy.name);
                // This is where we could adjust danger levels or trigger special events
            }, DANGER_LEVEL_INTERVAL);
        }

        // Clean up intervals on component unmount or when dependencies change
        return () => {
            if (spawnInterval) clearInterval(spawnInterval);
            if (dangerInterval) clearInterval(dangerInterval);
        };
    }, [currentGalaxy, attemptEnemySpawn]);

    // Don't render anything until we've initialized with a valid currentGalaxy
    if (!currentGalaxyId) {
        return null;
    }

    return null; // This component doesn't render anything
};

export default EnemySpawner;
