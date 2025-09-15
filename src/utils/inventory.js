/**
 * Utility functions for inventory management
 */

/**
 * Get the total number of quantum processors in the player's inventory
 * @param {Object} inventory - The player's inventory object
 * @returns {number} Total count of quantum processors
 */
export const getTotalQuantumProcessors = (inventory = {}) => {
    if (!inventory || !inventory.quantumProcessors) return 0;
    
    // If it's an array, count the total quantity
    if (Array.isArray(inventory.quantumProcessors)) {
        return inventory.quantumProcessors.reduce((total, item) => total + (item.quantity || 1), 0);
    }
    
    // If it's a number, return it directly
    if (typeof inventory.quantumProcessors === 'number') {
        return inventory.quantumProcessors;
    }
    
    // Default to 0 if the format is unexpected
    return 0;
};

/**
 * Get the total quantity of a specific item in the inventory
 * @param {Object} inventory - The player's inventory object
 * @param {string} itemId - The ID of the item to count
 * @returns {number} Total quantity of the specified item
 */
export const getItemQuantity = (inventory = {}, itemId) => {
    if (!inventory || !inventory.items) return 0;
    
    const item = inventory.items.find(item => item.id === itemId);
    return item ? (item.quantity || 1) : 0;
};

/**
 * Check if the player has a specific item in their inventory
 * @param {Object} inventory - The player's inventory object
 * @param {string} itemId - The ID of the item to check
 * @param {number} [minQuantity=1] - Minimum required quantity (default: 1)
 * @returns {boolean} True if the player has the item in the required quantity
 */
export const hasItem = (inventory = {}, itemId, minQuantity = 1) => {
    return getItemQuantity(inventory, itemId) >= minQuantity;
};
