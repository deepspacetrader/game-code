import React, { useEffect, useRef } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import './QuantumScan.scss';

/**
 * QuantumScan component that adds a visual scan effect to market items
 * when the quantum scan ability is active.
 */
const QuantumScan = () => {
    const {
        quantumInventory = [],
        marketRef,
        quantumPower,
        isQuantumScanActive,
    } = useMarketplace();

    // Check if QuantumScan is unlocked and enabled
    const isUnlocked = quantumInventory.includes('QuantumScan') && quantumPower;

    // Scan interval reference
    const scanIntervalRef = useRef(null);

    // Effect to handle the scan activation/deactivation
    useEffect(() => {
        // Don't do anything if not unlocked or no market reference
        if (!isUnlocked || !marketRef?.current) {
            // Clean up if component unmounts or becomes inactive
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
            }
            return;
        }

        const grid = marketRef.current;
        const cells = grid.querySelectorAll('.market-item');

        // Clear any existing interval
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }

        // Only start scanning if explicitly activated
        if (isQuantumScanActive) {
            // Perform an immediate scan
            const performScan = () => {
                cells.forEach((cell) => {
                    cell.classList.add('quantum-scan-active');
                    setTimeout(() => {
                        cell.classList.remove('quantum-scan-active');
                    }, 2000);
                });
            };

            // Perform initial scan
            performScan();

            // Set up interval for continuous scanning (every 5 seconds)
            scanIntervalRef.current = setInterval(performScan, 5000);
        }

        // Cleanup function when dependencies change or component unmounts
        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
            }
            // Clean up any active scan classes
            cells.forEach((cell) => {
                cell.classList.remove('quantum-scan-active');
            });
        };
    }, [isUnlocked, marketRef, isQuantumScanActive]);

    // This component doesn't render anything visible
    return null;
};

export default QuantumScan;
