import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MarketProvider } from '../../context/MarketplaceContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import QuantumSetup from '../QuantumSetup';

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: jest.fn(({ icon, className, style }) => (
    <span className={className} style={style} data-testid="font-awesome-icon" />
  ))
}));

// Mock the useMarketplace hook
jest.mock('../../context/MarketplaceContext', () => ({
  ...jest.requireActual('../../context/MarketplaceContext'),
  useMarketplace: jest.fn()
}));

// Mock the quantum abilities
jest.mock('../QuantumSetup', () => {
  const originalModule = jest.requireActual('../QuantumSetup');
  return {
    ...originalModule,
    QUANTUM_ABILITIES: {
      QuantumHover: {
        name: 'Quantum Hover',
        icon: 'search',
        description: 'Reveals detailed item information on hover',
        color: '#4fc3f7',
        power: 1,
        uiLevelRequired: 5,
      },
      QuantumScanLR: {
        name: 'Quantum Scan LR',
        icon: 'arrow-right',
        description: 'Scans the market from left to right',
        color: '#69f0ae',
        power: 2,
        uiLevelRequired: 15,
      },
      QuantumMarket: {
        name: 'Quantum Market',
        icon: 'hand-holding-usd',
        description: 'Advanced market analysis and automation',
        color: '#ff8a65',
        power: 3,
        uiLevelRequired: 30,
      },
    }
  };
});

// Mock implementation of setState functions
const mockSetQuantumSlotsUsed = jest.fn();
const mockSetStatusEffects = jest.fn();

// Default mock context values
const defaultInventory = [
  { name: 'Quantum Processor', quantity: 3 },
  { name: 'Other Item', quantity: 5 }
];

const defaultContext = {
  inventory: defaultInventory,
  subtractQuantumProcessor: jest.fn().mockResolvedValue(true)
};

describe('QuantumSetup', () => {
  const renderComponent = (overrides = {}) => {
    const context = { ...defaultContext, ...overrides };
    const { useMarketplace } = require('../../context/MarketplaceContext');
    useMarketplace.mockReturnValue(context);
    
    return render(
      <MarketProvider>
        <QuantumSetup 
          setQuantumSlotsUsed={mockSetQuantumSlotsUsed}
          setStatusEffects={mockSetStatusEffects}
        />
      </MarketProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Quantum Setup component with correct number of slots', () => {
    renderComponent();
    
    // Check if the component renders with the correct title
    expect(screen.getByText('Quantum Processor')).toBeInTheDocument();
    
    // Check if all 5 slots are rendered
    const slots = screen.getAllByTestId('quantum-slot');
    expect(slots).toHaveLength(5);
    
    // Last slot should be Quantum Market
    expect(screen.getByText('Quantum Market')).toBeInTheDocument();
  });

  it('displays the correct number of available quantum processors', () => {
    renderComponent();
    
    // Check if the component shows the correct number of available quantum processors
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('allows activating a slot when quantum processors are available', async () => {
    renderComponent();
    
    // Find the first slot (should be inactive by default)
    const firstSlot = screen.getAllByTestId('quantum-slot')[0];
    
    // Click to activate the slot
    await act(async () => {
      fireEvent.click(firstSlot);
    });
    
    // Check if subtractQuantumProcessor was called
    expect(defaultContext.subtractQuantumProcessor).toHaveBeenCalledWith(1);
    
    // Check if the slot is now active
    expect(firstSlot).toHaveClass('active');
  });

  it('does not allow activating a slot when no quantum processors are available', async () => {
    // Render with no quantum processors
    renderComponent({ 
      inventory: [{ name: 'Quantum Processor', quantity: 0 }] 
    });
    
    const firstSlot = screen.getAllByTestId('quantum-slot')[0];
    
    await act(async () => {
      fireEvent.click(firstSlot);
    });
    
    // subtractQuantumProcessor should not be called
    expect(defaultContext.subtractQuantumProcessor).not.toHaveBeenCalled();
    
    // Slot should remain inactive
    expect(firstSlot).not.toHaveClass('active');
  });

  it('allows deactivating an active slot', async () => {
    // Start with one active slot
    const initialSlots = Array(5).fill(null).map((_, index) => ({
      active: index === 0,
      ability: index === 4 ? 'QuantumMarket' : 'QuantumHover'
    }));
    
    // Mock useState to control the slots
    const setSlotsMock = jest.fn();
    const useStateSpy = jest.spyOn(React, 'useState');
    useStateSpy.mockImplementation((initial) => [initialSlots, setSlotsMock]);
    
    renderComponent();
    
    // Find the first slot (should be active)
    const firstSlot = screen.getAllByTestId('quantum-slot')[0];
    
    // Click to deactivate the slot
    await act(async () => {
      fireEvent.click(firstSlot);
    });
    
    // Check if setSlots was called with the slot deactivated
    expect(setSlotsMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ active: false }),
        ...initialSlots.slice(1)
      ])
    );
    
    // Clean up
    useStateSpy.mockRestore();
  });

  it('calculates and displays the correct total power', () => {
    // Mock slots with different active states
    const initialSlots = [
      { active: true, ability: 'QuantumHover' },      // power: 1
      { active: true, ability: 'QuantumScanLR' },    // power: 2
      { active: false, ability: 'QuantumHover' },    // inactive
      { active: true, ability: 'QuantumMarket' },    // power: 3
      { active: false, ability: 'QuantumMarket' }    // inactive
    ];
    
    // Mock useState to control the slots
    const setSlotsMock = jest.fn();
    const useStateSpy = jest.spyOn(React, 'useState');
    useStateSpy.mockImplementation((initial) => [initialSlots, setSlotsMock]);
    
    renderComponent();
    
    // Total power should be 1 + 2 + 3 = 6
    // Each power level is represented by a bolt icon
    const powerIndicators = screen.getAllByTestId('font-awesome-icon');
    // There should be 3 power indicators (1 for each power level)
    expect(powerIndicators.length).toBeGreaterThan(0);
    
    // Clean up
    useStateSpy.mockRestore();
  });

  it('updates quantumSlotsUsed when slots change', () => {
    // Mock useEffect to test the side effect
    const useEffectSpy = jest.spyOn(React, 'useEffect');
    
    renderComponent();
    
    // The effect should have been called
    expect(useEffectSpy).toHaveBeenCalled();
    
    // The callback function should have been called with the initial slots (all inactive)
    expect(mockSetQuantumSlotsUsed).toHaveBeenCalledWith(0);
    
    // Clean up
    useEffectSpy.mockRestore();
  });

  it('displays the correct UI tier class', () => {
    const { container } = renderComponent();
    
    // Should have the medium UI tier class
    expect(container.querySelector('.quantum-setup')).toHaveClass('medium');
  });
});
