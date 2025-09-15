import { useEffect, useCallback, useMemo } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import galaxiesData from '../../data/galaxies.json';
import enemiesData from '../../data/enemies.json';

const ENEMY_SPAWN_INTERVAL = 300; // 30 seconds between spawn checks in dangerous zones
const DANGER_LEVEL_INTERVAL = 60000; // 1 minute between danger level checks

const EnemySpawner = () => {
    const {
        setCurrentEnemy,
        triggerRandomMajorEvent,
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
        if (!galaxy) return [];
        if (galaxy.war) return ['Scavenger', 'Thief', 'Thug', 'Military'];
        if (galaxy.danger) return ['Scavenger', 'Thief', 'Thug'];
        return []; // No enemies in safe galaxies
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
            homeGalaxy: currentGalaxy?.name || 'Unknown',
            language: Array.isArray(base.languageRange) ? base.languageRange[0] : 'EN',
            statusEffects: [],
            reason: base.reason || 'Random encounter',
        };
    }, [currentGalaxy]);

    // Function to handle enemy spawn attempt
    const attemptEnemySpawn = useCallback(() => {
        if (!gameStarted) {
            console.log('Game not started, not spawning enemy');
            return;
        }
        if (!currentGalaxy) {
            console.log('No current galaxy, not spawning enemy');
            return;
        }
        if (currentEnemy) {
            console.log('Enemy already exists, not spawning new one');
            return;
        }

        // Only spawn in dangerous or war galaxies
        if (!currentGalaxy.danger && !currentGalaxy.war) {
            console.log('Not a dangerous or war galaxy, not spawning enemy');
            return;
        }

        // 50% chance to spawn an enemy in dangerous/war zones
        if (Math.random() > 0.5) {
            console.log('Spawn chance failed');
            return;
        }
        const enemy = getRandomEnemy();
        if (enemy) {
            setCurrentEnemy(enemy);
        }
    }, [gameStarted, currentGalaxy, setCurrentEnemy, getRandomEnemy, currentEnemy]);

    // Set up timers for enemy spawning and danger level checks
    useEffect(() => {
        if (!gameStarted || !currentGalaxy) {
            // console.log('Game not started or no current galaxy');
            return;
        }

        // Only set up spawner in dangerous or war galaxies
        if (!currentGalaxy.danger && !currentGalaxy.war) {
            console.log('Not a dangerous or war galaxy, disabling spawner');
            return;
        }

        console.log('Setting up enemy spawner in', currentGalaxy.name);

        let spawnInterval = setInterval(() => {
            console.log('Attempting to spawn enemy...');
            attemptEnemySpawn();
        }, ENEMY_SPAWN_INTERVAL);

        let dangerInterval = setInterval(() => {
            console.log('Checking danger level in', currentGalaxy.name);
            // Increase spawn chance based on danger level
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
