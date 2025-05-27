import { useEffect, useCallback } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useUI } from '../context/UIContext';
import { useGame } from '../context/GameContext';
import { ENEMY_TYPES } from './Enemy';

const ENEMY_SPAWN_INTERVAL = 30000; // 30 seconds between spawn checks in dangerous zones
const DANGER_LEVEL_INTERVAL = 60000; // 1 minute between danger level checks

const EnemySpawner = () => {
  const { currentGalaxy } = useGame();
  const { showEnemyEncounter } = useUI();
  const { triggerRandomEvent } = useMarketplace();

  // Function to get a random enemy type based on the spawnEnemyType
  const getRandomEnemyType = (spawnEnemyType) => {
    const enemyTypes = Object.values(ENEMY_TYPES);
    return (spawnEnemyType && enemyTypes[spawnEnemyType - 1]) || 
           enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
  };

  // Function to handle enemy spawn attempt
  const attemptEnemySpawn = useCallback(() => {
    if (!currentGalaxy) return;

    // Only attempt to spawn enemies in dangerous or war zones
    if (currentGalaxy.danger || currentGalaxy.war) {
      const randomEvent = triggerRandomEvent();
      
      if (randomEvent && randomEvent.spawnEnemyType) {
        const enemyType = getRandomEnemyType(randomEvent.spawnEnemyType);
        showEnemyEncounter({
          type: enemyType,
          rank: 'D', // Default rank, can be randomized if needed
          reason: 'random_encounter',
          homeGalaxy: currentGalaxy.name
        });
      }
    }
  }, [currentGalaxy, showEnemyEncounter, triggerRandomEvent]);

  // Set up timers for enemy spawning and danger level checks
  useEffect(() => {
    if (!currentGalaxy) return;

    // Only set up timers in dangerous or war zones
    if (currentGalaxy.danger || currentGalaxy.war) {
      const spawnInterval = setInterval(attemptEnemySpawn, ENEMY_SPAWN_INTERVAL);
      
      // Check danger level periodically
      const dangerInterval = setInterval(() => {
        // This is where we could adjust danger levels or trigger special events
        console.log(`Danger level check in ${currentGalaxy.name}`);
      }, DANGER_LEVEL_INTERVAL);

      return () => {
        clearInterval(spawnInterval);
        clearInterval(dangerInterval);
      };
    }
  }, [currentGalaxy, attemptEnemySpawn]);

  return null; // This component doesn't render anything
};

export default EnemySpawner;
