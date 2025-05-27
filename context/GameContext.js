import React, { createContext, useContext, useState, useEffect } from 'react';
import galaxiesData from '../data/galaxies.json';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [currentGalaxy, setCurrentGalaxy] = useState(null);
  const [galaxies, setGalaxies] = useState([]);
  const [isTraveling, setIsTraveling] = useState(false);

  // Load galaxies and set initial galaxy
  useEffect(() => {
    const loadedGalaxies = galaxiesData.galaxies;
    setGalaxies(loadedGalaxies);
    
    // Set initial galaxy (could be loaded from save)
    const startingGalaxy = loadedGalaxies.find(galaxy => galaxy.galaxyId === 10); // Driftspire Helix as starting point
    if (startingGalaxy) {
      setCurrentGalaxy(startingGalaxy);
    }
  }, []);

  // Function to travel to a new galaxy
  const travelToGalaxy = (galaxyId) => {
    const targetGalaxy = galaxies.find(g => g.galaxyId === galaxyId);
    if (targetGalaxy) {
      setIsTraveling(true);
      // Simulate travel time
      setTimeout(() => {
        setCurrentGalaxy(targetGalaxy);
        setIsTraveling(false);
      }, 2000); // 2 second travel time
    }
  };

  return (
    <GameContext.Provider value={{
      currentGalaxy,
      galaxies,
      isTraveling,
      travelToGalaxy,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default GameContext;
