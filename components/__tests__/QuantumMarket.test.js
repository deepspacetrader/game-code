import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MarketProvider } from '../../context/MarketplaceContext';
import { UIProvider } from '../../context/UIContext';
import QuantumMarket from '../QuantumMarket';

// Mock the useMarketplace and useUI hooks
jest.mock('../../context/MarketplaceContext', () => ({
  ...jest.requireActual('../../context/MarketplaceContext'),
  useMarketplace: jest.fn()
}));

jest.mock('../../context/UIContext', () => ({
  ...jest.requireActual('../../context/UIContext'),
  useUI: jest.fn()
}));

// Mock the component's module to track function calls
jest.mock('../QuantumMarket', () => {
  const originalModule = jest.requireActual('../QuantumMarket');
  return {
    ...originalModule,
    executeBuy: jest.fn(),
    executeSell: jest.fn()
  };
});

// Test data
const mockInventory = [
  { name: 'Quantum Scanner', price: 1000, quantity: 2 },
  { name: 'Hover Boots', price: 750, quantity: 1 }
];

const mockDisplayCells = [
  { itemId: 'item1', name: 'Quantum Scanner', price: 1000, basePrice: 900 },
  { itemId: 'item2', name: 'Hover Boots', price: 750, basePrice: 800 }
];

// Mock context values
const mockMarketplaceContext = {
  credits: 5000,
  displayCells: mockDisplayCells,
  inventory: mockInventory,
  purchaseHistory: {
    'Quantum Scanner': [950, 900, 1000],
    'Hover Boots': [780, 800, 820]
  },
  handleBuyClick: jest.fn(),
  handleSellAll: jest.fn(),
  quantumInventory: ['QuantumMarket']
};

const mockUIContext = {
  improvedUILevel: 100,
  showNotification: jest.fn(),
  hideNotification: jest.fn()
};

describe('QuantumMarket', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup context mocks
    const { useMarketplace } = require('../../context/MarketplaceContext');
    const { useUI } = require('../../context/UIContext');
    
    useMarketplace.mockReturnValue(mockMarketplaceContext);
    useUI.mockReturnValue(mockUIContext);
    
    // Mock timers
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const renderComponent = () => {
    return render(
      <UIProvider>
        <MarketProvider>
          <QuantumMarket />
        </MarketProvider>
      </UIProvider>
    );
  };

  it('renders when unlocked and UI level is sufficient', () => {
    renderComponent();
    
    // Check for main elements using role and text
    expect(screen.getByRole('heading', { name: /quantum market/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buy now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sell now/i })).toBeInTheDocument();
    
    // Check for sliders and their labels
    expect(screen.getByLabelText('Buy % of Credits:')).toBeInTheDocument();
    expect(screen.getByLabelText('Sell % of Inventory:')).toBeInTheDocument();
    
    // Check for auto-trading button
    expect(screen.getByRole('button', { name: /start auto-trading/i })).toBeInTheDocument();
  });

  it('does not render when QuantumMarket is not in quantumInventory', () => {
    const { useMarketplace } = require('../../context/MarketplaceContext');
    useMarketplace.mockReturnValueOnce({
      ...mockMarketplaceContext,
      quantumInventory: []
    });
    
    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  it('does not render when improvedUILevel is less than 100', () => {
    const { useUI } = require('../../context/UIContext');
    useUI.mockReturnValueOnce({
      ...mockUIContext,
      improvedUILevel: 50
    });
    
    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  it('displays correct credit and inventory values', () => {
    renderComponent();
    
    // Check credits display using test ID for more reliable targeting
    const creditsElement = screen.getByTestId('credits-display');
    expect(creditsElement).toHaveTextContent('$5000.00');
    
    // Check inventory value (1000*2 + 750*1 = 2750)
    const inventoryValueElement = screen.getByTestId('inventory-value-display');
    expect(inventoryValueElement).toHaveTextContent('$2750.00');
  });

  it('allows adjusting buy and sell percentages', () => {
    renderComponent();
    
    // Test buy percentage slider
    const buySlider = screen.getByLabelText('Buy % of Credits:');
    fireEvent.change(buySlider, { target: { value: '25' } });
    
    // Find the displayed percentage near the slider
    const buyPercentageDisplay = screen.getByTestId('buy-percentage-display');
    expect(buyPercentageDisplay).toHaveTextContent('25%');
    
    // Test sell percentage slider
    const sellSlider = screen.getByLabelText('Sell % of Inventory:');
    fireEvent.change(sellSlider, { target: { value: '75' } });
    
    // Find the displayed percentage near the slider
    const sellPercentageDisplay = screen.getByTestId('sell-percentage-display');
    expect(sellPercentageDisplay).toHaveTextContent('75%');
  });

  it('executes buy and sell actions when buttons are clicked', () => {
    renderComponent();
    
    // Test buy button using role and name
    const buyButton = screen.getByRole('button', { name: /buy now/i });
    fireEvent.click(buyButton);
    
    // Verify the correct function was called with the right context
    expect(mockMarketplaceContext.handleBuyClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Quantum Scanner' }),
      undefined,
      expect.any(Function)
    );
    
    // Test sell button using role and name
    const sellButton = screen.getByRole('button', { name: /sell now/i });
    fireEvent.click(sellButton);
    
    // Verify the sell function was called
    expect(mockMarketplaceContext.handleSellAll).toHaveBeenCalled();
  });

  it('toggles auto-trading on and off', () => {
    renderComponent();
    
    // Find and click the toggle button using role and name
    const toggleButton = screen.getByRole('button', { name: /start auto-trading/i });
    fireEvent.click(toggleButton);
    
    // Verify UI updates when auto-trading is active
    expect(screen.getByRole('button', { name: /stop auto-trading/i })).toBeInTheDocument();
    expect(screen.getByText(/auto-trading is active/i)).toBeInTheDocument();
    
    // Verify initial buy/sell calls
    expect(mockMarketplaceContext.handleBuyClick).toHaveBeenCalled();
    expect(mockMarketplaceContext.handleSellAll).toHaveBeenCalled();
    
    // Fast-forward time to trigger the interval
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    
    // Verify functions were called again after interval
    expect(mockMarketplaceContext.handleBuyClick).toHaveBeenCalledTimes(2);
    expect(mockMarketplaceContext.handleSellAll).toHaveBeenCalledTimes(2);
    
    // Stop auto-trading
    fireEvent.click(screen.getByRole('button', { name: /stop auto-trading/i }));
    
    // Verify UI updates when auto-trading is stopped
    expect(screen.getByRole('button', { name: /start auto-trading/i })).toBeInTheDocument();
    expect(screen.getByText(/auto-trading is inactive/i)).toBeInTheDocument();
    
    // Fast-forward time again to ensure no more calls
    const previousBuyCalls = mockMarketplaceContext.handleBuyClick.mock.calls.length;
    const previousSellCalls = mockMarketplaceContext.handleSellAll.mock.calls.length;
    
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    
    // Verify no additional calls were made
    expect(mockMarketplaceContext.handleBuyClick).toHaveBeenCalledTimes(previousBuyCalls);
    expect(mockMarketplaceContext.handleSellAll).toHaveBeenCalledTimes(previousSellCalls);
  });

  it('disables buttons when auto-trading is active', () => {
    renderComponent();
    
    // Start auto-trading
    fireEvent.click(screen.getByRole('button', { name: /start auto-trading/i }));
    
    // Verify all interactive elements are disabled
    expect(screen.getByRole('button', { name: /buy now/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /sell now/i })).toBeDisabled();
    
    // Verify sliders are disabled
    expect(screen.getByLabelText('Buy % of Credits:')).toBeDisabled();
    expect(screen.getByLabelText('Sell % of Inventory:')).toBeDisabled();
    
    // Verify the toggle button is still enabled
    expect(screen.getByRole('button', { name: /stop auto-trading/i })).toBeEnabled();
  });

  it('cleans up interval on unmount', () => {
    // Spy on window.clearInterval
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    
    // Render the component and unmount immediately
    const { unmount } = renderComponent();
    unmount();
    
    // Verify clearInterval was called
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    // Clean up the spy
    clearIntervalSpy.mockRestore();
    
    // Fast-forward time to ensure no timers are running
    act(() => {
      jest.runAllTimers();
    });
    
    // Verify no unexpected calls were made
    expect(mockMarketplaceContext.handleBuyClick).not.toHaveBeenCalled();
    expect(mockMarketplaceContext.handleSellAll).not.toHaveBeenCalled();
  });
});
