import React from 'react';
import { render, act, screen } from '@testing-library/react';
import { MarketProvider } from '../../context/MarketplaceContext';
import QuantumScan from '../QuantumScan';

// Mock the useMarketplace hook
jest.mock('../../context/MarketplaceContext', () => ({
    ...jest.requireActual('../../context/MarketplaceContext'),
    useMarketplace: jest.fn(),
}));

// Helper function to render the component with a test wrapper
const renderWithProvider = (props = {}) => {
    const defaultProps = {
        quantumInventory: ['QuantumScan'],
        marketRef: { current: document.createElement('div') },
        quantumPower: true,
        isQuantumScanActive: false,
        ...props,
    };

    const { useMarketplace } = require('../../context/MarketplaceContext');
    useMarketplace.mockReturnValue(defaultProps);

    // Setup test container with market items
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'market-container');

    const item1 = document.createElement('div');
    item1.className = 'market-item';
    item1.setAttribute('data-testid', 'market-item-1');
    item1.textContent = 'Item 1';

    const item2 = document.createElement('div');
    item2.className = 'market-item';
    item2.setAttribute('data-testid', 'market-item-2');
    item2.textContent = 'Item 2';

    container.appendChild(item1);
    container.appendChild(item2);
    defaultProps.marketRef.current = container;
    document.body.appendChild(container);

    const utils = render(
        <MarketProvider>
            <QuantumScan />
        </MarketProvider>
    );

    return {
        ...utils,
        container,
        cleanup: () => {
            document.body.removeChild(container);
        },
    };
};

describe('QuantumScan', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('does not activate scan when not unlocked', () => {
        const { cleanup } = renderWithProvider({
            quantumInventory: [], // Not unlocked
            quantumPower: false,
            isQuantumScanActive: false,
        });

        const items = screen.getAllByTestId(/market-item-\d+/);
        items.forEach((item) => {
            expect(item).not.toHaveClass('quantum-scan-active');
        });

        cleanup();
    });

    it('activates scan effect when isQuantumScanActive is true', () => {
        jest.useFakeTimers();

        const { cleanup } = renderWithProvider({
            isQuantumScanActive: true,
        });

        // Fast-forward time to trigger the scan effect
        act(() => {
            jest.advanceTimersByTime(100);
        });

        const items = screen.getAllByTestId(/market-item-\d+/);
        items.forEach((item) => {
            expect(item).toHaveClass('quantum-scan-active');
        });

        // Fast-forward to after the scan effect should be removed
        act(() => {
            jest.advanceTimersByTime(2500);
        });

        items.forEach((item) => {
            expect(item).not.toHaveClass('quantum-scan-active');
        });

        cleanup();
    });

    it('cleans up intervals and classes on unmount', () => {
        jest.useFakeTimers();

        const { unmount, cleanup } = renderWithProvider({
            isQuantumScanActive: true,
        });

        // Trigger the effect
        act(() => {
            jest.advanceTimersByTime(100);
        });

        // Unmount the component
        unmount();
        cleanup();

        // Check if intervals are cleared by advancing time
        expect(() => {
            act(() => {
                jest.advanceTimersByTime(1000);
            });
        }).not.toThrow();
    });
});
