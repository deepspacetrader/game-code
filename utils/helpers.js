// Utility helpers for Marketplace
/**
 * Returns a random integer between min and max (inclusive).
 */
export const randomInt = (x, y, reject) => {
    let result;
    if (reject) {
        do {
            result = Math.floor(Math.random() * (reject - x)) + x;
        } while (result === reject);
    } else {
        result = Math.floor(Math.random() * (y - x)) + x;
    }
    return result;
};

export const randomFloatRange = (x, y) => {
    return Math.random() * (y - x) + x;
};

/**
 * Returns a new array with elements shuffled.
 */
export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
