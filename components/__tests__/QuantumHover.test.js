import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MarketProvider } from '../../context/MarketplaceContext';
import { UIProvider } from '../../context/UIContext';
import QuantumHover from '../QuantumHover';

// Mock the useMarketplace and useUI hooks
jest.mock('../../context/MarketplaceContext', () => ({
  ...jest.requireActual('../../context/MarketplaceContext'),
  useMarketplace: jest.fn()
}));

jest.mock('../../context/UIContext', () => ({
  ...jest.requireActual('../../context/UIContext'),
  useUI: jest.fn()
}));

// Mock the calculateVolatility, calculateTrend, and other utility functions
jest.mock('../QuantumHover', () => {
  const originalModule = jest.requireActual('../QuantumHover');
  return {
    ...originalModule,
    calculateVolatility: jest.fn(),
    calculateTrend: jest.fn(),
    calculatePotentialProfit: jest.fn(),
    getRecommendation: jest.fn()
  };
});

// Test data
const mockMarket = [
  {
    itemId: 'item1',
    name: 'Quantum Scanner',
    price: 1000,
    basePrice: 900,
    quantity: 5
  },
  {
    itemId: 'item2',
    name: 'Hover Boots',
    price: 750,
    basePrice: 800,
    quantity: 3
  }
];

// Mock context values
const mockMarketplaceContext = {
  statusEffects: { 'Quantum Processor': { level: 2 } },
  purchaseHistory: {
    'Quantum Scanner': [950, 900, 1000],
    'Hover Boots': [780, 800, 820]
  },
  priceHistory: {
    'trader1-0': [{ p: 950 }, { p: 900 }, { p: 1000 }],
    'trader1-1': [{ p: 780 }, { p: 800 }, { p: 820 }]
  },
  currentTrader: 'trader1',
  displayCells: [
    { itemId: 'item1' },
    { itemId: 'item2' }
  ],
  inventory: [
    { name: 'Quantum Scanner', quantity: 2 },
    { name: 'Hover Boots', quantity: 1 }
  ],
  credits: 5000,
  deliveryQueue: [],
  numCellsX: 3,
  checkQuantumTradeDelay: jest.fn().mockReturnValue(0),
  updateLastQuantumTradeTime: jest.fn(),
  handleBuyClick: jest.fn(),
  handleSellClick: jest.fn(),
  handleSellAll: jest.fn(),
  setStatusEffects: jest.fn()
};

const mockUIContext = {
  quantumInventory: ['QuantumHover'],
  showNotification: jest.fn(),
  hideNotification: jest.fn()
};

// Mock the utility functions
const { 
  calculateVolatility, 
  calculateTrend, 
  calculatePotentialProfit, 
  getRecommendation 
} = require('../QuantumHover');

describe('QuantumHover', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    calculateVolatility.mockReturnValue(15);
    calculateTrend.mockReturnValue('up');
    calculatePotentialProfit.mockReturnValue(-10);
    getRecommendation.mockReturnValue('Buy');
    
    // Setup context mocks
    const { useMarketplace } = require('../../context/MarketplaceContext');
    const { useUI } = require('../../context/UIContext');
    
    useMarketplace.mockReturnValue(mockMarketplaceContext);
    useUI.mockReturnValue(mockUIContext);
  });

  const renderComponent = () => {
    return render(
      <UIProvider>
        <MarketProvider>
          <QuantumHover market={mockMarket} />
          <div data-testid="market-item-0" data-item-id="item1">Quantum Scanner</div>
          <div data-testid="market-item-1" data-item-id="item2">Hover Boots</div>
        </MarketProvider>
      </UIProvider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    // The component doesn't render anything by default, so we just test that it doesn't throw
  });

  it('shows analysis when hovering over a market item', async () => {
    // Mock the analysis data
    const mockAnalysis = {
      itemId: 'item1',
      volatility: 15,
      trend: 'up',
      potentialProfit: -10,
      avgCost: 950,
      recommendation: 'Buy',
      ownedQty: 2,
      actualProfit: 50
    };
    
    // Mock the analyzeItem function to return our test data
    jest.spyOn(React, 'useCallback').mockImplementation((fn) => {
      return jest.fn().mockImplementation((item) => {
        if (item.itemId === 'item1') return mockAnalysis;
        return null;
      });
    });

    renderComponent();
    
    // Simulate hover over the first market item
    const itemElement = screen.getByTestId('market-item-0');
    fireEvent.mouseMove(itemElement, { clientX: 100, clientY: 100 });
    
    // Wait for the hover effect to trigger
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    // Check if the analysis tooltip is shown using Testing Library queries
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    
    // Check if the analysis data is displayed
    expect(screen.getByText('Quantum Scanner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buy/i })).toBeInTheDocument();
    expect(screen.getByText('Owned: 2')).toBeInTheDocument();
  });

  it('handles trade actions correctly', async () => {
    // Mock the analyzeItem function
    const mockAnalysis = {
      itemId: 'item1',
      volatility: 15,
      trend: 'up',
      potentialProfit: -10,
      avgCost: 950,
      recommendation: 'Buy',
      ownedQty: 2,
      actualProfit: 50
    };
    
    jest.spyOn(React, 'useCallback').mockImplementation((fn) => {
      return jest.fn().mockReturnValue(mockAnalysis);
    });

    renderComponent();
    
    // Simulate hover over the first market item
    const itemElement = screen.getByTestId('market-item-0');
    fireEvent.mouseMove(itemElement, { clientX: 100, clientY: 100 });
    
    // Wait for the hover effect to trigger
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    // Find and click the buy button using role and name
    const buyButton = screen.getByRole('button', { name: /buy/i });
    fireEvent.click(buyButton);
    
    // Check if the buy function was called with the correct arguments
    expect(mockMarketplaceContext.handleBuyClick).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: 'item1' }),
      'trader1',
      expect.any(Function)
    );
    
    // Verify the tooltip is still visible after interaction
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('does not show analysis when Quantum Processor is not active', () => {
    // Mock the context without Quantum Processor
    const { useMarketplace } = require('../../context/MarketplaceContext');
    useMarketplace.mockReturnValue({
      ...mockMarketplaceContext,
      statusEffects: {}
    });

    const { container } = renderComponent();
    
    // Simulate hover over the first market item
    const itemElement = screen.getByTestId('market-item-0');
    fireEvent.mouseMove(itemElement, { clientX: 100, clientY: 100 });
    
    // Check that no tooltip is shown
    const tooltip = container.querySelector('.quantum-hover-tooltip');
    expect(tooltip).not.toBeInTheDocument();
  });

  it('shows correct recommendation based on potential profit', () => {
    // Test different profit scenarios
    const testCases = [
      { profit: -40, expectedRec: 'Strong Buy' },
      { profit: -20, expectedRec: 'Buy' },
      { profit: 0, expectedRec: 'Hold' },
      { profit: 10, expectedRec: 'Sell' },
      { profit: 30, expectedRec: 'Strong Sell' },
    ];

    testCases.forEach(({ profit, expectedRec }) => {
      // Reset mocks
      calculatePotentialProfit.mockReturnValueOnce(profit);
      getRecommendation.mockReturnValueOnce(expectedRec);
      
      // Mock the analyzeItem function
      const { useMarketplace } = require('../../context/MarketplaceContext');
      useMarketplace.mockReturnValueOnce({
        ...mockMarketplaceContext,
        inventory: [{ name: 'Test Item', quantity: 1 }]
      });
      
      const { container } = renderComponent();
      
      // Simulate hover
      const itemElement = screen.getByTestId('market-item-0');
      fireEvent.mouseMove(itemElement, { clientX: 100, clientY: 100 });
      
      // Check the recommendation
      expect(getRecommendation).toHaveBeenCalledWith(
        expect.any(Number), // volatility
        expect.any(String), // trend
        profit // potentialProfit
      );
    });
  });
});
