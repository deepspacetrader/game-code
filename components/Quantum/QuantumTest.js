/**
 * QuantumTest - A test runner and status checker for Quantum components
 *
 * This component provides a testing interface for all Quantum-related components,
 * allowing you to verify their functionality and integration.
 */
import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import './QuantumTest.scss';

// Test utilities are available for use in test files

const QuantumTest = () => {
    const [testResults, setTestResults] = useState({});
    const [isTesting, setIsTesting] = useState(false);
    const [testLog, setTestLog] = useState([]);

    const {
        quantumInventory = [],
        quantumAbilitiesEnabled,
        toggleQuantumAbility,
    } = useMarketplace();

    // Available test suites
    const testSuites = [
        { id: 'quantum-scan', name: 'Quantum Scan', required: ['QuantumScan'] },
        { id: 'quantum-hover', name: 'Quantum Hover', required: ['QuantumHover'] },
        { id: 'quantum-setup', name: 'Quantum Setup', required: ['QuantumSetup'] },
        { id: 'quantum-market', name: 'Quantum Market', required: ['QuantumMarket'] },
        { id: 'trading-area', name: 'Trading Area', required: ['TradingArea'] },
    ];

    // Check which test suites can be run based on available abilities
    const getAvailableTests = () => {
        return testSuites.map((suite) => ({
            ...suite,
            canRun: suite.required.every((ability) => quantumInventory.includes(ability)),
            isEnabled: quantumAbilitiesEnabled,
        }));
    };

    // Run all available tests
    const runAllTests = async () => {
        setIsTesting(true);
        setTestLog((prev) => [...prev, 'Starting test suite...']);

        const availableTests = getAvailableTests().filter((test) => test.canRun);
        const results = {};

        for (const test of availableTests) {
            setTestLog((prev) => [...prev, `Running ${test.name} tests...`]);
            try {
                // In a real implementation, this would import and run the actual test file
                const testModule = await import(`./__tests__/${test.id}.test.js`);
                const suiteResults = await testModule.runTests();
                results[test.id] = suiteResults;

                const passed = suiteResults.every((r) => r.passed);
                setTestLog((prev) => [
                    ...prev,
                    `${test.name}: ${passed ? '✅ PASSED' : '❌ FAILED'}`,
                ]);
            } catch (error) {
                console.error(`Error running ${test.name} tests:`, error);
                setTestLog((prev) => [...prev, `❌ ${test.name}: ERROR - ${error.message}`]);
                results[test.id] = [
                    { name: 'Test suite failed to load', passed: false, error: error.message },
                ];
            }
        }

        setTestResults(results);
        setTestLog((prev) => [...prev, 'Test suite completed.']);
        setIsTesting(false);
    };

    // Toggle quantum abilities for testing
    const toggleQuantumAbilities = () => {
        toggleQuantumAbility();
        setTestLog((prev) => [
            ...prev,
            `Quantum abilities ${quantumAbilitiesEnabled ? 'disabled' : 'enabled'}`,
        ]);
    };

    // Get status of a specific test suite
    const getTestStatus = (testId) => {
        if (!testResults[testId]) return 'not-run';
        return testResults[testId].every((r) => r.passed) ? 'passed' : 'failed';
    };

    return (
        <div className="quantum-test-container">
            <h2>Quantum Components Test Suite</h2>

            <div className="test-controls">
                <button
                    onClick={runAllTests}
                    disabled={isTesting}
                    className="test-button run-tests"
                >
                    {isTesting ? 'Running Tests...' : 'Run All Tests'}
                </button>

                <button
                    onClick={toggleQuantumAbilities}
                    className={`test-button ${quantumAbilitiesEnabled ? 'enabled' : 'disabled'}`}
                >
                    {quantumAbilitiesEnabled ? 'Disable' : 'Enable'} Quantum Abilities
                </button>
            </div>

            <div className="test-suites">
                <h3>Available Test Suites</h3>
                <ul>
                    {getAvailableTests().map((test) => (
                        <li
                            key={test.id}
                            className={`test-suite ${test.canRun ? 'available' : 'unavailable'}`}
                        >
                            <span className="test-name">{test.name}</span>
                            <span className={`test-status ${getTestStatus(test.id)}`}>
                                {test.canRun ? 'Ready' : `Requires: ${test.required.join(', ')}`}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="test-log">
                <h3>Test Output</h3>
                <div className="log-entries">
                    {testLog.map((entry, index) => (
                        <div key={index} className="log-entry">
                            {entry}
                        </div>
                    ))}
                    {testLog.length === 0 && (
                        <div className="log-entry">
                            No test output yet. Click 'Run All Tests' to start.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuantumTest;
