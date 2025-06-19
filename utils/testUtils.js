/**
 * Test utilities for Quantum components
 */

/**
 * Creates a mock marketplace context value for testing
 * @param {Object} overrides - Values to override the default mock
 * @returns {Object} Mocked marketplace context
 */
export const createMockMarketplaceContext = (overrides = {}) => ({
    quantumInventory: [],
    marketRef: { current: null },
    quantumPower: false,
    isQuantumScanActive: false,
    toggleQuantumAbility: jest.fn(),
    ...overrides,
});

/**
 * Creates a mock UI context value for testing
 * @param {Object} overrides - Values to override the default mock
 * @returns {Object} Mocked UI context
 */
export const createMockUIContext = (overrides = {}) => ({
    showNotification: jest.fn(),
    hideNotification: jest.fn(),
    ...overrides,
});

/**
 * Sets up the DOM for testing components that interact with market items
 * @returns {Object} Object containing the marketRef and cleanup function
 */
export const setupMarketDOM = () => {
    // Create a container for the market
    const container = document.createElement('div');
    container.id = 'market-container';

    // Add some test market items
    container.innerHTML = `
    <div class="market-item" data-testid="market-item-1">
      <div class="item-name">Quantum Scanner</div>
      <div class="item-price">1000</div>
    </div>
    <div class="market-item" data-testid="market-item-2">
      <div class="item-name">Hover Boots</div>
      <div class="item-price">750</div>
    </div>
  `;

    document.body.appendChild(container);

    // Create a ref to the container
    const marketRef = { current: container };

    // Return the ref and a cleanup function
    return {
        marketRef,
        cleanup: () => {
            document.body.removeChild(container);
        },
    };
};

/**
 * Waits for a specified amount of time (useful for testing timers)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Resolves after the specified time
 */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mocks the window.matchMedia function for tests
 */
export const mockMatchMedia = () => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // Deprecated
            removeListener: jest.fn(), // Deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
};

/**
 * Sets up all necessary mocks for testing Quantum components
 */
export const setupTestEnvironment = () => {
    // Mock any global objects or functions needed for tests
    mockMatchMedia();

    // Mock any other browser APIs used by your components
    Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

    // Return a cleanup function
    return () => {
        // Cleanup code if needed
    };
};
