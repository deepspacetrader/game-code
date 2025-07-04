import { useEffect, useCallback, useMemo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ENEMY_TYPES as ENEMY_TYPES_IMPORT } from './Enemy';
import galaxiesData from '../../data/galaxies.json';
import enemiesData from '../../data/enemies.json';

const ENEMY_SPAWN_INTERVAL = 300; // 30 seconds between spawn checks in dangerous zones
const DANGER_LEVEL_INTERVAL = 60000; // 1 minute between danger level checks

const EnemySpawner = () => {
    const {
        setCurrentEnemy,
        triggerRandomEvent,
        currentGalaxy: currentGalaxyId,
        currentEnemy,
        gameStarted,
    } = useMarketplace();
    // Get the full galaxy object using the currentGalaxy ID
    const currentGalaxy = useMemo(() => {
        if (!currentGalaxyId) return null;
        return galaxiesData.galaxies.find((g) => g.galaxyId === currentGalaxyId) || null;
    }, [currentGalaxyId]);

    // Function to get allowed enemy types based on galaxy
    const getAllowedEnemyTypes = (galaxy) => {
        if (!galaxy) return ['Scavenger'];
        if (galaxy.war) return ['Scavenger', 'Thief', 'Thug', 'Military'];
        if (galaxy.danger) return ['Scavenger', 'Thief', 'Thug'];
        return ['Scavenger'];
    };

    // Function to get a random enemy from enemies.json
    const getRandomEnemy = useCallback(() => {
        const allowedTypes = getAllowedEnemyTypes(currentGalaxy);
        const enemies = enemiesData.enemies.filter((e) => allowedTypes.includes(e.name));
        if (!enemies || enemies.length === 0) return null;
        const base = enemies[Math.floor(Math.random() * enemies.length)];
        // Randomize health and credits as in Enemy.js
        const health = Math.floor(Math.random() * (base.health + 1));
        return {
            id: `enemy_${Date.now()}`,
            enemyId: base.enemyId,
            type: base.name,
            name: base.name,
            health,
            maxHealth: health,
            rank: base.rank,
            damage: Math.floor(health * 0.1),
            credits: Math.floor(health * 5),
            weapons: base.weapons || [],
            shield: base.shield,
            stealth: base.stealth,
            homeGalaxy: base.homeGalaxy,
            language: base.languageRange[0],
            statusEffects: [],
            reason: 'random_encounter',
        };
    }, [currentGalaxy]);

    // Function to handle enemy spawn attempt
    const attemptEnemySpawn = useCallback(() => {
        if (!gameStarted) return;
        if (!currentGalaxy) return;
        if (currentEnemy) return;
        if (Math.random() > 0.25) return;
        const enemy = getRandomEnemy();
        if (enemy) {
            setCurrentEnemy(enemy);
        }
    }, [gameStarted, currentGalaxy, setCurrentEnemy, getRandomEnemy, currentEnemy]);

    // Set up timers for enemy spawning and danger level checks
    useEffect(() => {
        if (!gameStarted || !currentGalaxy) {
            return;
        }

        let spawnInterval = setInterval(() => {
            attemptEnemySpawn();
        }, ENEMY_SPAWN_INTERVAL);

        let dangerInterval = setInterval(() => {
            console.log('Checking danger level in', currentGalaxy.name);
        }, DANGER_LEVEL_INTERVAL);

        return () => {
            clearInterval(spawnInterval);
            clearInterval(dangerInterval);
        };
    }, [gameStarted, currentGalaxy, attemptEnemySpawn]);

    // Don't render anything until we've initialized with a valid currentGalaxy
    if (!currentGalaxyId) {
        return null;
    }

    return null; // This component doesn't render anything
};

export default EnemySpawner;
