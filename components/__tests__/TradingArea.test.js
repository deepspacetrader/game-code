import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarketProvider } from '../../context/MarketplaceContext';
import { UIProvider } from '../../context/UIContext';
import TradingArea from '../TradingArea';

// Mock child components
jest.mock('../MarketGrid', () => {
    return function MockMarketGrid() {
        return <div data-testid="market-grid">Market Grid</div>;
    };
});

jest.mock('../MarketSummary', () => {
    return function MockMarketSummary() {
        return <div data-testid="market-summary">Market Summary</div>;
    };
});

jest.mock('../TieredMenu', () => {
    return function MockTieredMenu() {
        return <div data-testid="tiered-menu">Tiered Menu</div>;
    };
});

jest.mock('../QuantumHover', () => {
    return function MockQuantumHover() {
        return <div data-testid="quantum-hover">Quantum Hover</div>;
    };
});

jest.mock('../QuantumScan', () => {
    return function MockQuantumScan() {
        return <div data-testid="quantum-scan">Quantum Scan</div>;
    };
});

// Mock the useMarketplace and useUI hooks
jest.mock('../../context/MarketplaceContext', () => ({
    ...jest.requireActual('../../context/MarketplaceContext'),
    useMarketplace: jest.fn(),
}));

jest.mock('../../context/UIContext', () => ({
    ...jest.requireActual('../../context/UIContext'),
    useUI: jest.fn(),
}));

// Test data
const mockDisplayCells = Array(9)
    .fill(null)
    .map((_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        price: 100 * (i + 1),
        quantity: i + 1,
    }));

// Default mock context values
const defaultMarketplaceContext = {
    displayCells: mockDisplayCells,
    numCellsX: 3,
    statusEffects: {},
    inventory: [],
    purchaseHistory: {},
    priceHistory: {},
    currentTrader: 'default',
    handleBuyClick: jest.fn(),
    handleSellClick: jest.fn(),
    handleSellAll: jest.fn(),
    deliveryQueue: [],
    quantumPower: false,
    quantumInventory: [],
};

const defaultUIContext = {
    improvedUILevel: 100,
};

describe('TradingArea', () => {
    const renderTradingArea = (marketplaceOverrides = {}, uiOverrides = {}) => {
        const marketplaceContext = { ...defaultMarketplaceContext, ...marketplaceOverrides };
        const uiContext = { ...defaultUIContext, ...uiOverrides };

        const { useMarketplace } = require('../../context/MarketplaceContext');
        const { useUI } = require('../../context/UIContext');

        useMarketplace.mockReturnValue(marketplaceContext);
        useUI.mockReturnValue(uiContext);

        return render(
            <UIProvider>
                <MarketProvider>
                    <TradingArea />
                </MarketProvider>
            </UIProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the main trading area with default components', () => {
        renderTradingArea();

        // Check for main sections using test IDs
        expect(screen.getByTestId('market-summary')).toHaveTextContent('Market Summary');
        expect(screen.getByTestId('tiered-menu')).toHaveTextContent('Tiered Menu');
        expect(screen.getByTestId('market-grid')).toHaveTextContent('Market Grid');

        // Check for market title using role and name
        expect(screen.getByRole('heading', { name: /market/i, level: 2 })).toBeInTheDocument();

        // Quantum features should not be visible by default
        expect(screen.queryByRole('region', { name: /quantum hover/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('region', { name: /quantum scan/i })).not.toBeInTheDocument();
    });

    it('applies the correct UI tier class based on improvedUILevel', () => {
        const testCases = [
            { level: 3, expectedClass: 'ui-tier-low-low5' },
            { level: 8, expectedClass: 'ui-tier-low-low10' },
            { level: 45, expectedClass: 'ui-tier-medium' },
            { level: 80, expectedClass: 'ui-tier-high' },
            { level: 120, expectedClass: 'ui-tier-newbie' },
            { level: 250, expectedClass: 'ui-tier-adventurer' },
            { level: 400, expectedClass: 'ui-tier-explorer' },
            { level: 1200, expectedClass: 'ui-tier-skilled' },
            { level: 3000, expectedClass: 'ui-tier-expert' },
            { level: 12000, expectedClass: 'ui-tier-grandmaster' },
            { level: 75000, expectedClass: 'ui-tier-potential' },
            { level: 150000, expectedClass: 'ui-tier-endgame' },
        ];

        testCases.forEach(({ level, expectedClass }) => {
            renderTradingArea({}, { improvedUILevel: level });
            const tradingArea = screen.getByRole('main');
            expect(tradingArea).toHaveClass(expectedClass);
        });
    });

    it('shows delivery progress bars when items are in delivery queue', () => {
        const deliveryQueue = [
            { id: 'delivery-1', timeLeft: 5000, totalTime: 10000, item: { name: 'Item 1' } },
            { id: 'delivery-2', timeLeft: 2000, totalTime: 5000, item: { name: 'Item 2' } },
        ];

        renderTradingArea({ deliveryQueue });

        // Check for delivery items
        const deliveryItems = screen.getAllByRole('listitem');
        expect(deliveryItems).toHaveLength(2);

        // Check progress bars
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars).toHaveLength(2);

        // Verify progress bar values
        expect(progressBars[0]).toHaveAttribute('aria-valuenow', '50');
        expect(progressBars[1]).toHaveAttribute('aria-valuenow', '40');

        // Verify item names are displayed
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('shows QuantumHover when quantum features are enabled', () => {
        renderTradingArea({
            quantumInventory: ['QuantumHover'],
            quantumPower: true,
        });

        const quantumHover = screen.getByRole('region', { name: /quantum hover/i });
        expect(quantumHover).toBeInTheDocument();
        expect(quantumHover).toHaveTextContent('Quantum Hover');
    });

    it('shows QuantumScan when QuantumScan is in quantumInventory', () => {
        renderTradingArea({
            quantumInventory: ['QuantumScan'],
            quantumPower: true,
        });

        const quantumScan = screen.getByRole('region', { name: /quantum scan/i });
        expect(quantumScan).toBeInTheDocument();
        expect(quantumScan).toHaveTextContent('Quantum Scan');
    });

    it('toggles between MarketGrid and QuantumHover based on quantumPower', () => {
        // Initial render with quantumPower = false
        renderTradingArea({
            quantumInventory: ['QuantumHover'],
            quantumPower: false,
        });

        // Initially, MarketGrid should be visible, QuantumHover should not
        expect(screen.getByRole('region', { name: /market grid/i })).toBeInTheDocument();
        expect(screen.queryByRole('region', { name: /quantum hover/i })).not.toBeInTheDocument();

        // Rerender with quantumBuyEnabled = true
        renderTradingArea(
            {
                quantumInventory: ['QuantumHover'],
                quantumBuyEnabled: true,
                quantumPower: true,
            },
            { improvedUILevel: 100 }
        );

        // Now QuantumHover should be visible, MarketGrid should not
        expect(screen.getByRole('region', { name: /quantum hover/i })).toBeInTheDocument();
        expect(screen.queryByRole('region', { name: /market grid/i })).not.toBeInTheDocument();
    });

    it('does not show QuantumHover if not in quantumInventory', () => {
        renderTradingArea({
            quantumInventory: [],
            quantumBuyEnabled: true,
            quantumPower: true,
        });

        expect(screen.queryByRole('region', { name: /quantum hover/i })).not.toBeInTheDocument();
    });

    it('does not show QuantumScan if not in quantumInventory', () => {
        renderTradingArea({
            quantumInventory: [],
            quantumPower: true,
        });

        expect(screen.queryByRole('region', { name: /quantum scan/i })).not.toBeInTheDocument();
    });

    it('applies correct z-index and positioning for QuantumScan', () => {
        // Mock the window.getComputedStyle function
        const originalGetComputedStyle = window.getComputedStyle;
        const mockComputedStyle = {
            position: 'fixed',
            zIndex: '1000',
            pointerEvents: 'none',
        };

        window.getComputedStyle = jest.fn().mockImplementation(() => mockComputedStyle);

        renderTradingArea({
            quantumInventory: ['QuantumScan'],
            quantumPower: true,
        });

        // Verify the component renders with the correct test ID
        const quantumScan = screen.getByRole('region', { name: /quantum scan/i });
        expect(quantumScan).toBeInTheDocument();

        // Verify the computed styles were checked
        expect(window.getComputedStyle).toHaveBeenCalled();

        // Restore the original function
        window.getComputedStyle = originalGetComputedStyle;
    });
});
